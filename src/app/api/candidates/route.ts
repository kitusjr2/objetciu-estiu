import { db } from '@/lib/db'

const INITIAL_CANDIDATES = [
  { id: 'ian', name: 'Ian', nickname: 'NiggaNai', photo: '/photos/ian.png', order: 0 },
  { id: 'putraskito', name: 'Putraskito', nickname: 'FunkoPop', photo: '/photos/putraskito.png', order: 1 },
  { id: 'pol', name: 'Pol', nickname: 'micropenedepol', photo: '/photos/pol.png', order: 2 },
  { id: 'rui', name: 'Rui', nickname: 'Lamine Yamal', photo: '/photos/rui.png', order: 3 },
  { id: 'clone', name: 'Clone', nickname: 'Senpai', photo: '/photos/clone.png', order: 4 },
  { id: 'dani', name: 'Dani', nickname: 'Chiquito', photo: '/photos/dani.png', order: 5 },
  { id: 'max', name: 'Max', nickname: 'SirXam', photo: '/photos/max.png', order: 6 },
  { id: 'debig', name: 'Debig', nickname: 'DaVincci', photo: '/photos/debig.png', order: 7 },
  { id: 'baldo', name: 'Baldo', nickname: 'Perro', photo: '/photos/baldo.png', order: 8 },
  { id: 'roki', name: 'Roki', nickname: '1714', photo: '/photos/roki.png', order: 9 },
  { id: 'elrey', name: 'ElRey', nickname: 'Marc Bernades', photo: '/photos/elrey.png', order: 10 },
]

export async function GET() {
  try {
    let candidates = await db.candidate.findMany({ orderBy: { order: 'asc' } })

    // Seed if empty
    if (candidates.length === 0) {
      await db.candidate.createMany({ data: INITIAL_CANDIDATES })
      candidates = await db.candidate.findMany({ orderBy: { order: 'asc' } })
    }

    return Response.json(candidates)
  } catch (error: any) {
    console.error('[candidates] Database error:', error?.message || error)
    return Response.json({
      error: 'Database connection failed',
      detail: error?.message || String(error),
      hint: 'Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables',
      tursoUrl: process.env.TURSO_DATABASE_URL ? `${process.env.TURSO_DATABASE_URL.substring(0, 30)}...` : 'NOT SET',
      tursoTokenSet: !!process.env.TURSO_AUTH_TOKEN,
      dbUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'NOT SET',
    }, { status: 500 })
  }
}
