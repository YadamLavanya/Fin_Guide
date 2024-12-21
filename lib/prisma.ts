import { PrismaClient } from '@prisma/client'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
  })
}

// In development, use global to prevent multiple instances during hot-reload
export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Proper connection management
const closeConnection = async () => {
  if (globalThis.prisma) {
    await globalThis.prisma.$disconnect()
  }
}

// Handle graceful shutdown
process.on('beforeExit', closeConnection)
process.on('SIGINT', closeConnection)
process.on('SIGTERM', closeConnection)

export { PrismaClient }