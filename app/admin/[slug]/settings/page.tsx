'use client'

import { use, useEffect, useState, useRef } from 'react'
import AdminLayout from '../AdminLayout'

type Store = { id: string; name: string; themeColor: string; logoUrl: string | null; promptpayId: string | null }

const CLOUD_NAME = 'de6rddhza'
const UPLOAD_PRESET = 'qr-order'

const PRESET_COLORS = ['#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#1a1a1a']

export default function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: '', themeColor: '#f97316', promptpayId: '', logoUrl: '' })
  const logoRef = useRef<HTMLInputElement>(null)

  const color = form.themeColor

  useEffect(() => {
    fetch(`/api/admin/${slug}/tables`).then(r => r.json()).then(data => {
      if (data.store) {
        setStore(data.store)
        setForm({
          name: data.store.name,
          themeColor: data.store.themeColor,
          promptpayId: data.store.promptpayId ?? '',
          logoUrl: data.store.logoUrl ?? '',
        })
      }
      setLoading(false)
    })
  }, [slug])

  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData })
    return (await res.json()).secure_url
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadImage(file)
    setForm(p => ({ ...p, logoUrl: url }))
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/admin/${slug}/store`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  if (loading || !store) return (
    <AdminLayout slug={slug} color="#f97316" storeName="...">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-secondary)' }}>กำลังโหลด...</div>
    </AdminLayout>
  )

  return (
    <AdminLayout slug={slug} color={color} storeName={form.name || store.name}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '12px 20px', borderBottom: '0.5px solid var(--color-border-tertiary)', flexShrink: 0 }}>
        <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>ตั้งค่าร้าน</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: 0 }}>{slug}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Logo */}
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid var(--color-border-tertiary)', padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 14px' }}>โลโก้ร้าน</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {form.logoUrl ? (
                <img src={form.logoUrl} style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: '0.5px solid var(--color-border-tertiary)' }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: 16, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 500 }}>
                  {form.name[0] ?? 'R'}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => logoRef.current?.click()}
                  style={{ padding: '8px 16px', borderRadius: 10, border: '0.5px solid var(--color-border-secondary)', background: '#fff', fontSize: 13, cursor: 'pointer', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {uploading ? 'กำลัง upload...' : '📷 เปลี่ยนโลโก้'}
                </button>
                {form.logoUrl && (
                  <button onClick={() => setForm(p => ({ ...p, logoUrl: '' }))}
                    style={{ padding: '6px 16px', borderRadius: 10, border: '0.5px solid #fca5a5', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#ef4444' }}>
                    ลบโลโก้
                  </button>
                )}
              </div>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            </div>
          </div>

          {/* Store info */}
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid var(--color-border-tertiary)', padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 14px' }}>ข้อมูลร้าน</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 5px' }}>ชื่อร้าน</p>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--color-border-secondary)', fontSize: 14, color: 'var(--color-text-primary)', background: '#fff', boxSizing: 'border-box' as const, outline: 'none' }} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 5px' }}>Slug (URL)</p>
                <div style={{ padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--color-border-tertiary)', fontSize: 14, color: 'var(--color-text-secondary)', background: '#f7f7f5' }}>
                  {slug}
                </div>
              </div>
            </div>
          </div>

          {/* Theme color */}
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid var(--color-border-tertiary)', padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 14px' }}>สีหลัก</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, themeColor: c }))}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: c, border: form.themeColor === c ? '3px solid var(--color-text-primary)' : '2px solid transparent', cursor: 'pointer', outline: form.themeColor === c ? `2px solid ${c}` : 'none', outlineOffset: 2 }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="color" value={form.themeColor} onChange={e => setForm(p => ({ ...p, themeColor: e.target.value }))}
                style={{ width: 40, height: 40, borderRadius: 10, border: '0.5px solid var(--color-border-secondary)', cursor: 'pointer', padding: 2 }} />
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>กำหนดเอง</span>
              <div style={{ flex: 1, height: 36, borderRadius: 10, background: form.themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>{form.themeColor}</span>
              </div>
            </div>
          </div>

          {/* PromptPay */}
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid var(--color-border-tertiary)', padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px' }}>PromptPay</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 14px' }}>เบอร์โทรศัพท์หรือเลขบัตรประชาชน สำหรับรับชำระเงิน</p>
            <input value={form.promptpayId} onChange={e => setForm(p => ({ ...p, promptpayId: e.target.value }))}
              placeholder="เช่น 0812345678"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--color-border-secondary)', fontSize: 14, color: 'var(--color-text-primary)', background: '#fff', boxSizing: 'border-box' as const, outline: 'none' }} />
            {form.promptpayId && (
              <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#f0fdf4', border: '0.5px solid #86efac', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📱</span>
                <p style={{ fontSize: 12, color: '#166534', margin: 0 }}>ลูกค้าจะสามารถสแกน QR PromptPay ชำระเงินได้</p>
              </div>
            )}
          </div>

          {/* Links */}
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid var(--color-border-tertiary)', padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 12px' }}>ลิงก์สำหรับแชร์</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'หน้าสั่งอาหาร (โต๊ะ 1)', path: `/order/${slug}/1` },
                { label: 'POS', path: `/admin/${slug}/pos` },
                { label: 'จัดการเมนู', path: `/admin/${slug}/menu` },
              ].map(link => (
                <div key={link.path} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', flex: 1 }}>{link.label}</span>
                  <code style={{ fontSize: 11, background: '#f7f7f5', padding: '4px 8px', borderRadius: 6, color: 'var(--color-text-secondary)', flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {typeof window !== 'undefined' ? window.location.origin : ''}{link.path}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <button onClick={handleSave} disabled={saving || uploading}
            style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: saved ? '#22c55e' : saving ? '#d1d5db' : color, color: '#fff', fontSize: 14, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
            {saved ? '✓ บันทึกแล้ว' : saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>

        </div>
      </div>
    </AdminLayout>
  )
}
