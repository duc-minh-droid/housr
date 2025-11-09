import { PrismaClient } from '@prisma/client';

// Prisma client is instantiated once and shared across modules
const prisma = new PrismaClient();

export default prisma;
