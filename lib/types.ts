export type MenuItemWithCategory = {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  category: { id: string; name: string }
}

export type CartItem = MenuItemWithCategory & { qty: number }

export type StoreInfo = {
  id: string
  name: string
  logoUrl: string | null
  themeColor: string
}
