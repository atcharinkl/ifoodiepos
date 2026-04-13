import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const tables = await prisma.table.findMany({
    where: { storeId: store.id },
    orderBy: { tableNumber: 'asc' },
  })

  return NextResponse.json({ store, tables })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { count } = await req.json()

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const existing = await prisma.table.findMany({
    where: { storeId: store.id },
    orderBy: { tableNumber: 'desc' },
    take: 1,
  })

  const startFrom = existing.length > 0 ? existing[0].tableNumber + 1 : 1
  const data = Array.from({ length: count }, (_, i) => ({
    storeId: store.id,
    tableNumber: startFrom + i,
  }))

  await prisma.table.createMany({ data })

  const tables = await prisma.table.findMany({
    where: { storeId: store.id },
    orderBy: { tableNumber: 'asc' },
  })

  return NextResponse.json({ tables })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { tableId } = await req.json()

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const table = await prisma.table.findFirst({ where: { id: tableId, storeId: store.id } })
  if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

  await prisma.table.delete({ where: { id: tableId } })
  return NextResponse.json({ ok: true })
}
