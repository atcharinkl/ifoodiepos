'use client'

import { use, useEffect, useState, useCallback, useMemo } from 'react'
import AdminLayout from '../AdminLayout'

type MenuItem = { id: string; name: string; price: number; imageUrl: string | null; isAvailable: boolean; category: { id: string; name: string } }
type Category = { id: string; name: string; items: any[] }
type Table = { id: string; tableNumber: number }
type Store = { id: string; name: string; themeColor: string }
type CartItem = MenuItem & { qty: number }
type OrderItem = { id: string; name: string; qty: number; isCancelled: boolean; priceSnapshot: number }
type Order = { id: string; status: string; createdAt: string; totalAmount: number; table: { tableNumber: number }; items: OrderItem[] }

const STATUS_TH: Record<string, string> = { PENDING: 'รอทำ', COOKING: 'กำลังทำ', SERVED: 'เสิร์ฟแล้ว', REQUESTING_PAYMENT: 'รอชำระ', PAID: 'ชำระแล้ว', CANCELLED: 'ยกเลิก' }
const STATUS_BG: Record<string, string> = { PENDING: '#fef3c7', COOKING: '#dbeafe', SERVED: '#dcfce7', REQUESTING_PAYMENT: '#f3e8ff', PAID: '#f3f4f6', CANCELLED: '#fee2e2' }
const STATUS_TEXT: Record<string, string> = { PENDING: '#92400e', COOKING: '#1e40af', SERVED: '#166534', REQUESTING_PAYMENT: '#7e22ce', PAID: '#6b7280', CANCELLED: '#991b1b' }

