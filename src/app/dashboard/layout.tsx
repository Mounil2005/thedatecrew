'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('tdc_user')
    if (!stored) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(stored))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('tdc_user')
    router.push('/login')
  }

  if (!user) return null

  const initials = (user.name || 'PK')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()

  const navItems = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Clients', href: '/dashboard/customers' },
    { label: 'Introductions', href: '/dashboard/introductions' },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#FAF7F2' }}>
      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col"
        style={{ background: '#FFFFFF', borderRight: '1px solid #E5E0D8' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 gap-3" style={{ borderBottom: '1px solid #E5E0D8' }}>
          <img src="/image.png" alt="The Date Crew" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm leading-tight" style={{ color: '#1E1E1E' }}>
              The Date Crew
            </p>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Matchmaker OS
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p
            className="text-xs font-medium px-3 pb-2 pt-2"
            style={{ color: '#6B7280', letterSpacing: '0.08em' }}
          >
            WORKSPACE
          </p>
          {navItems.map(item => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? '#7A3E3E' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#6B7280',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: '1px solid #E5E0D8' }}>
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
              style={{ background: '#7A3E3E' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#1E1E1E' }}>
                {user.name}
              </p>
              <p className="text-xs truncate" style={{ color: '#6B7280' }}>
                Matchmaker
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs px-2 py-1 rounded-lg transition-all hover:opacity-80 flex-shrink-0"
              style={{ background: '#FAF7F2', color: '#6B7280' }}
            >
              Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">{children}</main>
    </div>
  )
}
