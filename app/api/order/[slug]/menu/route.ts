import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
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

  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  return NextResponse.json({
    store: { id: store.id, name: store.name, logoUrl: store.logoUrl, themeColor: store.themeColor },
    categories: store.categories,
    items: store.menuItems.map((item) => ({ ...item, price: Number(item.price) })),
  })
}
