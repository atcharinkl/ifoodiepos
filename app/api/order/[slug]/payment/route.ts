import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { orderId, method } = await req.json()

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const order = await prisma.order.findFirst({ where: { id: orderId, storeId: store.id } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const existing = await prisma.paymentRequest.findUnique({ where: { orderId } })
  if (existing) return NextResponse.json({ paymentRequest: existing })

  const paymentRequest = await prisma.paymentRequest.create({
    data: { orderId, method: method ?? 'PROMPTPAY' },
  })

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'REQUESTING_PAYMENT' },
  })

  return NextResponse.json({ paymentRequest, promptpayId: store.promptpayId })
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const paymentRequest = await prisma.paymentRequest.findUnique({ where: { orderId: orderId! } })
  return NextResponse.json({ paymentRequest, promptpayId: store.promptpayId })
}
