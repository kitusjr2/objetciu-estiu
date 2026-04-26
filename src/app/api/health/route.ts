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
    detail: tursoUrl ? `${tursoUrl.substring(0, 50)}${tursoUrl.length > 50 ? '...' : ''}` : 'NOT SET',
  })
  checks.push({
    name: 'TURSO_AUTH_TOKEN',
    status: tursoToken ? 'ok' : 'error',
    detail: tursoToken ? `Set (${tursoToken.substring(0, 10)}...)` : 'NOT SET',
  })
  checks.push({
    name: 'DATABASE_URL',
    status: dbUrl ? 'ok' : 'error',
    detail: dbUrl ? `${dbUrl.substring(0, 50)}${dbUrl.length > 50 ? '...' : ''}` : 'NOT SET',
  })

  // Check 2: Verify Turso URL is correct (not a placeholder)
  if (tursoUrl) {
    const isPlaceholder = tursoUrl.includes('mydb-user') || tursoUrl.includes('example')
    checks.push({
      name: 'TURSO_URL_VALID',
      status: isPlaceholder ? 'error' : 'ok',
      detail: isPlaceholder ? 'URL appears to be a placeholder! Should be libsql://web-naii.aws-eu-west-1.turso.io' : 'URL format looks valid',
    })
  }

  // Check 3: Database connection
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

  const allOk = checks.every(c => c.status === 'ok')

  return Response.json({
    status: allOk ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks,
  }, { status: allOk ? 200 : 503 })
}
