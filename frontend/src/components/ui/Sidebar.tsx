'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard',     label: 'Dashboard' },
  { href: '/incidents',     label: 'Incidents' },
  { href: '/workflows',     label: 'Workflows' },
  { href: '/analytics',     label: 'Analytics' },
  { href: '/organisations', label: 'Organisations' },
]

export default function Sidebar({ userName }: { userName?: string }) {
  const path = usePathname()

  return (
    <aside style={{
      width: 220, background: 'var(--bg)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'fixed', top: 0, left: 0, zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          FOWAS
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>
          Reliability Intelligence
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '8px 0', flex: 1 }}>
        <div style={{ padding: '6px 16px 4px', fontSize: 10, color: 'var(--text-4)', letterSpacing: '0.06em', fontWeight: 500 }}>
          WORKSPACE
        </div>
        {nav.map(({ href, label }) => {
          const active = path === href || path.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', fontSize: 13,
              color: active ? 'var(--text-1)' : 'var(--text-3)',
              background: active ? 'var(--bg-3)' : 'transparent',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
            >
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: active ? 'var(--accent)' : 'var(--border-2)',
                flexShrink: 0,
              }} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--accent-bg)', border: '1px solid var(--border-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, color: 'var(--accent)', fontWeight: 500, flexShrink: 0,
        }}>
          {userName?.slice(0, 2).toUpperCase() || 'AJ'}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userName || 'anonymous'}
        </span>
      </div>
    </aside>
  )
}