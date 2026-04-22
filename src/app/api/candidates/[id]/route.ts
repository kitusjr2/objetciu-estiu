import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { lligatCount } = body

  if (typeof lligatCount !== 'number' || lligatCount < 0) {
    return Response.json({ error: 'lligatCount must be a non-negative number' }, { status: 400 })
  }

  const candidate = await db.candidate.findUnique({ where: { id } })
  if (!candidate) {
    return Response.json({ error: 'Candidate not found' }, { status: 404 })
  }

  const updated = await db.candidate.update({
    where: { id },
    data: { lligatCount },
  })

  // Log activity
  await db.activityLog.create({
    data: {
      personId: id,
      personName: candidate.name,
      action: lligatCount > candidate.lligatCount ? 'increment' : 'decrement',
      value: lligatCount,
    },
  })

  return Response.json(updated)
}
