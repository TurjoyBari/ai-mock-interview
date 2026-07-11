import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPoolConfig(connectionString: string): PoolConfig {
  const isNeon = connectionString.includes("neon.tech");
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");

  // Prefer Neon's pooled connection string in production (…-pooler…).
  return {
    connectionString,
    ssl: isLocal
      ? undefined
      : {
          rejectUnauthorized: isNeon ? false : true,
        },
    // Keep pools small on serverless to avoid exhausting Neon connections
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  };
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool =
    globalForPrisma.pgPool ?? new Pool(createPoolConfig(connectionString));
  globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always reuse in serverless (Vercel) to avoid connection storms
globalForPrisma.prisma = prisma;
