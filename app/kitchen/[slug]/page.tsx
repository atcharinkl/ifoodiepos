'use client'

import { use, useEffect, useState, useCallback } from 'react'

type OrderItem = { id: string; name: string; qty: number; isCancelled: boolean }
type Order = {
  id: string
  status: 'PENDING' | 'COOKING'
  createdAt: string
  table: { tableNumber: number }
  items: OrderItem[]
}

const STATUS_LABEL: Record<string, string> = { PENDING: 'รอทำ', COOKING: 'กำลังทำ' }
const STATUS_NEXT: Record<string, string> = { PENDING: 'COOKING', COOKING: 'SERVED' }
const STATUS_BTN: Record<string, string> = { PENDING: 'เริ่มทำ →', COOKING: 'เสิร์ฟแล้ว ✓' }
const STATUS_COLOR: Record<string, string> = { PENDING: 'border-amber-300 bg-amber-50', COOKING: 'border-green-300 bg-green-50' }
const STATUS_BADGE: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', COOKING: 'bg-green-100 text-green-700' }

export default function KitchenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`/api/kitchen/${slug}/orders`)
    if (res.ok) {
      const data = await res.json()
      setOrders(data.orders)
      setLastUpdate(new Date())
    }
    setLoading(false)
  }, [slug])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId)
    await fetch(`/api/kitchen/${slug}/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    })
    await fetchOrders()
    setUpdating(null)
  }

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff} วิ`
    return `${Math.floor(diff / 60)} นาที`
  }

  const pending = orders.filter((o) => o.status === 'PENDING')
  const cooking = orders.filter((o) => o.status === 'COOKING')

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 bg-gray-900 text-lg">กำลังโหลด...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
        <div>
          <h1 className="font-bold text-xl">🍳 Kitchen Display</h1>
          <p className="text-xs text-gray-400 mt-0.5">อัปเดตทุก 5 วินาที · ล่าสุด {lastUpdate.toLocaleTimeString('th-TH')}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full">รอทำ {pending.length}</span>
          <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full">กำลังทำ {cooking.length}</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[80vh] text-gray-500">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-xl">ไม่มีออเดอร์ค้างอยู่</p>
        </div>
      ) : (
        <div className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orders.map((order) => (
            <div key={order.id} className={`rounded-2xl border-2 p-4 ${STATUS_COLOR[order.status]}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-lg">โต๊ะ {order.table.tableNumber}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{timeAgo(order.createdAt)}</span>
              </div>
              <ul className="space-y-1.5 mb-4">
                {order.items.filter(i => !i.isCancelled).map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-gray-800">
                    <span className="bg-gray-800 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                      {item.qty}
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => updateStatus(order.id, STATUS_NEXT[order.status])}
                disabled={updating === order.id}
                className={`w-full py-2 rounded-xl text-sm font-semibold disabled:opacity-50 ${order.status === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                {updating === order.id ? 'กำลังอัปเดต...' : STATUS_BTN[order.status]}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
