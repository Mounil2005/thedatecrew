'use client'

import { useEffect, useRef, useState, use } from 'react'
import { joinCall } from '@/lib/webrtc'

export default function CallPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)

  const [callState, setCallState] = useState<'landing' | 'joining' | 'waiting' | 'connected' | 'ended' | 'error'>('landing')
  const [error, setError] = useState<string | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [cameraOn, setCameraOn] = useState(true)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const callCleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if ((callState === 'waiting' || callState === 'connected')) {
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
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      callCleanupRef.current?.()
    }
  }, [])

  async function joinTheCall() {
    setError(null)
    setCallState('joining')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      setCallState('waiting')

      const { pc, cleanup } = await joinCall(roomId, stream, (remoteStream) => {
        remoteStreamRef.current = remoteStream
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
        setCallState('connected')
      })

      callCleanupRef.current = () => { cleanup(); pc.close() }
    } catch (err: any) {
      const msg = err.message || 'Could not join call.'
      setError(msg.includes('Permission') || msg.includes('allow') ? 'Camera or microphone permission was denied. Please allow access and try again.' : msg)
      setCallState('error')
    }
  }

  function endCall() {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    callCleanupRef.current?.()
    setCallState('ended')
  }

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setMicOn(track.enabled)
  }

  function toggleCamera() {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (!track) return
    track.enabled = !track.enabled
    setCameraOn(track.enabled)
  }

  const showVideo = callState === 'waiting' || callState === 'connected'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#FAF7F2' }}>
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src="/image.png" alt="The Date Crew" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="font-bold leading-tight" style={{ color: '#1E1E1E' }}>The Date Crew</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Discovery Call</p>
          </div>
        </div>

        {(callState === 'landing' || callState === 'joining') && (
          <div className="rounded-3xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: '#7A3E3E' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#1E1E1E' }}>You've been invited to a Discovery Call</h1>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: '#6B7280' }}>
              Your matchmaker from The Date Crew is waiting. Your camera and microphone will be requested when you join.
            </p>
            <button
              onClick={joinTheCall}
              disabled={callState === 'joining'}
              className="px-8 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity"
              style={{ background: '#7A3E3E' }}
            >
              {callState === 'joining' ? 'Connecting...' : 'Join Call'}
            </button>
            <p className="text-xs mt-5" style={{ color: '#9CA3AF' }}>Best on Chrome or Edge · No app required</p>
          </div>
        )}

        {callState === 'error' && (
          <div className="rounded-3xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
            <div className="rounded-xl p-4 mb-4" style={{ background: '#FFF5F5', border: '1px solid #FCA5A5' }}>
              <p className="font-medium text-sm mb-1" style={{ color: '#DC2626' }}>Could not connect</p>
              <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
            </div>
            <button
              onClick={() => setCallState('landing')}
              className="w-full py-2.5 rounded-xl text-sm font-medium"
              style={{ background: '#FAF7F2', color: '#7A3E3E', border: '1px solid #E5E0D8' }}
            >
              Try again
            </button>
          </div>
        )}

        {showVideo && (
          <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid #E5E0D8' }}>
            <div className="relative" style={{ background: '#0F0F0F', aspectRatio: '16/9' }}>
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              {callState === 'waiting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'transparent' }} />
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Connecting to your matchmaker...</p>
                </div>
              )}
              <div className="absolute bottom-3 right-3 w-28 rounded-xl overflow-hidden" style={{ border: '2px solid rgba(255,255,255,0.15)', background: '#1a1a1a' }}>
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full block" />
              </div>
            </div>

            <div className="p-4 flex items-center gap-2" style={{ background: '#FFFFFF' }}>
              <button
                onClick={toggleMic}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: micOn ? '#FAF7F2' : '#FEE2E2', border: '1px solid #E5E0D8' }}
                title={micOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {micOn
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A3E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                }
              </button>
              <button
                onClick={toggleCamera}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: cameraOn ? '#FAF7F2' : '#FEE2E2', border: '1px solid #E5E0D8' }}
                title={cameraOn ? 'Stop camera' : 'Start camera'}
              >
                {cameraOn
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A3E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23" /><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" /><path d="M16 11.37A4 4 0 1 1 12.63 8" /></svg>
                }
              </button>
              <button
                onClick={endCall}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: '#EF4444' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.43 9.68 19.79 19.79 0 0 1 1.36 1.05 2 2 0 0 1 3.34 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.32 10.9" />
                  <line x1="23" y1="1" x2="1" y2="23" />
                </svg>
                End Call
              </button>
            </div>
          </div>
        )}

        {callState === 'ended' && (
          <div className="rounded-3xl p-10 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
            <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: '#F0FDF4' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#1E1E1E' }}>Call Ended</h2>
            <p className="text-sm" style={{ color: '#6B7280' }}>Thank you for your time. Your matchmaker will be in touch soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
