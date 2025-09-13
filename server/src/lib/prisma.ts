import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const buildDatasourceUrl = (): string | undefined => {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    const params = u.searchParams;
    const desiredLimit = process.env.PRISMA_CONNECTION_LIMIT || '5';
    const desiredTimeout = process.env.PRISMA_POOL_TIMEOUT || '10';
    if (!params.has('connection_limit')) params.set('connection_limit', desiredLimit);
    if (!params.has('pool_timeout')) params.set('pool_timeout', desiredTimeout);
    if (process.env.PRISMA_PGBOUNCER === 'true' && !params.has('pgbouncer')) params.set('pgbouncer', 'true');
    u.search = params.toString();
    return u.toString();
  } catch (_) {
    return raw;
  }
};

const datasourceUrl = buildDatasourceUrl();

const resolveLogLevels = (): Prisma.LogLevel[] => {
  const raw = process.env.PRISMA_LOG_LEVELS || process.env.PRISMA_LOG;
  const allowed: Prisma.LogLevel[] = ['query', 'info', 'warn', 'error'];
  if (!raw) return ['error'];
  const levels = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is Prisma.LogLevel => (allowed as string[]).includes(s));
  return levels.length ? levels : ['error'];
};

export const prisma = globalForPrisma.prisma || new PrismaClient({
  // Keep logs minimal by default; customize via PRISMA_LOG_LEVELS="warn,error" or include "query" when debugging
  log: resolveLogLevels(),
  errorFormat: 'pretty',
  ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
