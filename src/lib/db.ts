import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  // If using Turso (libsql:// protocol), use the libsql adapter
  if (tursoUrl && (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://'))) {
    try {
      // Dynamic require to avoid build-time issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createClient } = require('@libsql/client')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaLibSQL } = require('@prisma/adapter-libsql')
      const libsql = createClient({ url: tursoUrl, authToken: tursoToken || '' })
      const adapter = new PrismaLibSQL(libsql)
      console.log('[db] Using Turso adapter:', tursoUrl.substring(0, 30) + '...')
      return new PrismaClient({ adapter })
    } catch (error) {
      console.error('[db] Failed to create Turso adapter, falling back to local SQLite:', error)
    }
  }

  // Local SQLite - use standard Prisma client
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
  console.log('[db] Using local SQLite:', dbUrl.substring(0, 30) + '...')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['error', 'warn'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
