import { db } from './firebase'
import {
  collection, doc, setDoc, addDoc, onSnapshot, getDoc, updateDoc,
} from 'firebase/firestore'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export async function createCall(
  localStream: MediaStream,
  onRemoteStream: (stream: MediaStream) => void,
): Promise<{ roomId: string; pc: RTCPeerConnection; cleanup: () => void }> {
  const pc = new RTCPeerConnection(ICE_SERVERS)
  const callRef = doc(collection(db, 'calls'))

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

  pc.ontrack = (e) => {
    if (e.streams?.[0]) onRemoteStream(e.streams[0])
  }

  const callerCandidates = collection(callRef, 'callerCandidates')
  pc.onicecandidate = (e) => {
    if (e.candidate) addDoc(callerCandidates, e.candidate.toJSON())
  }

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await setDoc(callRef, {
    offer: { type: offer.type, sdp: offer.sdp },
    status: 'waiting',
    createdAt: new Date().toISOString(),
  })

  const unsubAnswer = onSnapshot(callRef, async (snap) => {
    const data = snap.data()
    if (!pc.currentRemoteDescription && data?.answer) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
    }
  })

  const unsubCallee = onSnapshot(collection(callRef, 'calleeCandidates'), (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === 'added') {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()))
      }
    })
  })

  return {
    roomId: callRef.id,
    pc,
    cleanup: () => { unsubAnswer(); unsubCallee() },
  }
}

export async function joinCall(
  roomId: string,
  localStream: MediaStream,
  onRemoteStream: (stream: MediaStream) => void,
): Promise<{ pc: RTCPeerConnection; cleanup: () => void }> {
  const callRef = doc(db, 'calls', roomId)
  const callSnap = await getDoc(callRef)
  if (!callSnap.exists()) throw new Error('Call room not found')

  const pc = new RTCPeerConnection(ICE_SERVERS)

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

  pc.ontrack = (e) => {
    if (e.streams?.[0]) onRemoteStream(e.streams[0])
  }

  const calleeCandidates = collection(callRef, 'calleeCandidates')
  pc.onicecandidate = (e) => {
    if (e.candidate) addDoc(calleeCandidates, e.candidate.toJSON())
  }

  const { offer } = callSnap.data()!
  await pc.setRemoteDescription(new RTCSessionDescription(offer))
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  await updateDoc(callRef, {
    answer: { type: answer.type, sdp: answer.sdp },
    status: 'connected',
  })

  const unsubCaller = onSnapshot(collection(callRef, 'callerCandidates'), (snap) => {
    snap.docChanges().forEach(change => {
      if (change.type === 'added') {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()))
      }
    })
  })

  return { pc, cleanup: () => unsubCaller() }
}
