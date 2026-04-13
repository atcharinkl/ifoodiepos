import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const orders = await prisma.order.findMany({
    where: { storeId: store.id, status: { in: ['PENDING', 'COOKING'] } },
    include: { table: true, items: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ orders })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { orderId, status } = await req.json()

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const order = await prisma.order.findFirst({ where: { id: orderId, storeId: store.id } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const updated = await prisma.order.update({ where: { id: orderId }, data: { status } })
  return NextResponse.json({ order: updated })
}
