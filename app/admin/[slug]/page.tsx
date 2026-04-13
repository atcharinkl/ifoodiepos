'use client'

import { use, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import MenuTab from './MenuTab'

type OrderItem = { id: string; name: string; qty: number; isCancelled: boolean }
type Order = { id: string; status: string; createdAt: string; totalAmount: number; table: { tableNumber: number }; items: OrderItem[] }
type Store = { id: string; name: string; themeColor: string; logoUrl: string | null; promptpayId: string | null }

const STATUS_TABS = ['ALL', 'PENDING', 'COOKING', 'SERVED', 'REQUESTING_PAYMENT', 'PAID', 'CANCELLED']
const STATUS_TH: Record<string, string> = { ALL: 'ทั้งหมด', PENDING: 'รอทำ', COOKING: 'กำลังทำ', SERVED: 'เสิร์ฟแล้ว', REQUESTING_PAYMENT: '💳 รอชำระ', PAID: 'ชำระแล้ว', CANCELLED: 'ยกเลิก' }
const STATUS_COLOR: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', COOKING: 'bg-blue-100 text-blue-700', SERVED: 'bg-green-100 text-green-700', REQUESTING_PAYMENT: 'bg-purple-100 text-purple-700', PAID: 'bg-gray-100 text-gray-500', CANCELLED: 'bg-red-100 text-red-400' }

export default function DashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [tab, setTab] = useState<'orders' | 'menu'>('orders')
  const [store, setStore] = useState<Store | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [paymentCount, setPaymentCount] = useState(0)

  const fetchOrders = useCallback(async () => {
    const q = statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''
    const res = await fetch(`/api/admin/${slug}/orders${q}`)
    const data = await res.json()
    const list = data.orders ?? []
    setOrders(list)
    setPaymentCount(list.filter((o: Order) => o.status === 'REQUESTING_PAYMENT').length)
    setOrdersLoading(false)
  }, [slug, statusFilter])

  const fetchStore = useCallback(async () => {
    const res = await fetch(`/api/admin/${slug}/tables`)
    const data = await res.json()
    if (data.store) setStore(data.store)
  }, [slug])

  useEffect(() => { fetchStore() }, [fetchStore])
  useEffect(() => {
    if (tab === 'orders') {
      fetchOrders()
      const interval = setInterval(fetchOrders, 10000)
      return () => clearInterval(interval)
    }
  }, [tab, fetchOrders])

  async function updateOrderStatus(orderId: string, status: string) {
    await fetch(`/api/admin/${slug}/orders`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, status }) })
    fetchOrders()
  }

  async function toggleItemCancel(itemId: string) {
    await fetch(`/api/admin/${slug}/orders`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) })
    fetchOrders()
  }

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff} วิ`
    if (diff < 3600) return `${Math.floor(diff / 60)} นาที`
    return `${Math.floor(diff / 3600)} ชม.`
  }

  const color = store?.themeColor ?? '#f97316'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-bold text-lg">{store?.name ?? 'Dashboard'}</h1>
            <p className="text-xs text-gray-400">{slug}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/${slug}/pos`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-medium">🍽️ POS</Link>
            <Link href={`/admin/${slug}/qr`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-600">📱 QR</Link>
            <Link href={`/admin/${slug}/settings`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-600">⚙️ ตั้งค่า</Link>
            <Link href={`/order/${slug}/1`} target="_blank" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium text-gray-600">👁️ ดูหน้าร้าน</Link>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'orders', label: `📋 ออเดอร์${paymentCount > 0 ? ` 🔴${paymentCount}` : ''}` },
            { key: 'menu', label: '🍽️ เมนู' },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={tab === t.key ? { background: color, color: '#fff' } : { background: '#f3f4f6', color: '#374151' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'orders' && (
        <div className="p-4">
          {paymentCount > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <span className="text-purple-600 font-medium text-sm">💳 มี {paymentCount} โต๊ะรอชำระเงิน</span>
              <button onClick={() => setStatusFilter('REQUESTING_PAYMENT')} className="ml-auto text-xs text-purple-600 underline">ดู</button>
            </div>
          )}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {STATUS_TABS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={statusFilter === s ? { background: color, color: '#fff', borderColor: color } : { background: '#fff', color: '#374151', borderColor: '#e5e7eb' }}>
                {STATUS_TH[s]}
              </button>
            ))}
          </div>
          {ordersLoading ? <p className="text-gray-400 text-center py-10">กำลังโหลด...</p> : orders.length === 0 ? <p className="text-gray-400 text-center py-10">ไม่มีออเดอร์</p> : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id}
                  className={`bg-white rounded-xl shadow-sm p-4 ${order.status === 'REQUESTING_PAYMENT' ? 'ring-2 ring-purple-300' : ''} ${order.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">โต๊ะ {order.table.tableNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-gray-100'}`}>{STATUS_TH[order.status] ?? order.status}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                      <span className="font-semibold text-sm">฿{Number(order.totalAmount)}</span>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <span className={`flex-1 text-sm ${item.isCancelled ? 'line-through text-gray-300' : 'text-gray-700'}`}>× {item.qty} {item.name}</span>
                        {order.status !== 'CANCELLED' && order.status !== 'PAID' && (
                          <button onClick={() => toggleItemCancel(item.id)}
                            className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${item.isCancelled ? 'border-gray-200 text-gray-400 bg-gray-50' : 'border-red-200 text-red-400 hover:bg-red-50'}`}>
                            {item.isCancelled ? 'คืน' : 'ยกเลิก'}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {order.status !== 'CANCELLED' && order.status !== 'PAID' && (
                    <div className="flex gap-2 flex-wrap border-t pt-3">
                      {order.status === 'PENDING' && <button onClick={() => updateOrderStatus(order.id, 'COOKING')} className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600">เริ่มทำ</button>}
                      {order.status === 'COOKING' && <button onClick={() => updateOrderStatus(order.id, 'SERVED')} className="px-3 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-600">เสิร์ฟแล้ว</button>}
                      {(order.status === 'SERVED' || order.status === 'REQUESTING_PAYMENT') && <button onClick={() => updateOrderStatus(order.id, 'PAID')} className="px-3 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-600">ยืนยันชำระแล้ว ✓</button>}
                      <button onClick={() => { if (confirm('ยกเลิกทั้งออเดอร์?')) updateOrderStatus(order.id, 'CANCELLED') }} className="px-3 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-500 ml-auto">ยกเลิกทั้งหมด</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'menu' && <MenuTab slug={slug} color={color} />}
    </div>
  )
}
