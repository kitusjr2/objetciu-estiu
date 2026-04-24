import { db } from '@/lib/db'
import { sendPushToAll } from '@/lib/push'
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

  // Send push notification on increment
  if (lligatCount > candidate.lligatCount) {
    sendPushToAll({
      title: '🔥 Nova lligada!',
      body: `${candidate.name} ha lligat! (${lligatCount} lligades)`,
      icon: candidate.photo,
      url: '/',
      personName: candidate.name,
      type: 'increment',
    }).catch(console.error)
  }

  return Response.json(updated)
}
