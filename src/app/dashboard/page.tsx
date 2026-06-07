'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getStats, getCustomers } from '@/lib/db'
import { STATUS_COLORS } from '@/lib/colors'
const JOURNEY_STAGES = ['Profile Review', 'Discovery Session', 'Preference Mapping', 'Active Matching', 'Introduction Sent', 'Feedback Received', 'Relationship Progressing']

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#6B7280' }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: colors.bg, color: colors.text }}>
      {status}
    </span>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, activeMatching: 0, introSent: 0, profileReview: 0 })
  const [recentClients, setRecentClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [s, clients] = await Promise.all([getStats(), getCustomers()])
      setStats(s)
      setRecentClients(clients.slice(0, 6))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7A3E3E', borderTopColor: 'transparent' }} />
    </div>
  )

  const statCards = [
    { label: 'Total Clients', value: stats.total, desc: 'Active in your portfolio', color: '#7A3E3E' },
    { label: 'Active Matching', value: stats.activeMatching, desc: 'Ready for introductions', color: '#C9A66B' },
    { label: 'Introductions Sent', value: stats.introSent, desc: 'Awaiting feedback', color: '#22C55E' },
    { label: 'Profile Review', value: stats.profileReview, desc: 'Needs your attention', color: '#F59E0B' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1E1E1E' }}>Good morning, Priya</h1>
        <p style={{ color: '#6B7280' }}>Here&apos;s what&apos;s happening with your clients today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
            <p className="text-xs font-medium mb-3" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>{card.label.toUpperCase()}</p>
            <p className="text-3xl font-bold mb-1" style={{ color: card.color }}>{card.value}</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-6 mb-8" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
        <h2 className="font-semibold text-base mb-5" style={{ color: '#1E1E1E' }}>Client Journey Stages</h2>
        <div className="flex items-center overflow-x-auto pb-1 gap-0">
          {JOURNEY_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: '#FAF7F2' }}>
                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{i + 1}</span>
                <span className="text-xs" style={{ color: '#1E1E1E' }}>{stage}</span>
              </div>
              {i < JOURNEY_STAGES.length - 1 && <span className="mx-1 text-xs" style={{ color: '#D1D5DB' }}>→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid #E5E0D8' }}>
          <h2 className="font-semibold text-base" style={{ color: '#1E1E1E' }}>Recent Clients</h2>
          <Link href="/dashboard/customers" className="text-sm font-medium hover:opacity-70" style={{ color: '#7A3E3E' }}>View all →</Link>
        </div>
        <div>
          {recentClients.map(client => (
            <Link key={client.id} href={`/dashboard/customers/${client.id}`} className="flex items-center justify-between p-5 hover:bg-stone-50 transition-colors" style={{ borderBottom: '1px solid #F5F0EB' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: '#7A3E3E' }}>
                  {client.firstName?.[0]}{client.lastName?.[0]}
                </div>
                <div>
                  <p className="font-medium text-sm" style={{ color: '#1E1E1E' }}>{client.firstName} {client.lastName}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{client.age} • {client.city} • {client.profession || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-2">
                  <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Profile</p>
                  <p className="text-sm font-semibold" style={{ color: (client.profileCompleteness || 0) >= 80 ? '#22C55E' : '#F59E0B' }}>{client.profileCompleteness || 0}%</p>
                </div>
                <StatusBadge status={client.statusTag} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
