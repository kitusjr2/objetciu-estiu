# Task 1 - Push Notifications Implementation

## Summary
Implemented push notifications for the "Qui lliga més aquest estiu?" app so that when someone increments their "lligatCount", ALL other subscribed users get a notification on their phone.

## Changes Made

### 1. Prisma Schema (`prisma/schema.prisma`)
- Added `PushSubscription` model with fields: `id`, `endpoint` (unique), `p256dh`, `auth`, `userAgent`, `createdAt`
- Pushed schema to local SQLite DB successfully

### 2. Push Subscription API (`src/app/api/push-subscribe/route.ts`)
- **POST**: Upserts a push subscription (creates new or updates existing by endpoint)
- **DELETE**: Removes a push subscription by endpoint
- Validates required fields (endpoint, keys.p256dh, keys.auth)

### 3. Push Helper (`src/lib/push.ts`)
- Configures `web-push` with VAPID details (public/private keys from env vars)
- `sendPushToAll()` function: fetches all subscriptions from DB, sends push notification to each
- Handles expired/invalid subscriptions by removing them (404/410 status codes)
- Uses `Promise.allSettled` for parallel delivery with error resilience

### 4. Candidates API (`src/app/api/candidates/[id]/route.ts`)
- Added import for `sendPushToAll` from `@/lib/push`
- After activity log creation, fires push notification when `lligatCount > candidate.lligatCount`
- Push is fire-and-forget (not awaited) to avoid blocking the API response
- Notification payload includes: title, body with person name + count, icon, URL, personName, type

### 5. Service Worker (`public/sw.js`)
- Replaced old caching logic with new push-aware service worker
- Added `push` event listener: parses JSON payload from push, shows notification with title/body/icon/badge/vibration/actions
- Added `notificationclick` event listener: focuses existing window or opens new one, handles action buttons (Veure/Tancar)
- Simplified fetch handler to basic network-first with cache fallback

### 6. Frontend (`src/app/page.tsx`)
- Added `Bell`, `BellOff` to lucide-react imports
- Added `pushEnabled` state (initialized from localStorage, defaults to true)
- Added `useEffect` for push subscription: subscribes via PushManager with VAPID key, sends subscription to server API
- Added `togglePush` callback: enables/disables push, requests notification permission, subscribes/unsubscribes via API
- Added bell icon button in header (next to sound toggle button)

### 7. Environment (`.env`)
- Added `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`

### 8. Turso Cloud DB
- Created `PushSubscription` table on Turso cloud database using `@libsql/client`

### 9. Dependencies
- Installed `@types/web-push` as dev dependency (web-push was already in package.json)

## Technical Details
- VAPID public key: `BO0XN2awCevIJa4sawE2vsSQZq3uNNdY_UiSFRD0UlFLzajg0_MX8HuA9gebJNoWO1j5KyTquWtqL74fD1oc0bI`
- Push notifications are sent fire-and-forget (not awaited) to avoid blocking the API response
- Expired subscriptions (404/410 responses) are automatically cleaned up from the database
- Service worker bump: cache version updated from v2 to v3

## Verification
- `bun run lint` passes with no errors
- Dev server running on port 3000, serving the app correctly
- All changes committed: `Add push notifications for real-time ligue updates`
