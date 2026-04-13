import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await req.json()

  const store = await prisma.store.findUnique({ where: { slug } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const updated = await prisma.store.update({
    where: { id: store.id },
    data: {
      name: body.name ?? store.name,
      themeColor: body.themeColor ?? store.themeColor,
      logoUrl: body.logoUrl ?? store.logoUrl,
      promptpayId: body.promptpayId !== undefined ? body.promptpayId : store.promptpayId,
    },
  })
  return NextResponse.json({ store: updated })
}
