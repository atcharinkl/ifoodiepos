import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const orders = await prisma.order.findMany({
    where: {
      storeId: store.id,
      ...(status && status !== 'ALL' ? { status } : {}),
    },
    include: { table: true, items: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ orders })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await req.json()

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  if (body.orderId && body.status) {
    const order = await prisma.order.findFirst({ where: { id: body.orderId, storeId: store.id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const updated = await prisma.order.update({ where: { id: body.orderId }, data: { status: body.status } })
    return NextResponse.json({ order: updated })
  }

  if (body.itemId) {
    const item = await prisma.orderItem.findFirst({
      where: { id: body.itemId, order: { storeId: store.id } },
    })
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    const updated = await prisma.orderItem.update({
      where: { id: body.itemId },
      data: { isCancelled: !item.isCancelled },
    })
    return NextResponse.json({ item: updated })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
