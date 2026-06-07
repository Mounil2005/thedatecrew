import {
  collection, doc, getDoc, getDocs, addDoc,
  query, where, orderBy, limit, setDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

const JOURNEY_STAGES = ['Profile Review', 'Discovery Session', 'Preference Mapping', 'Active Matching', 'Introduction Sent', 'Feedback Received', 'Relationship Progressing']

export async function addCustomer(data: Record<string, any>): Promise<string> {
  const ref = doc(collection(db, 'customers'))
  await setDoc(ref, {
    ...data,
    matchmakerId: 'matchmaker-priya',
    statusTag: 'Profile Review',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  for (let s = 0; s < JOURNEY_STAGES.length; s++) {
    await addDoc(collection(db, 'customers', ref.id, 'journeyStages'), {
      stage: JOURNEY_STAGES[s],
      status: s === 0 ? 'active' : 'upcoming',
      order: s,
      completedAt: null,
    })
  }
  return ref.id
}

export async function getCustomers(filters?: { search?: string; status?: string; gender?: string }) {
  const snap = await getDocs(collection(db, 'customers'))
  let customers = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

  if (filters?.search) {
    const s = filters.search.toLowerCase()
    customers = customers.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(s) ||
      c.city?.toLowerCase().includes(s) ||
      c.profession?.toLowerCase().includes(s)
    )
  }
  if (filters?.status) {
    customers = customers.filter(c => c.statusTag === filters.status)
  }
  if (filters?.gender) {
    customers = customers.filter(c => c.gender === filters.gender)
  }

  return customers
}

export async function getCustomer(id: string) {
  const snap = await getDoc(doc(db, 'customers', id))
  if (!snap.exists()) return null

  const customer = { id: snap.id, ...snap.data() }

  const [notesSnap, stagesSnap, callsSnap, attentionSnap, matchesSnap] = await Promise.all([
    getDocs(query(collection(db, 'customers', id, 'notes'), orderBy('createdAt', 'desc'))),
    getDocs(query(collection(db, 'customers', id, 'journeyStages'), orderBy('order', 'asc'))),
    getDocs(query(collection(db, 'customers', id, 'discoveryCalls'), orderBy('createdAt', 'desc'), limit(1))),
    getDocs(collection(db, 'customers', id, 'areasForAttention')),
    getDocs(query(collection(db, 'customers', id, 'sentMatches'), orderBy('sentAt', 'desc'), limit(10))),
  ])

  return {
    ...customer,
    notes: notesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    journeyStages: stagesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    discoveryCalls: callsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    areasForAttention: attentionSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    sentMatches: matchesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
  }
}

export async function addNote(customerId: string, content: string) {
  return addDoc(collection(db, 'customers', customerId, 'notes'), {
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function saveDiscoveryCall(customerId: string, data: Record<string, any>) {
  return addDoc(collection(db, 'customers', customerId, 'discoveryCalls'), {
    ...data,
    processedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  })
}

export async function saveAreaForAttention(customerId: string, data: Record<string, any>) {
  return addDoc(collection(db, 'customers', customerId, 'areasForAttention'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function saveMatchRecommendation(customerId: string, data: Record<string, any>) {
  return addDoc(collection(db, 'customers', customerId, 'sentMatches'), {
    ...data,
    sentAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  })
}

export async function getPoolProfiles(gender?: string) {
  const snap = await getDocs(collection(db, 'poolProfiles'))
  const profiles = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
  if (gender) return profiles.filter(p => p.gender === gender)
  return profiles
}

export async function getMatchIntroductions() {
  const customersSnap = await getDocs(collection(db, 'customers'))
  const customers = customersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

  const results: any[] = []
  await Promise.all(
    customers.map(async (customer) => {
      const matchesSnap = await getDocs(
        query(collection(db, 'customers', customer.id, 'sentMatches'), orderBy('sentAt', 'desc'))
      )
      matchesSnap.docs.forEach(d => {
        results.push({
          id: d.id,
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          customerGender: customer.gender,
          customerAge: customer.age,
          customerCity: customer.city,
          ...d.data(),
        })
      })
    })
  )

  return results.sort((a, b) => {
    const aTime = a.sentAt?.toDate?.() ?? new Date(a.sentAt ?? 0)
    const bTime = b.sentAt?.toDate?.() ?? new Date(b.sentAt ?? 0)
    return bTime.getTime() - aTime.getTime()
  })
}

export async function getStats() {
  const snap = await getDocs(collection(db, 'customers'))
  const customers = snap.docs.map(d => d.data())
  return {
    total: customers.length,
    activeMatching: customers.filter(c => c.statusTag === 'Active Matching').length,
    introSent: customers.filter(c => c.statusTag === 'Introduction Sent').length,
    profileReview: customers.filter(c => c.statusTag === 'Profile Review').length,
  }
}
