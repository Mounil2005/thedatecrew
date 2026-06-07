'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      localStorage.setItem('tdc_user', JSON.stringify({
        uid: cred.user.uid,
        email: cred.user.email,
        name: 'Priya Kapoor',
      }))
      router.push('/dashboard')
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#FAF7F2' }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: '#7A3E3E' }}>
        <div>
          <div className="flex items-center gap-3">
            <img src="/image.png" alt="The Date Crew" className="w-10 h-10 rounded-full object-cover" />
            <span className="text-white font-semibold text-lg tracking-tight">The Date Crew</span>
          </div>
        </div>
        <div>
          <blockquote className="text-white/80 text-2xl font-light leading-relaxed mb-8">
            "Great matches are built on deep understanding, not algorithms alone."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium" style={{ background: 'rgba(201,166,107,0.3)', color: '#C9A66B' }}>PK</div>
            <div>
              <p className="text-white font-medium">Priya Kapoor</p>
              <p className="text-white/60 text-sm">Head Matchmaker, The Date Crew</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{ label: 'Active Clients', value: '30+' }, { label: 'Successful Matches', value: '180+' }, { label: 'Cities Covered', value: '18' }].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <p className="text-2xl font-bold" style={{ color: '#C9A66B' }}>{s.value}</p>
              <p className="text-white/60 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <img src="/image.png" alt="The Date Crew" className="w-10 h-10 rounded-full object-cover" />
              <span className="font-semibold text-lg" style={{ color: '#1E1E1E' }}>The Date Crew</span>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1E1E1E' }}>Welcome back</h1>
            <p style={{ color: '#6B7280' }}>Sign in to your matchmaker dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1E1E1E' }}>Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@thedatecrew.com" required
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: '#E5E0D8', background: '#FFFFFF', color: '#1E1E1E' }}
                onFocus={e => e.target.style.borderColor = '#7A3E3E'}
                onBlur={e => e.target.style.borderColor = '#E5E0D8'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1E1E1E' }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••" required
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: '#E5E0D8', background: '#FFFFFF', color: '#1E1E1E' }}
                onFocus={e => e.target.style.borderColor = '#7A3E3E'}
                onBlur={e => e.target.style.borderColor = '#E5E0D8'}
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 px-6 rounded-xl font-medium text-white text-sm transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: '#7A3E3E' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
            <p className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>DEMO CREDENTIALS</p>
            <p className="text-sm" style={{ color: '#1E1E1E' }}><span style={{ color: '#6B7280' }}>Email:</span> admin@thedatecrew.com</p>
            <p className="text-sm" style={{ color: '#1E1E1E' }}><span style={{ color: '#6B7280' }}>Password:</span> matchmaker123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
