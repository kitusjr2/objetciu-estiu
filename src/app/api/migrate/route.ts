import { db } from '@/lib/db'

export async function POST() {
  const results: { table: string; action: string; status: 'ok' | 'error'; detail?: string }[] = []

  // Ensure all required columns exist in each table
  const migrations: { table: string; column: string; type: string; default: string }[] = [
    { table: 'Ligue', column: 'photoData', type: 'TEXT', default: "''" },
  ]

  for (const m of migrations) {
    try {
      await db.$executeRawUnsafe(
        `ALTER TABLE ${m.table} ADD COLUMN ${m.column} ${m.type} NOT NULL DEFAULT ${m.default}`
      )
      results.push({ table: m.table, action: `ADD COLUMN ${m.column}`, status: 'ok' })
    } catch (error: any) {
      if (error?.message?.includes('duplicate column') || error?.message?.includes('already exists')) {
        results.push({ table: m.table, action: `ADD COLUMN ${m.column}`, status: 'ok', detail: 'already exists' })
      } else {
        results.push({ table: m.table, action: `ADD COLUMN ${m.column}`, status: 'error', detail: error?.message || String(error) })
      }
    }
  }

  const allOk = results.every(r => r.status === 'ok')

  return Response.json({
    status: allOk ? 'ok' : 'error',
    migrations: results,
  }, { status: allOk ? 200 : 500 })
}
