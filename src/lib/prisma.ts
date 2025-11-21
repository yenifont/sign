import { PrismaClient } from '@prisma/client';
import { ensureDatabaseInitialized } from './db-init';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Ensure database is initialized on first use
if (typeof window === 'undefined') {
    ensureDatabaseInitialized().catch(console.error);
}
