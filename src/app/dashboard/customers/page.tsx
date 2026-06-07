'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { getCustomers } from '@/lib/db'
import { STATUS_COLORS } from '@/lib/colors'

const OPERATIONAL_FILTERS = [
  { label: 'All Clients', value: '' },
  { label: 'Needs Discovery Call', value: 'Profile Review' },
  { label: 'Active Matching', value: 'Active Matching' },
  { label: 'Introduction Sent', value: 'Introduction Sent' },
  { label: 'Awaiting Feedback', value: 'Feedback Received' },
  { label: 'Preference Mapping', value: 'Preference Mapping' },
  { label: 'Relationship Progressing', value: 'Relationship Progressing' },
]

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#6B7280' }
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap" style={{ background: colors.bg, color: colors.text }}>
      {status}
    </span>
  )
}

function ProfileCompletenessBar({ value }: { value: number }) {
  const color = value >= 80 ? '#22C55E' : value >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D8' }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-medium" style={{ color }}>{value}%</span>
    </div>
  )
}

export default function CustomersPage() {
  const [allCustomers, setAllCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'completeness'>('name')

  useEffect(() => {
    getCustomers().then(data => { setAllCustomers(data); setLoading(false) })
  }, [])

  const filtered = allCustomers.filter(c => {
    const matchSearch = !search ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase()) ||
      c.profession?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !activeFilter || c.statusTag === activeFilter
    const matchGender = !genderFilter || c.gender === genderFilter
    return matchSearch && matchStatus && matchGender
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'age') return a.age - b.age
    if (sortBy === 'completeness') return (b.profileCompleteness || 0) - (a.profileCompleteness || 0)
    return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1E1E1E' }}>Client Portfolio</h1>
          <p style={{ color: '#6B7280' }}>{allCustomers.length} clients in your portfolio</p>
        </div>
        <Link href="/dashboard/customers/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: '#7A3E3E' }}>
          + Add Client
        </Link>
      </div>

      <div className="flex gap-0 overflow-x-auto mb-6" style={{ borderBottom: '1px solid #E5E0D8' }}>
        {OPERATIONAL_FILTERS.map(f => (
          <button key={f.value} onClick={() => setActiveFilter(f.value)}
            className="px-4 py-2.5 text-sm whitespace-nowrap transition-all"
            style={{
              color: activeFilter === f.value ? '#7A3E3E' : '#6B7280',
              fontWeight: activeFilter === f.value ? '600' : '400',
              borderBottom: activeFilter === f.value ? '2px solid #7A3E3E' : '2px solid transparent',
              marginBottom: '-1px',
              background: 'transparent',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input type="text" placeholder="Search clients by name, city, profession..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: '#E5E0D8', background: '#FFFFFF', color: '#1E1E1E' }} />
        </div>
        <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: '#E5E0D8', background: '#FFFFFF', color: '#1E1E1E' }}>
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: '#E5E0D8', background: '#FFFFFF', color: '#1E1E1E' }}>
          <option value="name">Sort: Name</option>
          <option value="age">Sort: Age</option>
          <option value="completeness">Sort: Profile Completeness</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#7A3E3E', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(client => (
            <Link key={client.id} href={`/dashboard/customers/${client.id}`}
              className="block rounded-2xl p-5 hover:shadow-md transition-all"
              style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold text-white" style={{ background: '#7A3E3E' }}>
                    {client.firstName?.[0]}{client.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1E1E1E' }}>{client.firstName} {client.lastName}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{client.gender} · {client.age} yrs</p>
                  </div>
                </div>
                <StatusBadge status={client.statusTag} />
              </div>
              <div className="mb-4">
                <p className="text-xs mb-1" style={{ color: '#6B7280' }}>
                  {client.city} · {client.maritalStatus}
                  {client.profession ? ` · ${client.profession}` : ''}
                </p>
                {client.religion && <p className="text-xs" style={{ color: '#9CA3AF' }}>{client.religion}</p>}
              </div>
              <div style={{ borderTop: '1px solid #E5E0D8', paddingTop: '12px' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#6B7280' }}>Profile completeness</span>
                  <ProfileCompletenessBar value={client.profileCompleteness || 0} />
                </div>
              </div>
            </Link>
          ))}
          {sorted.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="font-medium mb-1" style={{ color: '#1E1E1E' }}>No clients found</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
