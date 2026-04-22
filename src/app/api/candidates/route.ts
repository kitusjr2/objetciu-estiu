import { db } from '@/lib/db'

const INITIAL_CANDIDATES = [
  { id: 'ian', name: 'Ian', nickname: 'El Conqueridor', photo: '/photos/ian.png', order: 0 },
  { id: 'putraskito', name: 'Putraskito', nickname: 'El Temerari', photo: '/photos/putraskito.png', order: 1 },
  { id: 'pol', name: 'Pol', nickname: 'El Romantico', photo: '/photos/pol.png', order: 2 },
  { id: 'rui', name: 'Rui', nickname: 'El Foc', photo: '/photos/rui.png', order: 3 },
  { id: 'clone', name: 'Clone', nickname: 'El Doble', photo: '/photos/clone.png', order: 4 },
  { id: 'dani', name: 'Dani', nickname: 'El Suau', photo: '/photos/dani.png', order: 5 },
  { id: 'max', name: 'Max', nickname: 'El Max', photo: '/photos/max.png', order: 6 },
  { id: 'debig', name: 'Debig', nickname: 'El Gran', photo: '/photos/debig.png', order: 7 },
  { id: 'baldo', name: 'Baldo', nickname: 'El Valent', photo: '/photos/baldo.png', order: 8 },
  { id: 'roki', name: 'Roki', nickname: 'El Roca', photo: '/photos/roki.png', order: 9 },
]

export async function GET() {
  let candidates = await db.candidate.findMany({ orderBy: { order: 'asc' } })

  // Seed if empty
  if (candidates.length === 0) {
    await db.candidate.createMany({ data: INITIAL_CANDIDATES })
    candidates = await db.candidate.findMany({ orderBy: { order: 'asc' } })
  }

  return Response.json(candidates)
}
