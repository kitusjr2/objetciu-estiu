import { db } from '@/lib/db'

export async function GET() {
  const logs = await db.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return Response.json(logs)
}
