import { PrismaClient } from '@prisma/client';

// PrismaClient örneğini global olarak tanımla
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Geliştirme ortamında birden fazla Prisma örneği oluşturulmasını önle
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Varsayılan olarak prisma nesnesini dışa aktar
export default prisma; 