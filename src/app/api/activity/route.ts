import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET() {
  try {
    const logs = await db.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    return Response.json(logs)
  } catch (error: any) {
    console.error('[activity] Database error:', error?.message || error)
    return Response.json({ error: 'Database connection failed', detail: error?.message || String(error) }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await db.activityLog.deleteMany()
    return Response.json({ success: true })
  } catch (error: any) {
    console.error('[activity] Delete error:', error?.message || error)
    return Response.json({ error: 'Database operation failed', detail: error?.message || String(error) }, { status: 500 })
  }
}
