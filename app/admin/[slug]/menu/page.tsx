'use client'

import { use, useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'

type MenuItem = { id: string; name: string; description: string | null; price: number; imageUrl: string | null; isAvailable: boolean }
type Category = { id: string; name: string; items: MenuItem[] }
type Store = { id: string; name: string; themeColor: string }

const CLOUD_NAME = 'de6rddhza'
const UPLOAD_PRESET = 'qr-order'

export default function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeCategory, setActiveCategory] = useState('')
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', imageUrl: '' })
  const [newItem, setNewItem] = useState({ categoryId: '', name: '', description: '', price: '', imageUrl: '' })
  const [newCatName, setNewCatName] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const newFileRef = useRef<HTMLInputElement>(null)

  const color = store?.themeColor ?? '#f97316'

  const fetchAll = useCallback(async () => {
    const [menuRes, tableRes] = await Promise.all([
      fetch(`/api/admin/${slug}/menu`),
      fetch(`/api/admin/${slug}/tables`),
    ])
    const menuData = await menuRes.json()
    const tableData = await tableRes.json()
    setStore(tableData.store)
    const cats = menuData.categories ?? []
    setCategories(cats)
    if (cats.length > 0 && !activeCategory) setActiveCategory(cats[0].id)
    setLoading(false)
  }, [slug, activeCategory])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData })
    return (await res.json()).secure_url
  }

  async function addCategory() {
    if (!newCatName.trim()) return
    setSaving(true)
    await fetch(`/api/admin/${slug}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'category', name: newCatName, sortOrder: categories.length }),
    })
    setNewCatName('')
    await fetchAll()
    setSaving(false)
  }

  async function addMenuItem() {
    if (!newItem.name || !newItem.price || !newItem.categoryId) return
    setSaving(true)
    await fetch(`/api/admin/${slug}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, price: parseFloat(newItem.price) }),
    })
    setNewItem({ categoryId: '', name: '', description: '', price: '', imageUrl: '' })
    if (newFileRef.current) newFileRef.current.value = ''
    setShowAddItem(false)
    await fetchAll()
    setSaving(false)
  }

  async function saveEdit() {
    if (!editItem) return
    setSaving(true)
    await fetch(`/api/admin/${slug}/menu`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editItem.id, name: editForm.name, description: editForm.description, price: parseFloat(editForm.price), imageUrl: editForm.imageUrl || null }),
    })
    setEditItem(null)
    await fetchAll()
    setSaving(false)
  }

  async function toggleAvailable(itemId: string, current: boolean) {
    await fetch(`/api/admin/${slug}/menu`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, isAvailable: !current }),
    })
    fetchAll()
  }

  async function deleteItem(itemId: string) {
    if (!confirm('ลบเมนูนี้?')) return
    await fetch(`/api/admin/${slug}/menu`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId }),
    })
    fetchAll()
  }

  const activeCat = categories.find(c => c.id === activeCategory)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-secondary)' }}>
      กำลังโหลด...
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f7f7f5', fontFamily: 'var(--font-sans)' }}>

      {/* Edit modal */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setEditItem(null)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 500, fontSize: 15, margin: '0 0 16px' }}>แก้ไขเมนู</p>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>รูปเมนู</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {editForm.imageUrl ? (
                  <img src={editForm.imageUrl} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: '#f5f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🍽️</div>
                )}
                <div>
                  <button onClick={() => fileRef.current?.click()}
                    style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: '#fff', cursor: 'pointer', color: 'var(--color-text-primary)', display: 'block', marginBottom: 4 }}>
                    {uploading ? 'กำลัง upload...' : 'เปลี่ยนรูป'}
                  </button>
                  {editForm.imageUrl && (
                    <button onClick={() => setEditForm(p => ({ ...p, imageUrl: '' }))}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '0.5px solid #fca5a5', background: '#fff', cursor: 'pointer', color: '#ef4444' }}>
                      ลบรูป
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); const url = await uploadImage(f); setEditForm(p => ({ ...p, imageUrl: url })); setUploading(false) }} />
              </div>
            </div>
            {[
              { label: 'ชื่อเมนู', key: 'name', type: 'text' },
              { label: 'ราคา (บาท)', key: 'price', type: 'number' },
              { label: 'คำอธิบาย', key: 'description', type: 'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{f.label}</p>
                <input type={f.type} value={(editForm as any)[f.key]}
                  onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', fontSize: 13, color: 'var(--color-text-primary)', background: '#fff', boxSizing: 'border-box' as const }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setEditItem(null)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: '0.5px solid var(--color-border-secondary)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                ยกเลิก
              </button>
              <button onClick={saveEdit} disabled={saving || uploading}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: saving ? '#d1d5db' : color, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#fff' }}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add item modal */}
      {showAddItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setShowAddItem(false)}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, width: '100%', maxWidth: 360, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <p style={{ fontWeight: 500, fontSize: 15, margin: '0 0 16px' }}>เพิ่มเมนูใหม่</p>
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>หมวดหมู่</p>
              <select value={newItem.categoryId} onChange={e => setNewItem(p => ({ ...p, categoryId: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', fontSize: 13, color: 'var(--color-text-primary)', background: '#fff' }}>
                <option value="">เลือกหมวดหมู่</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {[
              { label: 'ชื่อเมนู', key: 'name', type: 'text' },
              { label: 'ราคา (บาท)', key: 'price', type: 'number' },
              { label: 'คำอธิบาย (ไม่บังคับ)', key: 'description', type: 'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{f.label}</p>
                <input type={f.type} value={(newItem as any)[f.key]}
                  onChange={e => setNewItem(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', fontSize: 13, color: 'var(--color-text-primary)', background: '#fff', boxSizing: 'border-box' as const }} />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 6px' }}>รูปเมนู</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {newItem.imageUrl ? (
                  <img src={newItem.imageUrl} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 10, background: '#f5f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🍽️</div>
                )}
                <button onClick={() => newFileRef.current?.click()}
                  style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: '#fff', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                  {uploading ? 'กำลัง upload...' : '+ เลือกรูป'}
                </button>
                <input ref={newFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); const url = await uploadImage(f); setNewItem(p => ({ ...p, imageUrl: url })); setUploading(false) }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowAddItem(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: '0.5px solid var(--color-border-secondary)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                ยกเลิก
              </button>
              <button onClick={addMenuItem} disabled={saving || uploading}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: saving ? '#d1d5db' : color, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#fff' }}>
                {saving ? 'กำลังบันทึก...' : '+ เพิ่มเมนู'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 68, background: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 4, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
          {store?.name[0]}
        </div>
        {([
          { icon: '🍽️', label: 'POS', href: `/admin/${slug}/pos` },
          { icon: '📋', label: 'เมนู', href: null, active: true },
          { icon: '📱', label: 'QR', href: `/admin/${slug}/qr` },
          { icon: '🍳', label: 'ครัว', href: `/kitchen/${slug}` },
        ] as const).map(nav => (
          nav.href ? (
            <Link key={nav.label} href={nav.href} target={nav.label === 'ครัว' || nav.label === 'QR' ? '_blank' : '_self'}
              style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, textDecoration: 'none' }}>
              <span style={{ fontSize: 18 }}>{nav.icon}</span>
              <span style={{ fontSize: 9, color: '#9ca3af' }}>{nav.label}</span>
            </Link>
          ) : (
            <div key={nav.label} style={{ width: 48, height: 48, borderRadius: 12, background: color, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <span style={{ fontSize: 18 }}>{nav.icon}</span>
              <span style={{ fontSize: 9, color: '#fff' }}>{nav.label}</span>
            </div>
          )
        ))}
        <div style={{ flex: 1 }} />
        <Link href={`/admin/${slug}`}
          style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, textDecoration: 'none' }}>
          <span style={{ fontSize: 18 }}>⚙️</span>
          <span style={{ fontSize: 9, color: '#9ca3af' }}>ตั้งค่า</span>
        </Link>
      </div>

      {/* Category sidebar */}
      <div style={{ width: 180, background: '#fff', borderRight: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 8px', color: 'var(--color-text-primary)' }}>หมวดหมู่</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
              placeholder="ชื่อหมวดหมู่..."
              style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', fontSize: 12, color: 'var(--color-text-primary)', background: '#fff', outline: 'none' }} />
            <button onClick={addCategory} disabled={saving}
              style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>+</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ width: '100%', textAlign: 'left', padding: '9px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeCategory === cat.id ? 500 : 400, background: activeCategory === cat.id ? color + '15' : '#fff', color: activeCategory === cat.id ? color : 'var(--color-text-primary)', borderRight: activeCategory === cat.id ? `2px solid ${color}` : '2px solid transparent' }}>
              {cat.name}
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginLeft: 6 }}>({cat.items.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ background: '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>{activeCat?.name ?? 'เมนูทั้งหมด'}</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{activeCat?.items.length ?? 0} รายการ</p>
          </div>
          <button onClick={() => { setNewItem(p => ({ ...p, categoryId: activeCategory })); setShowAddItem(true) }}
            style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: color, color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            + เพิ่มเมนู
          </button>
        </div>

        {/* Menu list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {!activeCat || activeCat.items.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <p style={{ fontSize: 32, margin: '0 0 8px' }}>🍽️</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>ยังไม่มีเมนูในหมวดนี้</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {activeCat.items.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: 16, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden', opacity: item.isAvailable ? 1 : 0.7 }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '1/1', background: '#f5f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🍽️</div>
                  )}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{item.name}</p>
                      {!item.isAvailable && (
                        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: '#fee2e2', color: '#991b1b', flexShrink: 0, marginLeft: 6 }}>หมด</span>
                      )}
                    </div>
                    {item.description && (
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 6px', lineHeight: 1.4 }}>{item.description}</p>
                    )}
                    <p style={{ fontSize: 15, fontWeight: 500, margin: '0 0 12px', color }}> ฿{Number(item.price)}</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditItem(item); setEditForm({ name: item.name, description: item.description ?? '', price: String(item.price), imageUrl: item.imageUrl ?? '' }) }}
                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: '#fff', fontSize: 12, cursor: 'pointer', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        แก้ไข
                      </button>
                      <button onClick={() => toggleAvailable(item.id, item.isAvailable)}
                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: item.isAvailable ? '0.5px solid #d1d5db' : `0.5px solid ${color}`, background: '#fff', fontSize: 12, cursor: 'pointer', color: item.isAvailable ? '#6b7280' : color, fontWeight: 500 }}>
                        {item.isAvailable ? 'ตั้งหมด' : 'มีอยู่'}
                      </button>
                      <button onClick={() => deleteItem(item.id)}
                        style={{ padding: '7px 10px', borderRadius: 8, border: '0.5px solid #fca5a5', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#ef4444' }}>
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
