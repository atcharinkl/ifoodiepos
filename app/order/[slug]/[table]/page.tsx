import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import OrderClient from './OrderClient'

export default async function OrderPage({
  params,
}: {
  params: Promise<{ slug: string; table: string }>
}) {
  const { slug, table } = await params
  const tableNumber = parseInt(table)
  if (isNaN(tableNumber)) notFound()

  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { sortOrder: 'asc' } },
      menuItems: {
        where: { isAvailable: true },
        include: { category: true },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!store) notFound()

  const tableRecord = await prisma.table.findUnique({
    where: { storeId_tableNumber: { storeId: store.id, tableNumber } },
  })
  if (!tableRecord) notFound()

  const orders = await prisma.order.findMany({
    where: {
      storeId: store.id,
      tableId: tableRecord.id,
      status: { notIn: ['PAID', 'CANCELLED'] },
    },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  })

  const allItems: { name: string; qty: number; price: number }[] = []
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.isCancelled) return
      const existing = allItems.find((i) => i.name === item.name && i.price === Number(item.priceSnapshot))
      if (existing) {
        existing.qty += item.qty
      } else {
        allItems.push({ name: item.name, qty: item.qty, price: Number(item.priceSnapshot) })
      }
    })
  })

  const totalAmount = allItems.reduce((s, i) => s + i.price * i.qty, 0)
  const latestOrder = orders.length > 0 ? orders[orders.length - 1] : null

  const items = store.menuItems.map((item) => ({
    ...item,
    price: Number(item.price),
  }))

  return (
    <OrderClient
      store={{
        id: store.id,
        name: store.name,
        logoUrl: store.logoUrl,
        themeColor: store.themeColor,
        promptpayId: store.promptpayId ?? null,
      }}
      categories={store.categories}
      items={items}
      tableNumber={tableNumber}
      slug={slug}
      initialOrder={latestOrder ? {
        orderId: latestOrder.id,
        total: totalAmount,
        status: latestOrder.status,
        items: allItems,
      } : null}
    />
  )
}
