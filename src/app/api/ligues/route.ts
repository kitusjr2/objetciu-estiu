import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET() {
  const ligues = await db.ligue.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return Response.json(ligues)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { personId, personName, nom, edat, ubi, rating, photoData } = body

  if (!personId || !personName) {
    return Response.json({ error: 'personId and personName are required' }, { status: 400 })
  }

  const ligue = await db.ligue.create({
    data: {
      personId,
      personName,
      nom: nom || '',
      edat: edat || '',
      ubi: ubi || '',
      rating: rating || 0,
      photoData: photoData || '',
    },
  })

  return Response.json(ligue, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, nom, edat, ubi, rating, photoData } = body

  if (!id) {
    return Response.json({ error: 'id is required' }, { status: 400 })
  }

  const ligue = await db.ligue.findUnique({ where: { id } })
  if (!ligue) {
    return Response.json({ error: 'Ligue not found' }, { status: 404 })
  }

  const updated = await db.ligue.update({
    where: { id },
    data: {
      nom: nom ?? ligue.nom,
      edat: edat ?? ligue.edat,
      ubi: ubi ?? ligue.ubi,
      rating: rating ?? ligue.rating,
      ...(photoData !== undefined && { photoData }),
    },
  })

  return Response.json(updated)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    // No id provided - delete ALL ligues (for reset functionality)
    await db.ligue.deleteMany()
    return Response.json({ success: true, deletedAll: true })
  }

  const ligue = await db.ligue.findUnique({ where: { id } })
  if (!ligue) {
    return Response.json({ error: 'Ligue not found' }, { status: 404 })
  }

  await db.ligue.delete({ where: { id } })
  return Response.json({ success: true })
}
