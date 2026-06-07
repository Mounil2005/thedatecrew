'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMatchIntroductions } from '@/lib/db'
import { LABEL_COLORS } from '@/lib/colors'

function AiNote({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const threshold = 90
  const isLong = text && text.length > threshold

  if (!text) return <span style={{ color: '#9CA3AF' }}>—</span>

  return (
    <div>
      <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>
        {expanded || !isLong ? text : `${text.slice(0, threshold)}...`}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs mt-1 font-medium hover:opacity-70 transition-opacity"
          style={{ color: '#7A3E3E' }}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

function formatDate(val: any): string {
  if (!val) return '—'
  const d = val?.toDate ? val.toDate() : new Date(val)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? '#065F46' : score >= 65 ? '#1E40AF' : score >= 50 ? '#92400E' : '#9CA3AF'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: '#E5E0D8' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{score}%</span>
    </div>
  )
}

export default function IntroductionsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLabel, setFilterLabel] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getMatchIntroductions().then(data => {
      setRows(data)
      setLoading(false)
    })
  }, [])

  const filtered = rows.filter(r => {
    const matchLabel = !filterLabel || r.matchLabel === filterLabel
    const matchSearch = !search ||
      r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.matchProfileName?.toLowerCase().includes(search.toLowerCase())
    return matchLabel && matchSearch
  })

  const stats = {
    total: rows.length,
    highPotential: rows.filter(r => r.matchLabel === 'High Potential').length,
    strongFit: rows.filter(r => r.matchLabel === 'Strong Fit').length,
    avgScore: rows.length
      ? Math.round(rows.reduce((s, r) => s + (r.compatibilityScore || 0), 0) / rows.length)
      : 0,
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1E1E1E' }}>Match Introductions</h1>
        <p style={{ color: '#6B7280' }}>All introductions sent across your client portfolio</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Sent', value: stats.total },
          { label: 'High Potential', value: stats.highPotential },
          { label: 'Strong Fit', value: stats.strongFit },
          { label: 'Avg. Score', value: stats.avgScore ? `${stats.avgScore}%` : '—' },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-5 py-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
            <p className="text-xs mb-2" style={{ color: '#6B7280' }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: '#1E1E1E' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by client or match name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-sm px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: '#E5E0D8', background: '#FFFFFF', color: '#1E1E1E' }}
        />
        <select
          value={filterLabel}
          onChange={e => setFilterLabel(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: '#E5E0D8', background: '#FFFFFF', color: '#1E1E1E' }}
        >
          <option value="">All Labels</option>
          <option value="High Potential">High Potential</option>
          <option value="Strong Fit">Strong Fit</option>
          <option value="Good Compatibility">Good Compatibility</option>
          <option value="Worth Exploring">Worth Exploring</option>
        </select>
        <span className="text-sm ml-auto" style={{ color: '#6B7280' }}>{filtered.length} records</span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D8' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#FAF7F2', borderBottom: '1px solid #E5E0D8' }}>
              {['Client', 'Introduced To', 'Score', 'Label', 'AI Note', 'Date Sent'].map(col => (
                <th key={col} className="text-left px-5 py-3 text-xs font-semibold" style={{ color: '#6B7280', letterSpacing: '0.04em' }}>
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-16" style={{ color: '#9CA3AF' }}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: '#7A3E3E', borderTopColor: 'transparent' }} />
                    Loading introductions...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16" style={{ color: '#9CA3AF' }}>
                  {rows.length === 0
                    ? 'No introductions sent yet. Send a match from any client profile.'
                    : 'No results match your filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => {
                const labelColor = LABEL_COLORS[row.matchLabel] || LABEL_COLORS['Worth Exploring']
                return (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #F5F0EB' : 'none',
                      background: '#FFFFFF',
                    }}
                  >
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/customers/${row.customerId}`} className="hover:underline">
                        <p className="font-medium text-sm" style={{ color: '#1E1E1E' }}>{row.customerName}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                          {row.customerGender} · {row.customerAge} yrs · {row.customerCity}
                        </p>
                      </Link>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-sm" style={{ color: '#1E1E1E' }}>
                        {row.matchProfileName || '—'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <ScoreBar score={row.compatibilityScore || 0} />
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: labelColor.bg, color: labelColor.text }}>
                        {row.matchLabel}
                      </span>
                    </td>

                    <td className="px-5 py-4" style={{ maxWidth: '280px' }}>
                      <AiNote text={row.aiExplanation} />
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-xs" style={{ color: '#6B7280' }}>{formatDate(row.sentAt)}</p>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
