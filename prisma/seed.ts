import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.paymentRequest.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.category.deleteMany()
  await prisma.table.deleteMany()
  await prisma.store.deleteMany()

  const store = await prisma.store.create({
    data: {
      slug: 'demo-restaurant',
      name: 'ร้านอาหารสาธิต',
      themeColor: '#f97316',
    },
  })

  const cat1 = await prisma.category.create({
    data: { storeId: store.id, name: 'อาหารจานหลัก', sortOrder: 1 },
  })
  const cat2 = await prisma.category.create({
    data: { storeId: store.id, name: 'เครื่องดื่ม', sortOrder: 2 },
  })

  await prisma.menuItem.createMany({
    data: [
      { storeId: store.id, categoryId: cat1.id, name: 'ข้าวผัดกุ้ง', price: 80, description: 'ข้าวผัดกุ้งสด ใส่ไข่' },
      { storeId: store.id, categoryId: cat1.id, name: 'ผัดกะเพราหมูสับ', price: 70 },
      { storeId: store.id, categoryId: cat1.id, name: 'ต้มยำกุ้ง', price: 120, description: 'ต้มยำน้ำข้น' },
      { storeId: store.id, categoryId: cat2.id, name: 'น้ำเปล่า', price: 15 },
      { storeId: store.id, categoryId: cat2.id, name: 'โค้ก', price: 25 },
    ],
  })

  await prisma.table.createMany({
    data: [
      { storeId: store.id, tableNumber: 1 },
      { storeId: store.id, tableNumber: 2 },
      { storeId: store.id, tableNumber: 3 },
    ],
  })

  console.log('Seed done — store slug:', store.slug)
}

main().catch(console.error).finally(() => prisma.$disconnect())
