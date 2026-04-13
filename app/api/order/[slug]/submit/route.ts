import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { tableNumber, items } = await req.json()

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const table = await prisma.table.findUnique({
    where: { storeId_tableNumber: { storeId: store.id, tableNumber } },
  })
  if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 })

  const total = items.reduce(
    (sum: number, i: { price: number; qty: number }) => sum + i.price * i.qty, 0
  )

  const order = await prisma.order.create({
    data: {
      storeId: store.id,
      tableId: table.id,
      totalAmount: total,
      items: {
        create: items.map((i: { id: string; name: string; price: number; qty: number }) => ({
          menuItemId: i.id,
          name: i.name,
          priceSnapshot: i.price,
          qty: i.qty,
        })),
      },
    },
  })

  return NextResponse.json({ orderId: order.id })
}
