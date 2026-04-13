'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

type MenuItem = { id: string; name: string; description: string | null; price: number; imageUrl: string | null; isAvailable: boolean }
type Category = { id: string; name: string; items: MenuItem[] }

const CLOUD_NAME = 'de6rddhza'
const UPLOAD_PRESET = 'qr-order'

export default function MenuTab({ slug, color }: { slug: string; color: string }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newItem, setNewItem] = useState<{ categoryId: string; name: string; description: string; price: string; imageUrl?: string }>({ categoryId: '', name: '', description: '', price: '' })
  const [newCatName, setNewCatName] = useState('')
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '', imageUrl: '' })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const newFileRef = useRef<HTMLInputElement>(null)

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/${slug}/menu`)
    const data = await res.json()
    setCategories(data.categories ?? [])
    setLoading(false)
  }, [slug])

  useEffect(() => { fetchMenu() }, [fetchMenu])

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData })
    const data = await res.json()
    return data.secure_url
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
    await fetchMenu()
    setSaving(false)
  }

  async function handleNewImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadImage(file)
    setNewItem((prev) => ({ ...prev, imageUrl: url }))
    setUploading(false)
  }

  async function addMenuItem() {
    if (!newItem.name || !newItem.price || !newItem.categoryId) return
    setSaving(true)
    await fetch(`/api/admin/${slug}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, price: parseFloat(newItem.price) }),
    })
    setNewItem({ categoryId: '', name: '', description: '', price: '' })
    if (newFileRef.current) newFileRef.current.value = ''
    await fetchMenu()
    setSaving(false)
  }

  async function toggleAvailable(itemId: string, current: boolean) {
    await fetch(`/api/admin/${slug}/menu`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, isAvailable: !current }),
    })
    fetchMenu()
  }

  async function deleteItem(itemId: string) {
    if (!confirm('ลบเมนูนี้?')) return
    await fetch(`/api/admin/${slug}/menu`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId }),
    })
    fetchMenu()
  }

  function openEdit(item: MenuItem) {
    setEditItem(item)
    setEditForm({ name: item.name, description: item.description ?? '', price: String(item.price), imageUrl: item.imageUrl ?? '' })
  }

  async function handleEditImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadImage(file)
    setEditForm((prev) => ({ ...prev, imageUrl: url }))
    setUploading(false)
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
    await fetchMenu()
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-2xl">
      {editItem && (
        <>
          <div className="fixed inset-0 bg-black/40 z-20" onClick={() => setEditItem(null)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl z-30 p-5 max-w-sm mx-auto shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold mb-4">แก้ไขเมนู</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">รูปเมนู</label>
                <div className="flex items-center gap-3">
                  {editForm.imageUrl ? (
                    <img src={editForm.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">🍽️</div>
                  )}
                  <button onClick={() => fileRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded-lg border text-gray-600 hover:bg-gray-50">
                    {uploading ? 'กำลัง upload...' : 'เปลี่ยนรูป'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleEditImageUpload} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ชื่อเมนู</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ราคา</label>
                <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">คำอธิบาย</label>
                <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditItem(null)} className="flex-1 py-2 rounded-lg border text-sm text-gray-500">ยกเลิก</button>
              <button onClick={saveEdit} disabled={saving || uploading}
                className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
                style={{ background: color }}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <p className="font-medium text-sm mb-2">เพิ่มหมวดหมู่</p>
        <div className="flex gap-2">
          <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="ชื่อหมวดหมู่"
            className="flex-1 border rounded-lg px-3 py-1.5 text-sm" />
          <button onClick={addCategory} disabled={saving}
            className="px-4 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-60"
            style={{ background: color }}>+ เพิ่ม</button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
        <p className="font-medium text-sm mb-2">เพิ่มเมนู</p>
        <div className="grid grid-cols-2 gap-2">
          <select value={newItem.categoryId} onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
            className="border rounded-lg px-3 py-1.5 text-sm col-span-2">
            <option value="">เลือกหมวดหมู่</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="ชื่อเมนู" className="border rounded-lg px-3 py-1.5 text-sm" />
          <input value={newItem.price} type="number" onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
            placeholder="ราคา" className="border rounded-lg px-3 py-1.5 text-sm" />
          <input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="คำอธิบาย (ไม่บังคับ)" className="border rounded-lg px-3 py-1.5 text-sm col-span-2" />
          <div className="col-span-2 flex items-center gap-3">
            {newItem.imageUrl ? (
              <img src={newItem.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">🍽️</div>
            )}
            <button type="button" onClick={() => newFileRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg border text-gray-600 hover:bg-gray-50">
              {uploading ? 'กำลัง upload...' : '+ รูปเมนู'}
            </button>
            <input ref={newFileRef} type="file" accept="image/*" className="hidden" onChange={handleNewImageUpload} />
          </div>
          <button onClick={addMenuItem} disabled={saving || uploading}
            className="col-span-2 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-60"
            style={{ background: color }}>
            {saving ? 'กำลังบันทึก...' : '+ เพิ่มเมนู'}
          </button>
        </div>
      </div>

      {loading ? <p className="text-gray-400 text-center py-6">กำลังโหลด...</p> : (
        categories.map((cat) => (
          <div key={cat.id} className="mb-4">
            <h3 className="font-semibold text-sm text-gray-500 mb-2 px-1">{cat.name}</h3>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {cat.items.length === 0 ? (
                <p className="text-gray-300 text-sm text-center py-4">ยังไม่มีเมนู</p>
              ) : (
                cat.items.map((item, idx) => (
                  <div key={item.id} className={`flex items-center gap-3 px-4 py-3 ${idx < cat.items.length - 1 ? 'border-b' : ''}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">🍽️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${!item.isAvailable ? 'line-through text-gray-300' : ''}`}>{item.name}</p>
                      <p className="text-xs text-gray-400">฿{Number(item.price)}</p>
                    </div>
                    <button onClick={() => openEdit(item)} className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-500 shrink-0">แก้ไข</button>
                    <button onClick={() => toggleAvailable(item.id, item.isAvailable)}
                      className={`text-xs px-2 py-1 rounded-full border shrink-0 ${item.isAvailable ? 'border-green-200 text-green-600' : 'border-gray-200 text-gray-400'}`}>
                      {item.isAvailable ? 'มีอยู่' : 'หมด'}
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="text-xs text-red-400 px-1 shrink-0">ลบ</button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
