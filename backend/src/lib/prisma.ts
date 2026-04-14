import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const basePrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

export const prisma = basePrisma.$extends({
  result: {
    user: {
      interests: {
        needs: { interests: true },
        compute(user) {
          try {
            return JSON.parse(user.interests);
          } catch (e) {
            return [];
          }
        },
      },
    },
  },
  query: {
    user: {
      async create({ args, query }) {
        if (args.data.interests && Array.isArray(args.data.interests)) {
          args.data.interests = JSON.stringify(args.data.interests) as any;
        }
        return query(args);
      },
      async update({ args, query }) {
        if (args.data.interests && Array.isArray(args.data.interests)) {
          args.data.interests = JSON.stringify(args.data.interests) as any;
        }
        return query(args);
      },
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

