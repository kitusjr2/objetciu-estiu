import { db } from '@/lib/db'

export async function GET() {
  const checks: { name: string; status: 'ok' | 'error'; detail?: string }[] = []

  // Check 1: Environment variables
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  const dbUrl = process.env.DATABASE_URL

  checks.push({
    name: 'TURSO_DATABASE_URL',
    status: tursoUrl ? 'ok' : 'error',
    detail: tursoUrl ? `${tursoUrl.substring(0, 30)}...` : 'NOT SET',
  })
  checks.push({
    name: 'TURSO_AUTH_TOKEN',
    status: tursoToken ? 'ok' : 'error',
    detail: tursoToken ? '***set***' : 'NOT SET',
  })
  checks.push({
    name: 'DATABASE_URL',
    status: dbUrl ? 'ok' : 'error',
    detail: dbUrl ? `${dbUrl.substring(0, 30)}...` : 'NOT SET',
  })

  // Check 2: Database connection
  try {
    const candidateCount = await db.candidate.count()
    checks.push({
      name: 'Database Connection',
      status: 'ok',
      detail: `${candidateCount} candidates found`,
    })
  } catch (error: any) {
    checks.push({
      name: 'Database Connection',
      status: 'error',
      detail: error?.message || String(error),
    })
  }

  const allOk = checks.every(c => c.status === 'ok' || c.name === 'TURSO_AUTH_TOKEN' || c.name === 'TURSO_DATABASE_URL')

  return Response.json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks,
  }, { status: allOk ? 200 : 503 })
}
