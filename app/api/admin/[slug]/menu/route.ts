import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const categories = await prisma.category.findMany({
    where: { storeId: store.id },
    include: { items: { orderBy: { name: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ categories })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await req.json()

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  if (body.type === 'category') {
    const cat = await prisma.category.create({
      data: { storeId: store.id, name: body.name, sortOrder: body.sortOrder ?? 0 },
    })
    return NextResponse.json({ category: cat })
  }

  const item = await prisma.menuItem.create({
    data: {
      storeId: store.id,
      categoryId: body.categoryId,
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      imageUrl: body.imageUrl ?? null,
      isAvailable: true,
    },
  })
  return NextResponse.json({ item })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await req.json()

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const item = await prisma.menuItem.findFirst({ where: { id: body.id, storeId: store.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.menuItem.update({
    where: { id: body.id },
    data: {
      name: body.name ?? item.name,
      description: body.description ?? item.description,
      price: body.price ?? item.price,
      isAvailable: body.isAvailable ?? item.isAvailable,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : item.imageUrl,
    },
  })
  return NextResponse.json({ item: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { id } = await req.json()

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const item = await prisma.menuItem.findFirst({ where: { id, storeId: store.id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.menuItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
