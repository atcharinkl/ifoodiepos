'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

type Props = { slug: string; color: string; storeName: string; children: React.ReactNode }

const NAV = [
  { icon: '🍽️', label: 'POS', path: 'pos' },
  { icon: '📋', label: 'เมนู', path: 'menu' },
  { icon: '📱', label: 'QR', path: 'qr' },
  { icon: '🍳', label: 'ครัว', path: 'kitchen' },
]

export default function AdminLayout({ slug, color, storeName, children }: Props) {
  const pathname = usePathname()

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f7f7f5', fontFamily: 'var(--font-sans)' }}>
      <div style={{ width: 68, background: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 4, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
          {storeName[0]}
        </div>
        {NAV.map(nav => {
          const href = `/admin/${slug}/${nav.path}`
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={nav.path} href={href}
              style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, textDecoration: 'none', background: active ? color : 'transparent' }}>
              <span style={{ fontSize: 18 }}>{nav.icon}</span>
              <span style={{ fontSize: 9, color: active ? '#fff' : '#9ca3af' }}>{nav.label}</span>
            </Link>
          )
        })}
        <div style={{ flex: 1 }} />
        <Link href={`/admin/${slug}`}
          style={{ width: 48, height: 48, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, textDecoration: 'none' }}>
          <span style={{ fontSize: 18 }}>⚙️</span>
          <span style={{ fontSize: 9, color: '#9ca3af' }}>ตั้งค่า</span>
        </Link>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}
