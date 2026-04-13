'use client'

import { use, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import AdminLayout from '../AdminLayout'

type Table = { id: string; tableNumber: number }
type Store = { id: string; name: string; themeColor: string }

export default function QRPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [qrDataUrls, setQrDataUrls] = useState<Record<number, string>>({})
  const [addCount, setAddCount] = useState(1)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/order/${slug}` : `/order/${slug}`
  const color = store?.themeColor ?? '#f97316'

  async function fetchTables() {
    const res = await fetch(`/api/admin/${slug}/tables`)
    const data = await res.json()
    setStore(data.store)
    setTables(data.tables ?? [])
    setLoading(false)
  }

  async function generateQRs(list: Table[]) {
    const entries = await Promise.all(list.map(async t => {
      const url = `${baseUrl}/${t.tableNumber}`
      const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 })
      return [t.tableNumber, dataUrl] as [number, string]
    }))
    setQrDataUrls(prev => ({ ...prev, ...Object.fromEntries(entries) }))
  }

  useEffect(() => { fetchTables() }, [])
  useEffect(() => { if (tables.length > 0) generateQRs(tables) }, [tables])

  async function handleAdd() {
    setAdding(true)
    const res = await fetch(`/api/admin/${slug}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: addCount }),
    })
    const data = await res.json()
    setTables(data.tables)
    setAdding(false)
  }

  async function handleDelete(tableId: string) {
    await fetch(`/api/admin/${slug}/tables`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId }),
    })
    setTables(prev => prev.filter(t => t.id !== tableId))
  }

  function printOne(tableNumber: number) {
    const qr = qrDataUrls[tableNumber]
    if (!qr) return
    const url = `${baseUrl}/${tableNumber}`
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>QR โต๊ะ ${tableNumber}</title>
    <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
    .card{text-align:center;border:2px solid #e5e7eb;border-radius:16px;padding:32px 40px}
    h1{font-size:28px;margin:0 0 4px}p{color:#6b7280;font-size:14px;margin:0 0 20px}
    img{width:220px;height:220px}small{display:block;margin-top:12px;color:#9ca3af;font-size:11px;word-break:break-all}</style></head>
    <body><div class="card"><h1>โต๊ะ ${tableNumber}</h1><p>${store?.name ?? ''}</p>
    <img src="${qr}"/><small>${url}</small></div>
    <script>window.onload=()=>{window.print();window.close()}<\/script></body></html>`)
    win.document.close()
  }

  if (loading || !store) return (
    <AdminLayout slug={slug} color="#f97316" storeName="...">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-secondary)' }}>กำลังโหลด...</div>
    </AdminLayout>
  )

  return (
    <AdminLayout slug={slug} color={color} storeName={store.name}>
      <style href="qr-print" precedence="default">{`@media print{.no-print{display:none!important}.qr-card{break-inside:avoid;border:2px solid #e5e7eb!important}}`}</style>
      <div style={{ background: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }} className="no-print">
        <div>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>QR Code ประจำโต๊ะ</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{store.name} · {tables.length} โต๊ะ</p>
        </div>
        <button onClick={() => window.print()}
          style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: color, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          🖨️ พิมพ์ทั้งหมด
        </button>
      </div>
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }} className="no-print">
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>เพิ่มโต๊ะ</span>
        <input type="number" min={1} max={20} value={addCount} onChange={e => setAddCount(Number(e.target.value))}
          style={{ width: 56, padding: '6px 8px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', fontSize: 13, textAlign: 'center', color: 'var(--color-text-primary)', background: '#fff' }} />
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>โต๊ะ</span>
        <button onClick={handleAdd} disabled={adding}
          style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: adding ? 0.6 : 1 }}>
          {adding ? 'กำลังเพิ่ม...' : '+ เพิ่ม'}
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {tables.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>🪑</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>ยังไม่มีโต๊ะ</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {tables.map(table => (
              <div key={table.id} className="qr-card" style={{ background: '#fff', borderRadius: 16, padding: 16, textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>
                <p style={{ fontSize: 16, fontWeight: 500, margin: '0 0 2px' }}>โต๊ะ {table.tableNumber}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>{store.name}</p>
                {qrDataUrls[table.tableNumber] ? (
                  <img src={qrDataUrls[table.tableNumber]} style={{ width: '100%', aspectRatio: '1/1', borderRadius: 10 }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1/1', background: '#f5f5f3', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>กำลังสร้าง...</div>
                )}
                <p style={{ fontSize: 10, color: '#d1d5db', margin: '6px 0 10px', wordBreak: 'break-all' }}>{baseUrl}/{table.tableNumber}</p>
                <div className="no-print" style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => printOne(table.tableNumber)}
                    style={{ flex: 1, padding: '6px', borderRadius: 8, border: `0.5px solid ${color}`, background: '#fff', fontSize: 11, cursor: 'pointer', color, fontWeight: 500 }}>พิมพ์</button>
                  <button onClick={() => handleDelete(table.id)}
                    style={{ padding: '6px 8px', borderRadius: 8, border: '0.5px solid #fca5a5', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#ef4444' }}>ลบ</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
