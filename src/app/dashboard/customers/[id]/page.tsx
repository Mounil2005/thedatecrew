'use client'

import { useEffect, useState, use, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Send, Brain, MapPin, Briefcase,
  GraduationCap, Users, Star, AlertCircle, CheckCircle2, Circle,
  Video, VideoOff, Mic, MicOff, PhoneOff, Copy,
} from 'lucide-react'
import { formatHeight, formatIncome } from '@/lib/utils'
import { getCustomer, getPoolProfiles, addNote, saveDiscoveryCall, saveAreaForAttention, saveMatchRecommendation } from '@/lib/db'
import { computeMatches } from '@/lib/matching-engine'
import { extractInsightsFromTranscript } from '@/lib/ai-extraction'
import { createCall } from '@/lib/webrtc'
import { LABEL_COLORS as MATCH_LABEL_COLORS, STATUS_COLORS } from '@/lib/colors'

function parseJSON(str: string | null | undefined): string[] {
  if (!str) return []
  try { return JSON.parse(str) } catch { return [] }
}

function Tag({ label }: { label: string }) {
  return <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#FAF7F2', color: '#6B7280', border: '1px solid #E5E0D8' }}>{label}</span>
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
      <div className="flex items-center gap-2 mb-5" style={{ borderBottom: '1px solid #E5E0D8', paddingBottom: '16px' }}>
        <span style={{ color: '#7A3E3E' }}>{icon}</span>
        <h3 className="font-semibold text-sm" style={{ color: '#1E1E1E' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start justify-between py-2.5" style={{ borderBottom: '1px solid #F5F0EB' }}>
      <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
      <span className="text-xs font-medium text-right max-w-xs" style={{ color: '#1E1E1E' }}>{value}</span>
    </div>
  )
}

const JOURNEY_STAGES = ['Profile Review', 'Discovery Session', 'Preference Mapping', 'Active Matching', 'Introduction Sent', 'Feedback Received', 'Relationship Progressing']


function SendMatchModal({ match, customer, onClose, onSent }: { match: any; customer: any; onClose: () => void; onSent: () => void }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [intro, setIntro] = useState('')
  const [generatingIntro, setGeneratingIntro] = useState(true)
  const [introCopied, setIntroCopied] = useState(false)

  useEffect(() => {
    async function generateIntro() {
      try {
        const res = await fetch('/api/generate-intro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer, profile: match.profile,
            score: match.score, label: match.label, strengths: match.strengths,
          }),
        })
        const data = await res.json()
        setIntro(data.intro || '')
      } catch {
        setIntro('')
      } finally {
        setGeneratingIntro(false)
      }
    }
    generateIntro()
  }, [])

  function copyIntro() {
    if (!intro) return
    navigator.clipboard.writeText(intro)
    setIntroCopied(true)
    setTimeout(() => setIntroCopied(false), 2000)
  }

  async function handleSend() {
    setSending(true)
    await saveMatchRecommendation(customer.id, {
      matchProfileId: match.profile.id,
      matchProfileName: `${match.profile.firstName} ${match.profile.lastName}`,
      compatibilityScore: match.score,
      strengths: JSON.stringify(match.strengths),
      discussionAreas: JSON.stringify(match.discussionAreas),
      aiExplanation: match.explanation,
      matchLabel: match.label,
      status: 'Sent',
    })
    setSending(false)
    setSent(true)
    setTimeout(() => { onSent(); onClose() }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-lg rounded-3xl p-8" style={{ background: '#FFFFFF' }}>
        {sent ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#F0FDF4' }}>
              <CheckCircle2 size={28} style={{ color: '#22C55E' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#1E1E1E' }}>Introduction Sent!</h3>
            <p className="text-sm" style={{ color: '#6B7280' }}>Match introduction logged and queued for delivery.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: '#1E1E1E' }}>Send Match Introduction</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="rounded-2xl p-5 mb-5" style={{ background: '#FAF7F2', border: '1px solid #E5E0D8' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: '#7A3E3E' }}>
                    {customer.firstName?.[0]}{customer.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1E1E1E' }}>{customer.firstName} {customer.lastName}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{customer.age} • {customer.city}</p>
                  </div>
                </div>
                <span className="text-2xl">⟷</span>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-sm text-right" style={{ color: '#1E1E1E' }}>{match.profile.firstName} {match.profile.lastName}</p>
                    <p className="text-xs text-right" style={{ color: '#6B7280' }}>{match.profile.age} • {match.profile.city}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: '#C9A66B' }}>
                    {match.profile.firstName?.[0]}{match.profile.lastName?.[0]}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #E5E0D8' }}>
                <span className="text-xs" style={{ color: '#6B7280' }}>Compatibility Score</span>
                <span className="text-lg font-bold" style={{ color: '#7A3E3E' }}>{match.score}%</span>
              </div>
            </div>
            <div className="rounded-xl p-4 mb-5" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <p className="text-xs font-medium mb-2" style={{ color: '#166534' }}>Key Compatibility Strengths</p>
              <ul className="space-y-1">
                {match.strengths.slice(0, 3).map((s: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: '#166534' }}><span>✓</span> {s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-4 mb-4" style={{ background: '#FAF7F2', border: '1px solid #E5E0D8' }}>
              <p className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>Match Intelligence</p>
              <p className="text-sm leading-relaxed" style={{ color: '#1E1E1E' }}>{match.explanation}</p>
            </div>

            <div className="rounded-xl p-4 mb-6" style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: '#5B21B6' }}>AI-Generated Introduction</p>
                {intro && (
                  <button onClick={copyIntro} className="text-xs px-2 py-0.5 rounded-md flex items-center gap-1 transition-all"
                    style={{ background: introCopied ? '#EDE9FE' : 'transparent', color: '#5B21B6' }}>
                    <Copy size={10} />{introCopied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              {generatingIntro ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: '#7C3AED', borderTopColor: 'transparent' }} />
                  <span className="text-xs" style={{ color: '#7C3AED' }}>Generating personalised intro...</span>
                </div>
              ) : intro ? (
                <p className="text-sm leading-relaxed" style={{ color: '#4C1D95' }}>{intro}</p>
              ) : (
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Could not generate intro — check your API key.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-medium border" style={{ borderColor: '#E5E0D8', color: '#6B7280' }}>Cancel</button>
              <button onClick={handleSend} disabled={sending} className="flex-1 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-60" style={{ background: '#7A3E3E' }}>
                <Send size={14} />{sending ? 'Sending...' : 'Send Introduction'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function VideoCallSection({
  onTranscriptChange,
  onCallEnded,
}: {
  onTranscriptChange: (text: string) => void
  onCallEnded: (finalTranscript: string) => void
}) {
  const [callState, setCallState] = useState<'idle' | 'starting' | 'active' | 'ended'>('idle')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)
  const [hasRemote, setHasRemote] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const callCleanupRef = useRef<(() => void) | null>(null)
  const recognitionRef = useRef<any>(null)
  const shouldRecognizeRef = useRef(false)
  const finalTextRef = useRef('')

  const callLink = roomId && typeof window !== 'undefined'
    ? `${window.location.origin}/call/${roomId}`
    : null

  useEffect(() => {
    if (callState === 'active') {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }
      if (remoteVideoRef.current && remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current
      }
    }
  }, [callState])

  useEffect(() => {
    return () => {
      shouldRecognizeRef.current = false
      recognitionRef.current?.abort()
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      callCleanupRef.current?.()
    }
  }, [])

  function startRecognition() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    shouldRecognizeRef.current = true
    finalTextRef.current = ''

    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTextRef.current += event.results[i][0].transcript + ' '
        } else {
          interim += event.results[i][0].transcript
        }
      }
      onTranscriptChange(finalTextRef.current + interim)
    }

    recognition.onend = () => {
      if (shouldRecognizeRef.current) {
        try { recognition.start() } catch {}
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setIsTranscribing(false)
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsTranscribing(true)
    } catch {
      setIsTranscribing(false)
    }
  }

  async function startCall() {
    setError(null)
    setCallState('starting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream

      const { roomId: id, pc, cleanup } = await createCall(stream, (remoteStream) => {
        remoteStreamRef.current = remoteStream
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
        setHasRemote(true)
      })

      callCleanupRef.current = () => { cleanup(); pc.close() }
      setRoomId(id)
      setCallState('active')
      startRecognition()
    } catch (err: any) {
      const msg = err.message || 'Could not start call.'
      setError(msg.toLowerCase().includes('permission') ? 'Camera/microphone permission denied.' : msg)
      setCallState('idle')
    }
  }

  function endCall() {
    shouldRecognizeRef.current = false
    recognitionRef.current?.abort()
    setIsTranscribing(false)
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    callCleanupRef.current?.()
    setCallState('ended')
    onCallEnded(finalTextRef.current)
  }

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMicOn(track.enabled)
    if (track.enabled) {
      try { recognitionRef.current?.start() } catch {}
    } else {
      recognitionRef.current?.abort()
    }
  }

  function toggleCamera() {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setCameraOn(track.enabled)
  }

  function copyLink() {
    if (!callLink) return
    navigator.clipboard.writeText(callLink).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  if (callState === 'ended') {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <CheckCircle2 size={18} style={{ color: '#22C55E' }} />
        <div>
          <p className="font-medium text-sm" style={{ color: '#166534' }}>Call ended — extracting insights...</p>
          <p className="text-xs mt-0.5" style={{ color: '#22C55E' }}>Transcript auto-filled below and being processed</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D8', background: '#FFFFFF' }}>
      {(callState === 'idle' || callState === 'starting') && (
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FDF2F2' }}>
              <Video size={16} style={{ color: '#7A3E3E' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#1E1E1E' }}>Live Discovery Call</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>P2P video with automatic transcription</p>
            </div>
          </div>
          {error && (
            <div className="rounded-xl px-3 py-2 mb-3 text-xs" style={{ background: '#FFF5F5', color: '#DC2626', border: '1px solid #FCA5A5' }}>
              {error}
            </div>
          )}
          <button
            onClick={startCall}
            disabled={callState === 'starting'}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
            style={{ background: '#7A3E3E' }}
          >
            {callState === 'starting' ? 'Starting...' : 'Start Call'}
          </button>
          <div className="mt-4 rounded-xl p-3" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#92400E' }}>Reviewer Note</p>
            <p className="text-xs leading-relaxed" style={{ color: '#9A3412' }}>
              Requires Chrome or Edge. WebRTC P2P via Firebase Firestore signaling — free, no media relay server.
              Transcription uses Chrome&apos;s built-in Speech API (en-US, free). Use <strong>speakers, not headphones</strong> for both-voice capture.
              TURN server not configured — may fail on strict corporate NAT.
              <br /><br />
              <strong>Client access:</strong> The shareable link works immediately once deployed to Vercel.
              Locally on localhost, only devices on the same WiFi network can join. For remote testing without deployment, run <code>ngrok http 3002</code> and share the ngrok URL instead.
            </p>
          </div>
        </div>
      )}

      {callState === 'active' && (
        <>
          <div className="relative" style={{ background: '#0F0F0F', aspectRatio: '16/9' }}>
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {!hasRemote && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'rgba(255,255,255,0.8)' }} />
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Waiting for client to join...</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Copy the link below and send it to them</p>
              </div>
            )}
            <div className="absolute bottom-3 right-3 w-28 rounded-xl overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.12)', background: '#1a1a1a' }}>
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full block" />
            </div>
          </div>

          <div className="p-4" style={{ background: '#FFFFFF' }}>
            {callLink && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono truncate" style={{ background: '#FAF7F2', border: '1px solid #E5E0D8', color: '#6B7280' }}>
                  {callLink}
                </div>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
                  style={{ background: linkCopied ? '#F0FDF4' : '#7A3E3E', color: linkCopied ? '#166534' : '#FFFFFF' }}
                >
                  <Copy size={11} />
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: micOn ? '#FAF7F2' : '#FEE2E2', border: '1px solid #E5E0D8' }}
                title={micOn ? 'Mute' : 'Unmute'}
              >
                {micOn
                  ? <Mic size={16} style={{ color: '#7A3E3E' }} />
                  : <MicOff size={16} style={{ color: '#EF4444' }} />}
              </button>
              <button
                onClick={toggleCamera}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: cameraOn ? '#FAF7F2' : '#FEE2E2', border: '1px solid #E5E0D8' }}
                title={cameraOn ? 'Stop camera' : 'Start camera'}
              >
                {cameraOn
                  ? <Video size={16} style={{ color: '#7A3E3E' }} />
                  : <VideoOff size={16} style={{ color: '#EF4444' }} />}
              </button>

              {isTranscribing ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg ml-1" style={{ background: '#FDF2F2' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#EF4444' }} />
                  <span className="text-xs font-medium" style={{ color: '#7A3E3E' }}>Transcribing</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg ml-1" style={{ background: '#F3F4F6' }}>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>Transcription unavailable (use Chrome)</span>
                </div>
              )}

              <button
                onClick={endCall}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: '#EF4444' }}
              >
                <PhoneOff size={14} />End Call
              </button>
            </div>
          </div>
        </>
      )}

      {callState === 'starting' && (
        <div style={{ display: 'none' }}>
          <video ref={localVideoRef} />
          <video ref={remoteVideoRef} />
        </div>
      )}
    </div>
  )
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'journey' | 'matches' | 'discovery' | 'notes'>('profile')
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [processingTranscript, setProcessingTranscript] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const [cust, pool] = await Promise.all([getCustomer(id), getPoolProfiles()])
    setCustomer(cust)
    if (cust) {
      const computed = computeMatches(cust, pool)
      setMatches(computed.slice(0, 20))
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [id])

  async function handleAddNote() {
    if (!newNote.trim()) return
    setAddingNote(true)
    await addNote(id, newNote)
    setNewNote('')
    setAddingNote(false)
    loadData()
  }

  async function handleProcessTranscript(textOverride?: string) {
    const text = textOverride !== undefined ? textOverride : transcript
    if (!text.trim()) return
    setProcessingTranscript(true)
    const insights = extractInsightsFromTranscript(text)
    await saveDiscoveryCall(id, {
      transcriptText: text,
      relationshipGoals: insights.relationshipGoals,
      coreValues: JSON.stringify(insights.coreValues),
      dealbreakers: JSON.stringify(insights.dealbreakers),
      familyExpectations: insights.familyExpectations,
      relocationPreference: insights.relocationPreference,
      lifestylePreferences: JSON.stringify(insights.lifestylePreferences),
      partnerExpectations: insights.partnerExpectations,
    })
    if (insights.dealbreakers.length > 5) {
      await saveAreaForAttention(id, { category: 'Restrictive Preferences', description: 'Client has listed many dealbreakers which may narrow the pool.', severity: 'medium' })
    }
    if (insights.relocationPreference === 'No') {
      await saveAreaForAttention(id, { category: 'Location Flexibility', description: 'Client is not open to relocation. This may limit matching options.', severity: 'low' })
    }
    setTranscript('')
    setProcessingTranscript(false)
    loadData()
  }

  if (loading || !customer) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#7A3E3E', borderTopColor: 'transparent' }} />
    </div>
  )

  const latestDiscovery = customer.discoveryCalls?.[0]
  const completeness = customer.profileCompleteness || 0
  const completenessColor = completeness >= 80 ? '#22C55E' : completeness >= 60 ? '#F59E0B' : '#EF4444'
  const TABS = [
    { key: 'profile', label: 'Biodata' },
    { key: 'journey', label: 'Journey' },
    { key: 'matches', label: `Matches (${matches.length})` },
    { key: 'discovery', label: 'Discovery Call' },
    { key: 'notes', label: `Notes (${customer.notes?.length || 0})` },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link href="/dashboard/customers" className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-70" style={{ color: '#6B7280' }}>
        <ArrowLeft size={16} />Back to Clients
      </Link>

      <div className="rounded-3xl p-6 mb-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: '#7A3E3E' }}>
            {customer.firstName?.[0]}{customer.lastName?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: '#1E1E1E' }}>{customer.firstName} {customer.lastName}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm" style={{ color: '#6B7280' }}>{customer.gender} · {customer.age} yrs</span>
                  <span className="text-sm" style={{ color: '#6B7280' }}>📍 {customer.city}</span>
                  <span className="text-sm" style={{ color: '#6B7280' }}>{customer.maritalStatus}</span>
                  {customer.religion && <span className="text-sm" style={{ color: '#6B7280' }}>{customer.religion}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block px-2.5 py-1 rounded text-xs font-medium mb-2" style={{
                  background: (STATUS_COLORS[customer.statusTag] || STATUS_COLORS['Profile Review']).bg,
                  color: (STATUS_COLORS[customer.statusTag] || STATUS_COLORS['Profile Review']).text,
                }}>
                  {customer.statusTag}
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Profile Completeness</p>
                  <p className="text-xl font-bold" style={{ color: completenessColor }}>{completeness}%</p>
                </div>
              </div>
            </div>
            {customer.areasForAttention?.length > 0 && (
              <div className="mt-4 space-y-2">
                {customer.areasForAttention.map((area: any) => (
                  <div key={area.id} className="flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                    <AlertCircle size={14} style={{ color: '#F97316', flexShrink: 0, marginTop: '1px' }} />
                    <div><span className="text-xs font-medium" style={{ color: '#9A3412' }}>{area.category}: </span><span className="text-xs" style={{ color: '#9A3412' }}>{area.description}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: activeTab === tab.key ? '#7A3E3E' : 'transparent', color: activeTab === tab.key ? '#FFFFFF' : '#6B7280' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section title="Personal Information" icon={<Users size={16} />}>
            <InfoRow label="Full Name" value={`${customer.firstName} ${customer.lastName}`} />
            <InfoRow label="Gender" value={customer.gender} />
            <InfoRow label="Date of Birth" value={customer.dateOfBirth} />
            <InfoRow label="Age" value={`${customer.age} years`} />
            <InfoRow label="Height" value={formatHeight(customer.heightCm)} />
            <InfoRow label="Marital Status" value={customer.maritalStatus} />
            <InfoRow label="Religion" value={customer.religion} />
            <InfoRow label="Caste" value={customer.caste} />
            <InfoRow label="Languages Known" value={parseJSON(customer.languagesKnown).join(', ')} />
          </Section>
          <Section title="Contact & Location" icon={<MapPin size={16} />}>
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="Phone" value={customer.phone} />
            <InfoRow label="City" value={customer.city} />
            <InfoRow label="Country" value={customer.country} />
            <InfoRow label="Open to Relocate" value={customer.openToRelocate} />
          </Section>
          <Section title="Education & Career" icon={<Briefcase size={16} />}>
            <InfoRow label="College / University" value={customer.undergradCollege} />
            <InfoRow label="Degree" value={customer.degree} />
            <InfoRow label="Current Company" value={customer.currentCompany} />
            <InfoRow label="Designation" value={customer.designation} />
            <InfoRow label="Profession" value={customer.profession} />
            <InfoRow label="Annual Income" value={formatIncome(customer.incomeLPA)} />
          </Section>
          <Section title="Family Background" icon={<Users size={16} />}>
            <InfoRow label="Family Type" value={customer.familyType} />
            <InfoRow label="Family Values" value={customer.familyValues} />
            <InfoRow label="Siblings" value={customer.siblings} />
            <InfoRow label="Want Children" value={customer.wantKids} />
            <InfoRow label="Open to Pets" value={customer.openToPets} />
          </Section>
          <Section title="Lifestyle" icon={<Star size={16} />}>
            <InfoRow label="Dietary Preference" value={customer.dietaryPreference} />
            <InfoRow label="Smoking" value={customer.smoking} />
            <InfoRow label="Drinking" value={customer.drinking} />
            <div className="mt-3">
              <p className="text-xs mb-2" style={{ color: '#6B7280' }}>Hobbies & Interests</p>
              <div className="flex flex-wrap gap-2">
                {[...parseJSON(customer.hobbies), ...parseJSON(customer.interests)].filter((v, i, a) => a.indexOf(v) === i).map(h => <Tag key={h} label={h} />)}
              </div>
            </div>
          </Section>
          <Section title="Partner Preferences" icon={<GraduationCap size={16} />}>
            <InfoRow label="Preferred Age Range" value={customer.preferredAgeMin && customer.preferredAgeMax ? `${customer.preferredAgeMin} – ${customer.preferredAgeMax} years` : null} />
            <InfoRow label="Preferred Education" value={customer.preferredEducation} />
            <InfoRow label="Preferred Profession" value={customer.preferredProfession} />
            <InfoRow label="Preferred Locations" value={parseJSON(customer.preferredLocations).join(', ')} />
          </Section>
        </div>
      )}

      {activeTab === 'journey' && (
        <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
          <h3 className="font-semibold text-base mb-6" style={{ color: '#1E1E1E' }}>Matchmaking Journey</h3>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: '#E5E0D8' }} />
            <div className="space-y-6">
              {JOURNEY_STAGES.map(stage => {
                const stageData = customer.journeyStages?.find((js: any) => js.stage === stage)
                const status = stageData?.status || 'upcoming'
                return (
                  <div key={stage} className="flex items-start gap-4 relative">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center z-10" style={{
                      background: status === 'completed' ? '#7A3E3E' : status === 'active' ? '#FEF9EC' : '#F3F4F6',
                      border: status === 'active' ? '2px solid #C9A66B' : 'none',
                    }}>
                      {status === 'completed' ? <CheckCircle2 size={16} style={{ color: '#FFFFFF' }} /> : status === 'active' ? <div className="w-3 h-3 rounded-full" style={{ background: '#C9A66B' }} /> : <Circle size={16} style={{ color: '#D1D5DB' }} />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm" style={{ color: status === 'upcoming' ? '#9CA3AF' : '#1E1E1E' }}>{stage}</p>
                        {status === 'active' && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#FEF9EC', color: '#92400E' }}>Current Stage</span>}
                        {stageData?.completedAt && <span className="text-xs" style={{ color: '#6B7280' }}>{new Date(stageData.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </div>
                      {status === 'active' && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>In progress — review and move forward when ready</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold" style={{ color: '#1E1E1E' }}>Recommended Matches</h3>
            <p className="text-sm" style={{ color: '#6B7280' }}>Sorted by compatibility score</p>
          </div>
          {matches.map((match, i) => {
            const labelColors = MATCH_LABEL_COLORS[match.label] || MATCH_LABEL_COLORS['Worth Exploring']
            return (
              <div key={i} className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white" style={{ background: '#C9A66B' }}>
                      {match.profile.firstName?.[0]}{match.profile.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#1E1E1E' }}>{match.profile.firstName} {match.profile.lastName}</p>
                      <p className="text-sm" style={{ color: '#6B7280' }}>{match.profile.age} yrs · {match.profile.city}</p>
                      <p className="text-sm" style={{ color: '#6B7280' }}>{match.profile.profession}{match.profile.currentCompany ? ` at ${match.profile.currentCompany}` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: '#E5E0D8' }}>
                        <div className="h-full rounded-full" style={{ width: `${match.score}%`, background: match.score >= 80 ? '#7A3E3E' : match.score >= 65 ? '#3B82F6' : '#F59E0B' }} />
                      </div>
                      <span className="text-lg font-bold" style={{ color: '#7A3E3E' }}>{match.score}%</span>
                    </div>
                    <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: labelColors.bg, color: labelColors.text }}>{match.label}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl p-3" style={{ background: '#FAF7F2' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: '#6B7280' }}>Quick Info</p>
                    <div className="space-y-1 text-xs" style={{ color: '#1E1E1E' }}>
                      <p>{formatHeight(match.profile.heightCm)}</p>
                      <p>{formatIncome(match.profile.incomeLPA)}</p>
                      <p>{match.profile.religion || 'Religion N/A'}</p>
                      <p>Relocation: {match.profile.openToRelocate}</p>
                    </div>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: '#F0FDF4' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: '#166534' }}>Compatibility Strengths</p>
                    <ul className="space-y-1">
                      {match.strengths.slice(0, 3).map((s: string, j: number) => (
                        <li key={j} className="text-xs flex items-start gap-1" style={{ color: '#166534' }}><span>✓</span> {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: '#FFF7ED' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: '#9A3412' }}>Areas for Discussion</p>
                    {match.discussionAreas.length > 0 ? (
                      <ul className="space-y-1">
                        {match.discussionAreas.slice(0, 3).map((d: string, j: number) => (
                          <li key={j} className="text-xs flex items-start gap-1" style={{ color: '#9A3412' }}><span>→</span> {d}</li>
                        ))}
                      </ul>
                    ) : <p className="text-xs" style={{ color: '#9A3412' }}>No major discussion areas identified.</p>}
                  </div>
                </div>
                <div className="rounded-xl p-4 mb-4" style={{ background: '#FAF7F2', border: '1px solid #E5E0D8' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={14} style={{ color: '#7A3E3E' }} />
                    <p className="text-xs font-medium" style={{ color: '#7A3E3E' }}>Match Intelligence</p>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#1E1E1E' }}>{match.explanation}</p>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setSelectedMatch(match)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90"
                    style={{ background: '#7A3E3E' }}>
                    <Send size={14} />Send Match Introduction
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'discovery' && (
        <div className="space-y-4">
          <VideoCallSection
            onTranscriptChange={(text) => setTranscript(text)}
            onCallEnded={(finalText) => {
              setTranscript(finalText)
              handleProcessTranscript(finalText)
            }}
          />

          <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
            <div className="flex items-center gap-2 mb-5" style={{ borderBottom: '1px solid #E5E0D8', paddingBottom: '16px' }}>
              <Brain size={16} style={{ color: '#7A3E3E' }} />
              <h3 className="font-semibold text-sm" style={{ color: '#1E1E1E' }}>Discovery Call Intelligence</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>
              Transcript auto-fills during a live call, or paste manually below.
            </p>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Transcript will appear here during a live call, or paste it manually..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: '#E5E0D8', background: '#FAF7F2', color: '#1E1E1E', fontFamily: 'inherit' }}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={() => handleProcessTranscript()}
                disabled={processingTranscript || !transcript.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: '#7A3E3E' }}
              >
                <Brain size={14} />{processingTranscript ? 'Processing...' : 'Extract Insights'}
              </button>
            </div>
          </div>

          {latestDiscovery && latestDiscovery.processedAt && (
            <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
              <div className="flex items-center justify-between mb-5" style={{ borderBottom: '1px solid #E5E0D8', paddingBottom: '16px' }}>
                <h3 className="font-semibold text-sm" style={{ color: '#1E1E1E' }}>Latest Discovery Insights</h3>
                <span className="text-xs" style={{ color: '#6B7280' }}>
                  {latestDiscovery.processedAt?.toDate
                    ? latestDiscovery.processedAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                    : new Date(latestDiscovery.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestDiscovery.relationshipGoals && (
                  <div className="rounded-xl p-4" style={{ background: '#FAF7F2', border: '1px solid #E5E0D8' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#7A3E3E' }}>RELATIONSHIP GOALS</p>
                    <p className="text-sm" style={{ color: '#1E1E1E' }}>{latestDiscovery.relationshipGoals}</p>
                  </div>
                )}
                {latestDiscovery.familyExpectations && (
                  <div className="rounded-xl p-4" style={{ background: '#FAF7F2', border: '1px solid #E5E0D8' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#7A3E3E' }}>FAMILY EXPECTATIONS</p>
                    <p className="text-sm" style={{ color: '#1E1E1E' }}>{latestDiscovery.familyExpectations}</p>
                  </div>
                )}
                {latestDiscovery.partnerExpectations && (
                  <div className="rounded-xl p-4" style={{ background: '#FAF7F2', border: '1px solid #E5E0D8' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#7A3E3E' }}>PARTNER EXPECTATIONS</p>
                    <p className="text-sm" style={{ color: '#1E1E1E' }}>{latestDiscovery.partnerExpectations}</p>
                  </div>
                )}
                {latestDiscovery.relocationPreference && (
                  <div className="rounded-xl p-4" style={{ background: '#FAF7F2', border: '1px solid #E5E0D8' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#7A3E3E' }}>RELOCATION PREFERENCE</p>
                    <p className="text-sm" style={{ color: '#1E1E1E' }}>{latestDiscovery.relocationPreference}</p>
                  </div>
                )}
                {parseJSON(latestDiscovery.coreValues).length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#166534' }}>CORE VALUES</p>
                    <div className="flex flex-wrap gap-2">
                      {parseJSON(latestDiscovery.coreValues).map(v => <span key={v} className="px-2 py-1 rounded-full text-xs" style={{ background: '#DCFCE7', color: '#166534' }}>{v}</span>)}
                    </div>
                  </div>
                )}
                {parseJSON(latestDiscovery.dealbreakers).length > 0 && (
                  <div className="rounded-xl p-4" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#9A3412' }}>DEALBREAKERS</p>
                    <div className="flex flex-wrap gap-2">
                      {parseJSON(latestDiscovery.dealbreakers).map(d => <span key={d} className="px-2 py-1 rounded-full text-xs" style={{ background: '#FFEDD5', color: '#9A3412' }}>{d}</span>)}
                    </div>
                  </div>
                )}
                {parseJSON(latestDiscovery.lifestylePreferences).length > 0 && (
                  <div className="rounded-xl p-4 md:col-span-2" style={{ background: '#FAF7F2', border: '1px solid #E5E0D8' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#7A3E3E' }}>LIFESTYLE PREFERENCES</p>
                    <div className="flex flex-wrap gap-2">
                      {parseJSON(latestDiscovery.lifestylePreferences).map(l => <span key={l} className="px-3 py-1 rounded-full text-xs" style={{ background: '#FFFFFF', color: '#6B7280', border: '1px solid #E5E0D8' }}>{l}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
            <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
              placeholder="Add a matchmaker note about this client..." rows={3}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none mb-3"
              style={{ borderColor: '#E5E0D8', background: '#FAF7F2', color: '#1E1E1E', fontFamily: 'inherit' }} />
            <div className="flex justify-end">
              <button onClick={handleAddNote} disabled={addingNote || !newNote.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
                style={{ background: '#7A3E3E' }}>
                <Plus size={14} />{addingNote ? 'Saving...' : 'Add Note'}
              </button>
            </div>
          </div>
          {customer.notes?.length === 0 && <p className="text-center py-8 text-sm" style={{ color: '#6B7280' }}>No notes yet.</p>}
          {customer.notes?.map((note: any) => (
            <div key={note.id} className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white" style={{ background: '#7A3E3E' }}>PK</div>
                  <span className="text-sm font-medium" style={{ color: '#1E1E1E' }}>Priya Kapoor</span>
                </div>
                <span className="text-xs" style={{ color: '#6B7280' }}>
                  {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString('en-IN') : new Date(note.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#1E1E1E' }}>{note.content}</p>
            </div>
          ))}
        </div>
      )}

      {selectedMatch && (
        <SendMatchModal match={selectedMatch} customer={customer} onClose={() => setSelectedMatch(null)} onSent={loadData} />
      )}
    </div>
  )
}
