import { db } from '@/lib/db'

export async function POST(request: Request) {
  const body = await request.json()
  const { endpoint, keys, userAgent } = body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: 'Missing subscription data' }, { status: 400 })
  }

  try {
    // Upsert: update if endpoint exists, create if not
    await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || '',
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || '',
      },
    })
    return Response.json({ success: true })
  } catch (error) {
    console.error('Push subscription error:', error)
    return Response.json({ error: 'Failed to save subscription' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const body = await request.json()
  const { endpoint } = body

  if (!endpoint) {
    return Response.json({ error: 'Missing endpoint' }, { status: 400 })
  }

  try {
    await db.pushSubscription.deleteMany({ where: { endpoint } })
    return Response.json({ success: true })
  } catch (error) {
    console.error('Push unsubscription error:', error)
    return Response.json({ error: 'Failed to remove subscription' }, { status: 500 })
  }
}
