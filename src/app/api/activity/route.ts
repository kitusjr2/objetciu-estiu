import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET() {
  const logs = await db.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return Response.json(logs)
}

export async function DELETE() {
  await db.activityLog.deleteMany()
  return Response.json({ success: true })
}
