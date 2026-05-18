# Pasteboard

Pasteboard is a Next.js app for creating and managing presentations, backed by Prisma and Postgres.

## Requirements

- Node.js 20+
- Postgres database

## Environment

Create a `.env` file at the project root:

```
DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

## Install

```
npm install
```

## Prisma client

The Prisma client is generated into `lib/generated/prisma`.

```
npx prisma generate
```

Tip: add a `postinstall` script so deploys always generate the client.

## Development

```
npm run dev
```

Open http://localhost:3000.

## Build

```
npm run build
```

If you see a module-not-found error for `lib/generated/prisma/client`, run `npx prisma generate` and rebuild.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - build for production
- `npm run start` - start production server
- `npm run lint` - lint code

## Deploy (Vercel)

Make sure the Prisma client is generated during deploy:

- Add `postinstall: "prisma generate"` to `package.json` scripts, or
- Change `build` to `prisma generate && next build`

Also set `DATABASE_URL` in Vercel environment variables.