export default function POSPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [activeCategory, setActiveCategory] = useState('')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [rightTab, setRightTab] = useState<'cart' | 'order'>('cart')
  const [orders, setOrders] = useState<Order[]>([])

  const color = store?.themeColor ?? '#f97316'

  const allItems: MenuItem[] = useMemo(() =>
    categories.flatMap(c => c.items.map((i: any) => ({ ...i, price: Number(i.price), category: { id: c.id, name: c.name } }))),
    [categories]
  )

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`/api/admin/${slug}/orders`)
    const data = await res.json()
    setOrders(data.orders ?? [])
  }, [slug])

  const fetchAll = useCallback(async () => {
    const [menuRes, tableRes] = await Promise.all([
      fetch(`/api/admin/${slug}/menu`),
      fetch(`/api/admin/${slug}/tables`),
    ])
    const menuData = await menuRes.json()
    const tableData = await tableRes.json()
    setStore(tableData.store)
    setCategories(menuData.categories ?? [])
    setTables(tableData.tables ?? [])
    if (menuData.categories?.length > 0) setActiveCategory(menuData.categories[0].id)
    if (tableData.tables?.length > 0) setSelectedTable(tableData.tables[0])
    await fetchOrders()
    setLoading(false)
  }, [slug, fetchOrders])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const filtered = useMemo(() => {
    let list = allItems
    if (activeCategory) list = list.filter(i => i.category.id === activeCategory)
    if (search.trim()) list = list.filter(i => i.name.includes(search.trim()))
    return list
  }, [allItems, activeCategory, search])

  const tableOrders = useMemo(() =>
    orders.filter(o => selectedTable && o.table.tableNumber === selectedTable.tableNumber && !['PAID', 'CANCELLED'].includes(o.status)),
    [orders, selectedTable]
  )

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const ordersTotal = tableOrders.reduce((s, o) =>
    s + o.items.filter(i => !i.isCancelled).reduce((ss, i) => ss + Number(i.priceSnapshot) * i.qty, 0), 0)
  const tableTotal = ordersTotal + cartTotal
  const outOfStockCount = allItems.filter(i => !i.isAvailable).length
  const paymentPending = tableOrders.some(o => o.status === 'REQUESTING_PAYMENT')

  function addToCart(item: MenuItem) {
    if (!item.isAvailable) return
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      if (ex) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
    setRightTab('cart')
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0))
  }

  async function toggleAvailable(itemId: string, current: boolean) {
    await fetch(`/api/admin/${slug}/menu`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, isAvailable: !current }),
    })
    const res = await fetch(`/api/admin/${slug}/menu`)
    const data = await res.json()
    setCategories(data.categories ?? [])
  }

  async function updateOrderStatus(orderId: string, status: string) {
    await fetch(`/api/admin/${slug}/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    })
    fetchOrders()
  }

  async function toggleItemCancel(itemId: string) {
    await fetch(`/api/admin/${slug}/orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    })
    fetchOrders()
  }

  async function submitOrder() {
    if (!cart.length || !selectedTable) return
    setSubmitting(true)
    await fetch(`/api/order/${slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableNumber: selectedTable.tableNumber,
        items: cart.map(c => ({ id: c.id, name: c.name, price: c.price, qty: c.qty })),
      }),
    })
    setCart([])
    setSuccessMsg(`ส่งออเดอร์โต๊ะ ${selectedTable.tableNumber} แล้ว`)
    setTimeout(() => setSuccessMsg(''), 3000)
    await fetchOrders()
    setRightTab('order')
    setSubmitting(false)
  }

  function printReceipt() {
    if (!selectedTable) return
    const allItems2: { name: string; qty: number; price: number }[] = []
    tableOrders.forEach(o => {
      o.items.filter(i => !i.isCancelled).forEach(i => {
        const ex = allItems2.find(x => x.name === i.name)
        if (ex) ex.qty += i.qty
        else allItems2.push({ name: i.name, qty: i.qty, price: Number(i.priceSnapshot) })
      })
    })
    cart.forEach(c => {
      const ex = allItems2.find(x => x.name === c.name)
      if (ex) ex.qty += c.qty
      else allItems2.push({ name: c.name, qty: c.qty, price: c.price })
    })
    const total = allItems2.reduce((s, i) => s + i.price * i.qty, 0)
    const rows = allItems2.map(i => `<tr><td>${i.name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">฿${i.price * i.qty}</td></tr>`).join('')
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>ใบเสร็จ</title>
    <style>body{font-family:sans-serif;padding:20px;max-width:300px}h2,p{margin:4px 0}table{width:100%;border-collapse:collapse;margin:12px 0}td{padding:4px 0;font-size:13px}hr{margin:8px 0}.total{font-size:16px;font-weight:bold}</style></head>
    <body><h2>${store?.name}</h2><p>โต๊ะ ${selectedTable.tableNumber}</p><p>${new Date().toLocaleString('th-TH')}</p><hr>
    <table><tr><th style="text-align:left">รายการ</th><th>จำนวน</th><th style="text-align:right">ราคา</th></tr>${rows}</table><hr>
    <p class="total">รวม ฿${total}</p>
    <script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
    win.document.close()
  }

  function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return `${diff} วิ`
    if (diff < 3600) return `${Math.floor(diff / 60)} นาที`
    return `${Math.floor(diff / 3600)} ชม.`
  }


  if (loading || !store) return (
    <AdminLayout slug={slug} color="#f97316" storeName="...">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-secondary)' }}>
        กำลังโหลด...
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout slug={slug} color={color} storeName={store.name}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเมนู..."
            style={{ flex: 1, background: '#f7f7f5', borderRadius: 8, border: 'none', padding: '7px 12px', fontSize: 13, color: 'var(--color-text-primary)', outline: 'none' }} />
          {outOfStockCount > 0 && (
            <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {outOfStockCount} หมด
            </span>
          )}
        </div>

        <div style={{ background: '#fff', padding: '10px 16px', display: 'flex', gap: 8, borderBottom: '0.5px solid var(--color-border-tertiary)', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', background: activeCategory === cat.id ? color : '#f3f4f6', color: activeCategory === cat.id ? '#fff' : '#6b7280' }}>
              {cat.name}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
            {filtered.map(item => (
              <div key={item.id} style={{ background: '#fff', borderRadius: 14, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden', opacity: item.isAvailable ? 1 : 0.55 }}>
                <div onClick={() => addToCart(item)} style={{ cursor: item.isAvailable ? 'pointer' : 'default' }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1/1', background: '#f5f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🍽️</div>
                  )}
                  <div style={{ padding: '8px 10px 4px' }}>
                    <p style={{ fontSize: 12, fontWeight: 500, margin: '0 0 3px', color: item.isAvailable ? 'var(--color-text-primary)' : '#9ca3af', textDecoration: item.isAvailable ? 'none' : 'line-through', lineHeight: 1.3 }}>{item.name}</p>
                    {item.isAvailable
                      ? <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color }}>฿{item.price}</p>
                      : <p style={{ fontSize: 11, fontWeight: 500, margin: 0, color: '#ef4444' }}>หมด</p>
                    }
                  </div>
                </div>
                <div style={{ padding: '0 10px 8px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => toggleAvailable(item.id, item.isAvailable)}
                    style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: item.isAvailable ? '0.5px solid #d1d5db' : `0.5px solid ${color}`, background: '#fff', cursor: 'pointer', color: item.isAvailable ? '#9ca3af' : color, fontWeight: 500 }}>
                    {item.isAvailable ? 'ตั้งหมด' : 'มีอยู่'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 300, background: '#fff', borderLeft: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <select value={selectedTable?.id ?? ''} onChange={e => setSelectedTable(tables.find(t => t.id === e.target.value) ?? null)}
              style={{ flex: 1, fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: '#fff', color: 'var(--color-text-primary)' }}>
              {tables.map(t => <option key={t.id} value={t.id}>โต๊ะ {t.tableNumber}</option>)}
            </select>
            <div style={{ fontSize: 13, fontWeight: 500, color, whiteSpace: 'nowrap' }}>฿{tableTotal}</div>
          </div>
          {paymentPending && (
            <div style={{ background: '#f3e8ff', color: '#7e22ce', fontSize: 11, fontWeight: 500, padding: '6px 10px', borderRadius: 8, marginBottom: 8, textAlign: 'center' }}>
              💳 ลูกค้าขอชำระเงิน
            </div>
          )}
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { key: 'cart', label: cartCount > 0 ? `ตะกร้า (${cartCount})` : 'ตะกร้า' },
              { key: 'order', label: tableOrders.length > 0 ? `ออเดอร์ (${tableOrders.length})` : 'ออเดอร์' },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setRightTab(t.key)}
                style={{ flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', background: rightTab === t.key ? color : '#f3f4f6', color: rightTab === t.key ? '#fff' : '#6b7280' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
          {rightTab === 'cart' && (
            cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                <p style={{ fontSize: 24, margin: '0 0 6px' }}>🛒</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>คลิกเมนูเพื่อเพิ่ม</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f5f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🍽️</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>฿{item.price}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width: 20, height: 20, borderRadius: '50%', border: '0.5px solid var(--color-border-secondary)', background: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)' }}>−</button>
                      <span style={{ fontSize: 12, fontWeight: 500, minWidth: 14, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width: 20, height: 20, borderRadius: '50%', background: color, border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>+</button>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, minWidth: 38, textAlign: 'right' }}>฿{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
            )
          )}

          {rightTab === 'order' && (
            tableOrders.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>ไม่มีออเดอร์ค้างอยู่</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tableOrders.map(order => (
                  <div key={order.id} style={{ background: STATUS_BG[order.status] ?? '#f3f4f6', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: STATUS_TEXT[order.status] ?? '#6b7280', background: '#fff', padding: '2px 8px', borderRadius: 20 }}>
                        {STATUS_TH[order.status] ?? order.status}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{timeAgo(order.createdAt)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                      {order.items.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, flex: 1, color: item.isCancelled ? '#9ca3af' : 'var(--color-text-primary)', textDecoration: item.isCancelled ? 'line-through' : 'none' }}>
                            × {item.qty} {item.name}
                          </span>
                          {!['PAID', 'CANCELLED'].includes(order.status) && (
                            <button onClick={() => toggleItemCancel(item.id)}
                              style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, border: item.isCancelled ? `0.5px solid ${color}` : '0.5px solid #fca5a5', background: '#fff', cursor: 'pointer', color: item.isCancelled ? color : '#ef4444', fontWeight: 500 }}>
                              {item.isCancelled ? 'คืน' : 'ยกเลิก'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {!['PAID', 'CANCELLED'].includes(order.status) && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {order.status === 'PENDING' && (
                          <button onClick={() => updateOrderStatus(order.id, 'COOKING')}
                            style={{ flex: 1, padding: '5px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>เริ่มทำ</button>
                        )}
                        {order.status === 'COOKING' && (
                          <button onClick={() => updateOrderStatus(order.id, 'SERVED')}
                            style={{ flex: 1, padding: '5px', borderRadius: 6, border: 'none', background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>เสิร์ฟแล้ว</button>
                        )}
                        {(order.status === 'SERVED' || order.status === 'REQUESTING_PAYMENT') && (
                          <button onClick={() => updateOrderStatus(order.id, 'PAID')}
                            style={{ flex: 1, padding: '5px', borderRadius: 6, border: 'none', background: '#f3e8ff', color: '#7e22ce', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>ยืนยันชำระ ✓</button>
                        )}
                        <button onClick={() => { if (confirm('ยกเลิกออเดอร์?')) updateOrderStatus(order.id, 'CANCELLED') }}
                          style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>ยกเลิก</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
          {successMsg && (
            <div style={{ background: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 500, textAlign: 'center', padding: '7px', borderRadius: 8, marginBottom: 8 }}>
              ✓ {successMsg}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
            <span>ยอดรวมทั้งหมด</span>
            <span style={{ color }}>฿{tableTotal}</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={printReceipt}
              style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 500, border: `1px solid ${color}`, color, background: '#fff', cursor: 'pointer' }}>
              🖨️ ใบเสร็จ
            </button>
            <button onClick={submitOrder} disabled={!cart.length || !selectedTable || submitting}
              style={{ flex: 1, padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 500, border: 'none', background: cart.length && !submitting ? color : '#d1d5db', color: '#fff', cursor: cart.length ? 'pointer' : 'not-allowed' }}>
              {submitting ? 'กำลังส่ง...' : 'ส่งออเดอร์'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
