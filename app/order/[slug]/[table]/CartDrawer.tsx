'use client'
import type { CartItem } from '@/lib/types'

type Props = {
  open: boolean
  cart: CartItem[]
  themeColor: string
  total: number
  loading: boolean
  onClose: () => void
  onUpdateQty: (id: string, delta: number) => void
  onSubmit: () => void
}

export default function CartDrawer({ open, cart, themeColor, total, loading, onClose, onUpdateQty, onSubmit }: Props) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-20" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-30 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-lg">ตะกร้าของฉัน</h2>
          <button onClick={onClose} className="text-gray-400 text-xl">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-400">฿{item.price} × {item.qty}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onUpdateQty(item.id, -1)}
                  className="w-7 h-7 rounded-full border flex items-center justify-center text-sm">−</button>
                <span className="text-sm w-4 text-center">{item.qty}</span>
                <button onClick={() => onUpdateQty(item.id, 1)}
                  className="w-7 h-7 rounded-full text-white flex items-center justify-center text-sm"
                  style={{ background: themeColor }}>+</button>
              </div>
              <span className="text-sm font-semibold w-14 text-right">฿{item.price * item.qty}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t">
          <div className="flex justify-between mb-3 font-semibold">
            <span>รวมทั้งหมด</span>
            <span>฿{total}</span>
          </div>
          <button onClick={onSubmit} disabled={loading}
            className="w-full py-3 rounded-full text-white font-medium disabled:opacity-60"
            style={{ background: themeColor }}>
            {loading ? 'กำลังส่ง...' : 'ยืนยันสั่งอาหาร'}
          </button>
        </div>
      </div>
    </>
  )
}
