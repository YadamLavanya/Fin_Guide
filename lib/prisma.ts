import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
})

// Prevent multiple instances during development
if (process.env.NODE_ENV === 'development') {
  if (!global.prisma) {
    global.prisma = prisma
  }
}

export { prisma }