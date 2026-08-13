import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";

/** The only scope this server issues. Every token grants the same access. */
export const SCOPE = "mcp";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const CODE_TTL_SECONDS = 5 * 60;

/**
 * Tokens are 256 bits of CSPRNG output, so a plain SHA-256 is enough — there is
 * no low-entropy secret to brute-force, and unlike bcrypt it stays cheap enough
 * to run on every MCP request.
 */
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function secureToken(prefix: string): string {
  return prefix + randomBytes(32).toString("base64url");
}

/** Constant-time comparison of two hex digests. */
function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * A redirect URI is acceptable if it is https, or http on loopback — the
 * exception OAuth 2.1 carves out for native apps like Claude Code.
 */
export function isAllowedRedirectUri(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (url.protocol === "https:") return true;
  return (
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  );
}

export type ClientRegistration = {
  name: string;
  redirectUris: string[];
  grantTypes: string[];
  tokenAuthMethod: string;
  clientUri?: string | null;
  logoUri?: string | null;
};

/**
 * Registers a client (RFC 7591). Returns the plaintext secret for confidential
 * clients — this is the only time it exists.
 */
export async function registerClient(reg: ClientRegistration) {
  const secret =
    reg.tokenAuthMethod === "none" ? null : secureToken("pb_cs_");

  const client = await prisma.oAuthClient.create({
    data: {
      name: reg.name,
      secretHash: secret ? sha256(secret) : null,
      redirectUris: reg.redirectUris,
      grantTypes: reg.grantTypes,
      tokenAuthMethod: reg.tokenAuthMethod,
      clientUri: reg.clientUri ?? null,
      logoUri: reg.logoUri ?? null,
    },
  });

  return { client, secret };
}

export async function getClient(clientId: string) {
  return prisma.oAuthClient.findUnique({ where: { id: clientId } });
}

export function verifyClientSecret(
  client: { secretHash: string | null },
  secret: string | null
): boolean {
  // A public client authenticates by PKCE alone.
  if (client.secretHash === null) return true;
  if (!secret) return false;
  return hashesMatch(client.secretHash, sha256(secret));
}

/** Verifies an S256 PKCE challenge. `plain` is not accepted (OAuth 2.1). */
export function verifyPkce(challenge: string, verifier: string): boolean {
  const computed = createHash("sha256").update(verifier).digest("base64url");
  return hashesMatch(challenge, computed);
}

export async function issueCode(params: {
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  resource?: string | null;
}): Promise<string> {
  const code = secureToken("pb_ac_");
  await prisma.oAuthCode.create({
    data: {
      hash: sha256(code),
      clientId: params.clientId,
      userId: params.userId,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      resource: params.resource ?? null,
      expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
    },
  });
  return code;
}

/**
 * Exchanges a code exactly once: the row is deleted as it is read, so a replay
 * finds nothing. Returns null when the code is unknown, already used, or stale.
 */
export async function consumeCode(code: string) {
  // `delete` on the unique hash is the atomic step: two concurrent exchanges of
  // the same code cannot both succeed, because only one delete finds a row.
  let row;
  try {
    row = await prisma.oAuthCode.delete({ where: { hash: sha256(code) } });
  } catch {
    return null;
  }

  // Opportunistic sweep; a failure here must not break the exchange.
  prisma.oAuthCode
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {});

  if (row.expiresAt.getTime() < Date.now()) return null;
  return row;
}

export type IssuedTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export async function issueTokens(params: {
  clientId: string;
  userId: string;
  resource?: string | null;
}): Promise<IssuedTokens> {
  const accessToken = secureToken("pb_at_");
  const refreshToken = secureToken("pb_rt_");

  await prisma.oAuthToken.create({
    data: {
      accessHash: sha256(accessToken),
      refreshHash: sha256(refreshToken),
      clientId: params.clientId,
      userId: params.userId,
      resource: params.resource ?? null,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000),
    },
  });

  prisma.oAuthToken
    .deleteMany({
      where: {
        expiresAt: {
          lt: new Date(Date.now() - REFRESH_TOKEN_TTL_SECONDS * 1000),
        },
      },
    })
    .catch(() => {});

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

/**
 * Rotates a refresh token: the presented one is replaced by a fresh pair. An
 * access token that has merely expired can still be refreshed — the refresh
 * token stays valid for REFRESH_TOKEN_TTL_SECONDS past that.
 */
export async function rotateRefreshToken(
  clientId: string,
  refreshToken: string
): Promise<IssuedTokens | null> {
  let row;
  try {
    row = await prisma.oAuthToken.delete({
      where: { refreshHash: sha256(refreshToken), clientId },
    });
  } catch {
    return null;
  }

  const refreshDeadline =
    row.expiresAt.getTime() + REFRESH_TOKEN_TTL_SECONDS * 1000;
  if (refreshDeadline < Date.now()) return null;

  return issueTokens({
    clientId: row.clientId,
    userId: row.userId,
    resource: row.resource,
  });
}

/** Deletes an access or refresh token (RFC 7009). Unknown tokens are a no-op. */
export async function revokeToken(clientId: string, token: string) {
  const hash = sha256(token);
  await prisma.oAuthToken.deleteMany({
    where: {
      clientId,
      OR: [{ accessHash: hash }, { refreshHash: hash }],
    },
  });
}

/**
 * Resolves an access token to a user id, or null when it is unknown or expired.
 */
export async function userIdFromAccessToken(
  token: string
): Promise<string | null> {
  const row = await prisma.oAuthToken.findUnique({
    where: { accessHash: sha256(token) },
    select: { id: true, userId: true, expiresAt: true },
  });
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;

  // Fire-and-forget: a failed bookkeeping write must not reject the request.
  prisma.oAuthToken
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  return row.userId;
}

/**
 * Resolves an `Authorization: Bearer <token>` header to a user id, or null when
 * the header is missing, malformed, or the token is unknown.
 */
export async function userIdFromAuthHeader(
  header: string | null
): Promise<string | null> {
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return null;
  return userIdFromAccessToken(token);
}

/**
 * One row per app the user has authorized, collapsing that app's individual
 * tokens into a single connection.
 */
export async function listConnectedApps(userId: string) {
  const tokens = await prisma.oAuthToken.findMany({
    where: { userId },
    select: {
      clientId: true,
      createdAt: true,
      lastUsedAt: true,
      client: { select: { name: true, clientUri: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const apps = new Map<
    string,
    {
      clientId: string;
      name: string;
      clientUri: string | null;
      connectedAt: Date;
      lastUsedAt: Date | null;
    }
  >();

  for (const t of tokens) {
    const existing = apps.get(t.clientId);
    if (!existing) {
      apps.set(t.clientId, {
        clientId: t.clientId,
        name: t.client.name,
        clientUri: t.client.clientUri,
        connectedAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
      });
      continue;
    }
    // Oldest token is when the app was first connected; newest use wins.
    if (t.createdAt < existing.connectedAt) existing.connectedAt = t.createdAt;
    if (t.lastUsedAt && (!existing.lastUsedAt || t.lastUsedAt > existing.lastUsedAt))
      existing.lastUsedAt = t.lastUsedAt;
  }

  return [...apps.values()];
}

/** Drops every token this user has issued to `clientId`. */
export async function revokeAppForUser(
  userId: string,
  clientId: string
): Promise<boolean> {
  const { count } = await prisma.oAuthToken.deleteMany({
    where: { userId, clientId },
  });
  return count > 0;
}
