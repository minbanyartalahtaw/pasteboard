import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

declare global {
  var _prisma: PrismaClient | undefined;
}

function makeClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const prisma = global._prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") global._prisma = prisma;
