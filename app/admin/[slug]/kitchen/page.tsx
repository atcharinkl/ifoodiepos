'use client'

import { use, useEffect, useState, useCallback } from 'react'
import AdminLayout from '../AdminLayout'

type OrderItem = { id: string; name: string; qty: number; isCancelled: boolean }
type Order = { id: string; status: 'PENDING' | 'COOKING'; createdAt: string; table: { tableNumber: number }; items: OrderItem[] }
type Store = { id: string; name: string; themeColor: string }

const STATUS_LABEL: Record<string, string> = { PENDING: 'รอทำ', COOKING: 'กำลังทำ' }
const STATUS_NEXT: Record<string, string> = { PENDING: 'COOKING', COOKING: 'SERVED' }
const STATUS_BTN: Record<string, string> = { PENDING: 'เริ่มทำ →', COOKING: 'เสิร์ฟแล้ว ✓' }

export default function KitchenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const color = store?.themeColor ?? '#f97316'

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
    fetch(`/api/admin/${slug}/tables`).then(r => r.json()).then(d => setStore(d.store))
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders, slug])

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

  const pending = orders.filter(o => o.status === 'PENDING')
  const cooking = orders.filter(o => o.status === 'COOKING')

  if (!store) return (
    <AdminLayout slug={slug} color="#f97316" storeName="...">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-secondary)' }}>กำลังโหลด...</div>
    </AdminLayout>
  )

  return (
    <AdminLayout slug={slug} color={color} storeName={store.name}>
      <div style={{ background: '#1a1a1a', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: '#fff' }}>Kitchen Display</p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>อัปเดตทุก 5 วินาที · {lastUpdate.toLocaleTimeString('th-TH')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: 12, padding: '4px 12px', borderRadius: 20 }}>รอทำ {pending.length}</span>
          <span style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontSize: 12, padding: '4px 12px', borderRadius: 20 }}>กำลังทำ {cooking.length}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#111' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#6b7280' }}>กำลังโหลด...</div>
        ) : orders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <p style={{ fontSize: 40, margin: '0 0 8px' }}>✅</p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>ไม่มีออเดอร์ค้างอยู่</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {orders.map(order => (
              <div key={order.id} style={{ borderRadius: 16, border: order.status === 'PENDING' ? '2px solid #f59e0b' : '2px solid #22c55e', background: order.status === 'PENDING' ? '#1c1800' : '#001c0a', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>โต๊ะ {order.table.tableNumber}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: order.status === 'PENDING' ? '#f59e0b' : '#22c55e', color: '#000' }}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{timeAgo(order.createdAt)}</span>
                </div>
                <ul style={{ margin: '0 0 12px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {order.items.filter(i => !i.isCancelled).map(item => (
                    <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{item.qty}</span>
                      <span style={{ fontSize: 13, color: '#e5e7eb' }}>{item.name}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => updateStatus(order.id, STATUS_NEXT[order.status])}
                  disabled={updating === order.id}
                  style={{ width: '100%', padding: '8px', borderRadius: 10, border: 'none', background: order.status === 'PENDING' ? '#f59e0b' : '#22c55e', color: '#000', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: updating === order.id ? 0.6 : 1 }}>
                  {updating === order.id ? 'กำลังอัปเดต...' : STATUS_BTN[order.status]}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
