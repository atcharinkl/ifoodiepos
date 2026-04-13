'use client'

import { useState, useMemo } from 'react'
import type { MenuItemWithCategory, CartItem, StoreInfo } from '@/lib/types'

type OrderState = {
  orderId: string
  total: number
  status: string
  items: { name: string; qty: number; price: number }[]
} | null

type Props = {
  store: StoreInfo & { promptpayId?: string | null }
  categories: { id: string; name: string }[]
  items: MenuItemWithCategory[]
  tableNumber: number
  slug: string
  initialOrder: OrderState
}

export default function OrderClient({ store, categories, items, tableNumber, slug, initialOrder }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? '')
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<OrderState>(initialOrder)
  const [orderListOpen, setOrderListOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'PROMPTPAY' | 'CASH'>('PROMPTPAY')
  const [paymentRequested, setPaymentRequested] = useState(initialOrder?.status === 'REQUESTING_PAYMENT')
  const [requestingPayment, setRequestingPayment] = useState(false)

  const color = store.themeColor
  const isPaid = currentOrder?.status === 'PAID'
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const filtered = useMemo(
    () => items.filter((i) => i.category.id === activeCategory),
    [items, activeCategory]
  )

  const outOfStockCount = useMemo(
    () => items.filter((i) => !i.isAvailable).length,
    [items]
  )

  function addToCart(item: MenuItemWithCategory) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id)
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function updateQty(id: string, delta: number) {
    setCart((prev) =>
      prev.map((c) => c.id === id ? { ...c, qty: c.qty + delta } : c).filter((c) => c.qty > 0)
    )
  }

  async function submitOrder() {
    if (!cart.length) return
    setLoading(true)
    try {
      const res = await fetch(`/api/order/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          items: cart.map((c) => ({ id: c.id, name: c.name, price: c.price, qty: c.qty })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentOrder({
          orderId: data.orderId,
          total: cartTotal,
          status: 'PENDING',
          items: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price })),
        })
        setCart([])
        setCartOpen(false)
      }
    } finally {
      setLoading(false)
    }
  }

  async function requestPayment() {
    if (!currentOrder) return
    setRequestingPayment(true)
    await fetch(`/api/order/${slug}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: currentOrder.orderId, method: paymentMethod }),
    })
    setPaymentRequested(true)
    setRequestingPayment(false)
  }

  function getPromptPayQR(id: string, amount: number) {
    return `https://promptpay.io/${encodeURIComponent(id)}/${amount}.png`
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7f5' }}>
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-0 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className="w-10 h-10 object-cover" style={{ borderRadius: 12 }} />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center text-white text-base font-medium"
              style={{ borderRadius: 12, background: color }}>
              {store.name[0]}
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{store.name}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>โต๊ะ {tableNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {outOfStockCount > 0 && (
              <span className="text-xs font-medium px-2 py-1 rounded-lg"
                style={{ background: '#fee2e2', color: '#991b1b' }}>
                {outOfStockCount} หมด
              </span>
            )}
            {currentOrder && !isPaid && (
              <button onClick={() => setOrderListOpen(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-full border"
                style={{ borderColor: color, color }}>
                📋 รายการ
              </button>
            )}
            {currentOrder && !isPaid && !paymentRequested && (
              <button onClick={() => setPaymentOpen(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-full text-white"
                style={{ background: color }}>
                💳 ชำระ
              </button>
            )}
            {paymentRequested && !isPaid && (
              <span className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ background: '#f3e8ff', color: '#7e22ce' }}>⏳ รอพนักงาน</span>
            )}
            {isPaid && (
              <span className="text-xs font-medium px-3 py-1 rounded-full"
                style={{ background: '#dcfce7', color: '#166534' }}>✓ ชำระแล้ว</span>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className="shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={activeCategory === cat.id
                ? { background: color, color: '#fff', border: `1.5px solid ${color}` }
                : { background: '#fff', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-secondary)' }}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      <div className="p-4 pb-28">
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          {categories.find(c => c.id === activeCategory)?.name} · {filtered.length} รายการ
        </p>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => {
            const inCart = cart.find((c) => c.id === item.id)
            const unavailable = !item.isAvailable
            return (
              <div key={item.id} className="bg-white overflow-hidden"
                style={{ borderRadius: 16, border: '0.5px solid var(--color-border-tertiary)', opacity: unavailable ? 0.6 : 1 }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name}
                    className="w-full object-cover" style={{ aspectRatio: '1/1'  }} />
                ) : (
                  <div className="w-full flex items-center justify-center text-3xl"
                    style={{ aspectRatio: '1/1', background: '#f5f5f3' }}>🍽️</div>
                )}
                <div className="p-2.5">
                  <p className="text-sm font-medium leading-tight mb-0.5"
                    style={{ color: 'var(--color-text-primary)' }}>{item.name}</p>
                  {item.description && (
                    <p className="text-xs mb-2 line-clamp-1"
                      style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium" style={{ color }}>฿{item.price}</span>
                    {unavailable ? (
                      <span className="text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: '#f3f4f6', color: '#9ca3af' }}>หมด</span>
                    ) : inCart ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.id, -1)}
                          className="flex items-center justify-center text-sm"
                          style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--color-border-secondary)', background: '#fff', color: 'var(--color-text-primary)' }}>−</button>
                        <span className="text-sm font-medium" style={{ minWidth: 16, textAlign: 'center', color: 'var(--color-text-primary)' }}>{inCart.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)}
                          className="flex items-center justify-center text-sm text-white"
                          style={{ width: 24, height: 24, borderRadius: '50%', background: color, border: 'none' }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => addToCart(item)}
                        className="flex items-center justify-center text-white text-base"
                        style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: 'none', cursor: 'pointer' }}>+</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white px-4 py-3"
          style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
          <button onClick={() => setCartOpen(true)}
            className="w-full flex items-center gap-3 text-white rounded-2xl px-4 py-3"
            style={{ background: color }}>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.25)' }}>{cartCount}</span>
            <span className="flex-1 text-sm font-medium text-left">ดูตะกร้า</span>
            <span className="text-sm font-medium">฿{cartTotal}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setCartOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white flex flex-col"
            style={{ borderRadius: '20px 20px 0 0', maxHeight: '80vh' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <h2 className="font-medium text-base">ตะกร้าของฉัน</h2>
              <button onClick={() => setCartOpen(false)} style={{ color: 'var(--color-text-secondary)', fontSize: 20 }}>✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover shrink-0"
                      style={{ borderRadius: 10 }} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>฿{item.price} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, -1)}
                      className="flex items-center justify-center"
                      style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--color-border-secondary)', background: '#fff', color: 'var(--color-text-primary)', fontSize: 14 }}>−</button>
                    <span className="text-sm font-medium" style={{ width: 16, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)}
                      className="flex items-center justify-center text-white"
                      style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: 'none', fontSize: 14 }}>+</button>
                  </div>
                  <span className="text-sm font-medium" style={{ minWidth: 48, textAlign: 'right' }}>฿{item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4" style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
              <div className="flex justify-between mb-3">
                <span className="font-medium">รวมทั้งหมด</span>
                <span className="font-medium" style={{ color }}>฿{cartTotal}</span>
              </div>
              <button onClick={submitOrder} disabled={loading}
                className="w-full py-3 rounded-2xl text-white font-medium text-sm"
                style={{ background: loading ? '#ccc' : color, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'กำลังส่ง...' : 'ยืนยันสั่งอาหาร'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order List Drawer */}
      {orderListOpen && currentOrder && (
        <div className="fixed inset-0 z-30" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setOrderListOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white flex flex-col"
            style={{ borderRadius: '20px 20px 0 0', maxHeight: '70vh' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <h2 className="font-medium text-base">รายการที่สั่ง</h2>
              <button onClick={() => setOrderListOpen(false)} style={{ color: 'var(--color-text-secondary)', fontSize: 20 }}>✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
              {currentOrder.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: '#f3f4f6', color: 'var(--color-text-secondary)' }}>{item.qty}</span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">฿{item.price * item.qty}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-4" style={{ borderTop: '0.5px solid var(--color-border-tertiary)' }}>
              <div className="flex justify-between mb-3">
                <span className="font-medium">รวมทั้งหมด</span>
                <span className="font-medium" style={{ color }}>฿{currentOrder.total}</span>
              </div>
              {!paymentRequested && !isPaid ? (
                <button onClick={() => { setOrderListOpen(false); setPaymentOpen(true) }}
                  className="w-full py-3 rounded-2xl text-white font-medium text-sm"
                  style={{ background: color, border: 'none', cursor: 'pointer' }}>
                  💳 ชำระเงิน
                </button>
              ) : (
                <div className="w-full py-3 rounded-2xl text-center text-sm font-medium"
                  style={{ background: isPaid ? '#dcfce7' : '#f3e8ff', color: isPaid ? '#166534' : '#7e22ce' }}>
                  {isPaid ? '✓ ชำระเงินแล้ว' : '⏳ รอพนักงานยืนยัน'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentOpen && currentOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setPaymentOpen(false)}>
          <div className="bg-white w-full max-w-sm p-5" style={{ borderRadius: 24 }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-medium text-base text-center mb-1">ชำระเงิน</h3>
            <p className="text-center text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>ยอดรวม ฿{currentOrder.total}</p>
            <div className="flex gap-2 mb-4">
              {(['PROMPTPAY', 'CASH'] as const).map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className="flex-1 py-2 rounded-xl text-sm font-medium"
                  style={paymentMethod === m
                    ? { background: color + '15', color, border: `2px solid ${color}` }
                    : { background: '#fff', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-secondary)' }}>
                  {m === 'PROMPTPAY' ? '📱 PromptPay' : '💵 เงินสด'}
                </button>
              ))}
            </div>
            {paymentMethod === 'PROMPTPAY' && store.promptpayId && (
              <div className="text-center mb-4">
                <img src={getPromptPayQR(store.promptpayId, currentOrder.total)}
                  alt="PromptPay QR" className="w-48 h-48 mx-auto" style={{ borderRadius: 16 }} />
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>{store.promptpayId}</p>
              </div>
            )}
            {paymentMethod === 'PROMPTPAY' && !store.promptpayId && (
              <div className="text-center text-sm py-4 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                ร้านยังไม่ได้ตั้งค่า PromptPay
              </div>
            )}
            {paymentMethod === 'CASH' && (
              <div className="text-center py-4 mb-4">
                <p className="text-4xl mb-2">💵</p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>กดยืนยันเพื่อแจ้งพนักงานเก็บเงิน</p>
              </div>
            )}
            <button onClick={async () => { await requestPayment(); setPaymentOpen(false) }}
              disabled={requestingPayment}
              className="w-full py-3 rounded-2xl text-white font-medium text-sm"
              style={{ background: requestingPayment ? '#ccc' : color, border: 'none', cursor: requestingPayment ? 'not-allowed' : 'pointer' }}>
              {requestingPayment ? 'กำลังแจ้ง...' : paymentMethod === 'CASH' ? 'แจ้งเรียกเก็บเงิน' : 'โอนแล้ว / แจ้งพนักงาน'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
