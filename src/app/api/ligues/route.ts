import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET() {
  try {
    const ligues = await db.ligue.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return Response.json(ligues)
  } catch (error: any) {
    console.error('[ligues] Database error:', error?.message || error)
    // Auto-migrate on schema mismatch, then retry
    if (error?.message?.includes('no such column') || error?.message?.includes('SQL_INPUT_ERROR')) {
      console.log('[ligues] Attempting auto-migration...')
      try {
        await db.$executeRawUnsafe(`ALTER TABLE Ligue ADD COLUMN photoData TEXT NOT NULL DEFAULT ''`)
        console.log('[ligues] Auto-migration successful, retrying query...')
        const ligues = await db.ligue.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
        return Response.json(ligues)
      } catch (migrateError: any) {
        console.error('[ligues] Auto-migration failed:', migrateError?.message)
      }
    }
    // Return empty array instead of error so frontend doesn't break
    return Response.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error('[ligues] POST error:', error?.message || error)
    return Response.json({ error: 'Database operation failed', detail: error?.message || String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error('[ligues] PUT error:', error?.message || error)
    return Response.json({ error: 'Database operation failed', detail: error?.message || String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error('[ligues] DELETE error:', error?.message || error)
    return Response.json({ error: 'Database operation failed', detail: error?.message || String(error) }, { status: 500 })
  }
}
