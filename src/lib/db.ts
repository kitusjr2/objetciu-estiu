import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  // If using Turso (libsql:// protocol), use the libsql adapter
  // IMPORTANT: PrismaLibSQL is a Factory - pass config {url, authToken}, NOT a pre-created client
  if (tursoUrl && (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://'))) {
    try {
      const adapter = new PrismaLibSQL({
        url: tursoUrl,
        authToken: tursoToken || '',
      })
      console.log('[db] Using Turso adapter:', tursoUrl)
      return new PrismaClient({ adapter })
    } catch (error) {
      console.error('[db] Failed to create Turso adapter, falling back:', error)
    }
  }

  // Local SQLite - use standard Prisma client
  console.log('[db] Using local SQLite')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['error', 'warn'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
