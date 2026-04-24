import webpush from 'web-push'
import { db } from './db'

// Configure web-push with VAPID details
if (process.env.VAPID_PRIVATE_KEY && process.env.VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    'mailto:objetciu-estiu@vercel.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function sendPushToAll(payload: {
  title: string
  body: string
  icon?: string
  url?: string
  personName?: string
  type?: string
}) {
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY

  if (!vapidPrivateKey || !vapidPublicKey) {
    console.log('Push notifications not configured (missing VAPID keys)')
    return
  }

  const subscriptions = await db.pushSubscription.findMany()

  if (subscriptions.length === 0) return

  const pushPayload = JSON.stringify(payload)

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload,
          {
            TTL: 86400, // 24 hours - message stays valid if device is offline
            urgency: 'high', // Ensure delivery even in power-saving mode
            topic: 'ligue-update', // Collapse similar notifications
          }
        )
      } catch (error: any) {
        console.error(`Push failed for ${sub.endpoint.substring(0, 50)}: ${error.statusCode} ${error.message?.substring(0, 100)}`)
        // If subscription is expired or invalid, remove it
        if (error.statusCode === 404 || error.statusCode === 410) {
          await db.pushSubscription.deleteMany({
            where: { endpoint: sub.endpoint },
          })
          console.log(`Removed expired subscription: ${sub.endpoint.substring(0, 50)}`)
        }
        throw error
      }
    })
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length
  console.log(`Push sent: ${succeeded} succeeded, ${failed} failed out of ${subscriptions.length} total`)
}
