'use client'

import { useEffect, useState } from 'react'
import { collection, doc, setDoc, getDocs, addDoc, deleteDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'

// ---- Seed data generators (same logic as old prisma seed) ----
const indianCities = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Chandigarh', 'Indore', 'Bhopal', 'Vadodara', 'Coimbatore', 'Kochi', 'Nagpur']
const professions = ['Software Engineer', 'Doctor', 'Chartered Accountant', 'Lawyer', 'Architect', 'Investment Banker', 'Marketing Manager', 'Data Scientist', 'Product Manager', 'Consultant', 'Entrepreneur', 'Designer', 'Professor', 'Journalist', 'Financial Analyst', 'HR Manager']
const companies = ['Google', 'Microsoft', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Deloitte', 'KPMG', 'Apollo Hospitals', 'HDFC Bank', 'Reliance', 'Tata Group', 'Mahindra', 'Bajaj', 'Flipkart', 'Razorpay', 'Zomato', 'Swiggy', 'BYJU\'s', 'Paytm']
const colleges = ['IIT Bombay', 'IIT Delhi', 'IIM Ahmedabad', 'BITS Pilani', 'Delhi University', 'Jadavpur University', 'VIT', 'SRCC Delhi', 'Symbiosis Pune', 'Christ University', 'NIT Trichy', 'XLRI Jamshedpur', 'SP Jain Mumbai', 'LSR Delhi', 'St. Xavier\'s Mumbai']
const degrees = ['B.Tech Computer Science', 'MBBS', 'CA', 'LLB', 'B.Arch', 'MBA Finance', 'B.Tech Electronics', 'M.Tech', 'B.Com Honours', 'B.Sc Mathematics', 'MA English', 'B.Design', 'BBA', 'M.Sc Statistics']
const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist']
const castes = ['Brahmin', 'Kshatriya', 'Vaishya', 'Kayastha', 'Maratha', 'Rajput', 'Not Specified']
const familyTypes = ['Nuclear', 'Joint', 'Extended']
const familyValues = ['Traditional', 'Moderate', 'Liberal']
const dietary = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Jain Vegetarian']
const smokingOpts = ['Never', 'Occasionally', 'Socially']
const drinkingOpts = ['Never', 'Occasionally', 'Socially']
const wantKidsOpts = ['Yes', 'No', 'Maybe']
const relocateOpts = ['Yes', 'No', 'Maybe']
const siblingsOpts = ['None', '1 Brother', '1 Sister', '2 Brothers', '2 Sisters', '1 Brother 1 Sister']
const hobbiesPool = ['Reading', 'Travelling', 'Cooking', 'Yoga', 'Music', 'Photography', 'Hiking', 'Gaming', 'Painting', 'Dancing', 'Fitness', 'Volunteering']
const languages = ['Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi']
const maleFirstNames = ['Arjun', 'Rohit', 'Vikram', 'Karan', 'Aditya', 'Siddharth', 'Rahul', 'Amit', 'Nikhil', 'Rohan', 'Vishal', 'Akash', 'Dhruv', 'Kabir', 'Ishan', 'Shaurya', 'Pranav', 'Ankit', 'Varun', 'Aarav', 'Rishi', 'Advait', 'Aman', 'Yash', 'Dev', 'Kunal', 'Samar', 'Aryan', 'Tarun', 'Gaurav']
const femaleFirstNames = ['Priya', 'Ananya', 'Sneha', 'Shreya', 'Nisha', 'Pooja', 'Divya', 'Kritika', 'Tanvi', 'Riya', 'Ishita', 'Meera', 'Aisha', 'Kavya', 'Simran', 'Lavanya', 'Aditi', 'Nidhi', 'Swati', 'Pallavi', 'Rishika', 'Zara', 'Anjali', 'Neha', 'Sonia', 'Tanya', 'Ruchi', 'Sonali', 'Aarti', 'Preeti']
const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Mehta', 'Gupta', 'Agarwal', 'Verma', 'Joshi', 'Iyer', 'Reddy', 'Nair', 'Shah', 'Kapoor', 'Malhotra', 'Banerjee', 'Chatterjee', 'Pillai', 'Menon', 'Bose', 'Das', 'Rao', 'Khanna', 'Srivastava', 'Mishra', 'Dubey', 'Trivedi', 'Chauhan', 'Tiwari', 'Pandey']

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function rndInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }
function rndSubset<T>(arr: T[], min: number, max: number): T[] {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, rndInt(min, max))
}
function rndFloat(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2))
}

const STAGES = ['Profile Review', 'Discovery Session', 'Preference Mapping', 'Active Matching', 'Introduction Sent', 'Feedback Received', 'Relationship Progressing']

function makeCustomer(i: number) {
  const gender = i % 2 === 0 ? 'Male' : 'Female'
  const firstName = gender === 'Male' ? maleFirstNames[i % maleFirstNames.length] : femaleFirstNames[i % femaleFirstNames.length]
  const lastName = lastNames[i % lastNames.length]
  const age = rndInt(24, 42)
  const statusTag = STAGES[i % STAGES.length]
  return {
    firstName, lastName, gender, age,
    dateOfBirth: `${2026 - age}-${String(rndInt(1,12)).padStart(2,'0')}-${String(rndInt(1,28)).padStart(2,'0')}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
    phone: `+91 ${rndInt(7000000000, 9999999999)}`,
    country: 'India',
    city: rnd(indianCities),
    openToRelocate: rnd(relocateOpts),
    heightCm: gender === 'Male' ? rndInt(165, 188) : rndInt(152, 175),
    undergradCollege: rnd(colleges),
    degree: rnd(degrees),
    currentCompany: rnd(companies),
    designation: rnd(professions),
    incomeLPA: rndFloat(4, 80),
    profession: rnd(professions),
    maritalStatus: i % 8 === 0 ? 'Divorced' : i % 15 === 0 ? 'Widowed' : 'Single',
    siblings: rnd(siblingsOpts),
    familyType: rnd(familyTypes),
    familyValues: rnd(familyValues),
    caste: rnd(castes),
    religion: rnd(religions),
    dietaryPreference: rnd(dietary),
    smoking: rnd(smokingOpts),
    drinking: rnd(drinkingOpts),
    languagesKnown: JSON.stringify(rndSubset(languages, 2, 4)),
    hobbies: JSON.stringify(rndSubset(hobbiesPool, 3, 5)),
    interests: JSON.stringify(rndSubset(hobbiesPool, 2, 4)),
    wantKids: rnd(wantKidsOpts),
    openToPets: rnd(['Yes', 'No', 'Maybe']),
    preferredAgeMin: age - rndInt(2, 6),
    preferredAgeMax: age + rndInt(1, 5),
    preferredLocations: JSON.stringify(rndSubset(indianCities, 2, 4)),
    preferredEducation: rnd(['Graduate', 'Post Graduate', 'Professional Degree', 'Open']),
    preferredProfession: rnd(['Any', ...professions.slice(0, 5)]),
    statusTag,
    profileCompleteness: rndInt(55, 98),
    matchmakerId: 'matchmaker-priya',
  }
}

function makePoolProfile(i: number, gender: string) {
  const firstName = gender === 'Male' ? rnd(maleFirstNames) : rnd(femaleFirstNames)
  const lastName = rnd(lastNames)
  const age = rndInt(22, 40)
  return {
    firstName, lastName, gender, age,
    dateOfBirth: `${2026 - age}-${String(rndInt(1,12)).padStart(2,'0')}-${String(rndInt(1,28)).padStart(2,'0')}`,
    email: `pool.${gender.toLowerCase()}${i}@example.com`,
    phone: `+91 ${rndInt(7000000000, 9999999999)}`,
    country: 'India',
    city: rnd(indianCities),
    openToRelocate: rnd(relocateOpts),
    heightCm: gender === 'Male' ? rndInt(165, 188) : rndInt(152, 175),
    undergradCollege: rnd(colleges),
    degree: rnd(degrees),
    currentCompany: rnd(companies),
    designation: rnd(professions),
    incomeLPA: rndFloat(4, 60),
    profession: rnd(professions),
    maritalStatus: i % 8 === 0 ? 'Divorced' : 'Single',
    siblings: rnd(siblingsOpts),
    familyType: rnd(familyTypes),
    familyValues: rnd(familyValues),
    caste: rnd(castes),
    religion: rnd(religions),
    dietaryPreference: rnd(dietary),
    smoking: rnd(smokingOpts),
    drinking: rnd(drinkingOpts),
    languagesKnown: JSON.stringify(rndSubset(languages, 2, 4)),
    hobbies: JSON.stringify(rndSubset(hobbiesPool, 3, 5)),
    interests: JSON.stringify(rndSubset(hobbiesPool, 2, 4)),
    wantKids: rnd(wantKidsOpts),
    openToPets: rnd(['Yes', 'No', 'Maybe']),
    preferredAgeMin: age - rndInt(2, 5),
    preferredAgeMax: age + rndInt(1, 5),
    preferredLocations: JSON.stringify(rndSubset(indianCities, 2, 4)),
  }
}

export default function SeedPage() {
  const [log, setLog] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [running, setRunning] = useState(false)
  const [alreadySeeded, setAlreadySeeded] = useState(false)

  useEffect(() => {
    async function checkSeeded() {
      const snap = await getDocs(collection(db, 'customers'))
      if (snap.size > 0) setAlreadySeeded(true)
    }
    checkSeeded()
  }, [])

  function addLog(msg: string) {
    setLog(prev => [...prev, msg])
  }

  async function clearAndReseed() {
    setRunning(true)
    setLog(['Clearing existing data...'])
    try {
      const [custSnap, poolSnap] = await Promise.all([
        getDocs(collection(db, 'customers')),
        getDocs(collection(db, 'poolProfiles')),
      ])
      await Promise.all([
        ...custSnap.docs.map(d => deleteDoc(d.ref)),
        ...poolSnap.docs.map(d => deleteDoc(d.ref)),
      ])
      addLog(`✓ Cleared ${custSnap.size} customers and ${poolSnap.size} pool profiles`)
      setAlreadySeeded(false)
    } catch (err: any) {
      addLog(`❌ Clear failed: ${err.message}`)
      setRunning(false)
      return
    }
    await runSeed()
  }

  async function runSeed() {
    setRunning(true)
    setLog(prev => prev.length ? prev : [])

    try {
      // Create Firebase Auth user
      addLog('Creating matchmaker account...')
      try {
        await createUserWithEmailAndPassword(auth, 'admin@thedatecrew.com', 'matchmaker123')
        addLog('✓ Auth user created')
      } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
          addLog('✓ Auth user already exists')
        } else {
          addLog(`Auth note: ${e.message}`)
        }
      }

      // Seed matchmaker doc
      addLog('Seeding matchmaker profile...')
      await setDoc(doc(db, 'matchmakers', 'matchmaker-priya'), {
        name: 'Priya Kapoor',
        email: 'admin@thedatecrew.com',
        role: 'Head Matchmaker',
        createdAt: new Date().toISOString(),
      })
      addLog('✓ Matchmaker profile created')

      // Seed pool profiles first so we can reference them in sentMatches
      addLog('Seeding 120 pool profiles...')
      const poolMale: { id: string; firstName: string; lastName: string }[] = []
      const poolFemale: { id: string; firstName: string; lastName: string }[] = []
      for (let i = 0; i < 60; i++) {
        const ref = doc(collection(db, 'poolProfiles'))
        const data = makePoolProfile(i, 'Male')
        await setDoc(ref, { ...data, createdAt: new Date().toISOString() })
        poolMale.push({ id: ref.id, firstName: data.firstName, lastName: data.lastName })
      }
      for (let i = 0; i < 60; i++) {
        const ref = doc(collection(db, 'poolProfiles'))
        const data = makePoolProfile(i, 'Female')
        await setDoc(ref, { ...data, createdAt: new Date().toISOString() })
        poolFemale.push({ id: ref.id, firstName: data.firstName, lastName: data.lastName })
      }
      addLog('✓ Created 120 pool profiles (60M + 60F)')

      function matchLabel(score: number) {
        if (score >= 80) return 'High Potential'
        if (score >= 65) return 'Strong Fit'
        if (score >= 50) return 'Good Compatibility'
        return 'Worth Exploring'
      }

      const AI_NOTES = [
        'Strong alignment on family values and long-term goals. Relocation openness is a shared trait.',
        'Both prioritize career and personal growth. Religious backgrounds are complementary.',
        'Lifestyle preferences align well. Worth exploring the difference in family type expectations.',
        'Solid compatibility baseline. Dietary preferences and hobbies show meaningful overlap.',
        'High potential — shared views on children and similar income levels create a stable foundation.',
        'Professionally compatible pair with strong city overlap. Values are closely matched.',
        'Good fit on key lifestyle markers. Open conversation about relocation would be valuable.',
        'Both are family-oriented with similar educational backgrounds. A natural introduction.',
      ]

      // Seed 30 customers
      addLog('Seeding 30 client profiles...')
      for (let i = 0; i < 30; i++) {
        const data = makeCustomer(i)
        const ref = doc(collection(db, 'customers'))
        await setDoc(ref, { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })

        // Journey stages
        const currentIdx = STAGES.indexOf(data.statusTag)
        for (let s = 0; s < STAGES.length; s++) {
          const status = s < currentIdx ? 'completed' : s === currentIdx ? 'active' : 'upcoming'
          await addDoc(collection(db, 'customers', ref.id, 'journeyStages'), {
            stage: STAGES[s],
            status,
            order: s,
            completedAt: status === 'completed' ? new Date(Date.now() - (currentIdx - s) * 7 * 86400000).toISOString() : null,
          })
        }

        // Note for every 3rd customer
        if (i % 3 === 0) {
          await addDoc(collection(db, 'customers', ref.id, 'notes'), {
            content: `Initial intake call completed. ${data.firstName} is looking for a serious long-term relationship. Has clear preferences on family values.`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }

        // Areas for attention for every 5th
        if (i % 5 === 0) {
          await addDoc(collection(db, 'customers', ref.id, 'areasForAttention'), {
            category: 'Location Preferences',
            description: 'Client has indicated a very specific preference for their home city only, which may limit the matching pool.',
            severity: 'medium',
            createdAt: new Date().toISOString(),
          })
        }

        // Discovery call for every 4th
        if (i % 4 === 0) {
          await addDoc(collection(db, 'customers', ref.id, 'discoveryCalls'), {
            transcriptText: `Matchmaker: Tell me about what you're looking for.\n${data.firstName}: I want someone who shares my values around family. I want marriage. Smoking is a hard no.\n\nMatchmaker: Are you open to relocating?\n${data.firstName}: ${data.openToRelocate === 'Yes' ? 'Absolutely.' : data.openToRelocate === 'No' ? 'I prefer to stay in ' + data.city + '.' : 'It depends on the right person.'}`,
            relationshipGoals: 'Long-term committed relationship leading to marriage',
            coreValues: JSON.stringify(['Family First', 'Honesty', 'Ambition']),
            dealbreakers: JSON.stringify(['Smoking', 'Disrespect for family']),
            familyExpectations: 'Close family involvement. Prefers partner from similar background.',
            relocationPreference: data.openToRelocate,
            lifestylePreferences: JSON.stringify(['Active weekends', 'Home-cooked meals', 'Family time']),
            partnerExpectations: 'Professionally established, emotionally mature, family-oriented',
            processedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          })
        }

        // sentMatches for every client with 'Introduction Sent' status
        if (data.statusTag === 'Introduction Sent') {
          // pick an opposite-gender pool profile
          const pool = data.gender === 'Male' ? poolFemale : poolMale
          const match = pool[i % pool.length]
          const score = rndInt(52, 94)
          const label = matchLabel(score)
          const daysAgo = rndInt(2, 30)
          await addDoc(collection(db, 'customers', ref.id, 'sentMatches'), {
            matchProfileId: match.id,
            matchProfileName: `${match.firstName} ${match.lastName}`,
            compatibilityScore: score,
            matchLabel: label,
            aiExplanation: AI_NOTES[i % AI_NOTES.length],
            strengths: JSON.stringify(['Aligned family values', 'Similar lifestyle preferences', 'Open to relocation']),
            discussionAreas: JSON.stringify(['Age gap expectations', 'City preference']),
            status: 'Sent',
            sentAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
            createdAt: new Date().toISOString(),
          })
        }
      }
      addLog(`✓ Created 30 customers with journey stages, notes, discovery calls, and introductions`)

      addLog('✅ Database seeded successfully!')
      setDone(true)
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#FAF7F2' }}>
      <div className="w-full max-w-lg rounded-3xl p-8" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
        <div className="flex items-center gap-3 mb-6">
          <img src="/image.png" alt="The Date Crew" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="font-bold" style={{ color: '#1E1E1E' }}>Database Seeder</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>The Date Crew — One-time setup</p>
          </div>
        </div>

        {alreadySeeded ? (
          <div className="rounded-xl p-4 mb-4" style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#92400E' }}>Database already has data.</p>
            <p className="text-xs" style={{ color: '#9A3412' }}>Use "Clear & Reseed" below to wipe existing customers and regenerate with the new names.</p>
          </div>
        ) : null}

        {done ? (
          <div className="text-center py-6">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-bold text-lg mb-2" style={{ color: '#1E1E1E' }}>All done!</p>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>30 clients, 120 pool profiles, and all supporting data are in Firestore.</p>
            <a href="/login" className="inline-block px-6 py-3 rounded-xl text-white font-medium" style={{ background: '#7A3E3E' }}>
              Go to Login →
            </a>
          </div>
        ) : (
          <>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              This will populate Firestore with 30 client profiles, 120 matchmaking pool profiles, journey stages, notes, and discovery call data.
            </p>
            <div className="flex gap-3 mb-6">
              <button
                onClick={runSeed}
                disabled={running || alreadySeeded}
                className="flex-1 py-3 rounded-xl text-white font-medium disabled:opacity-40"
                style={{ background: '#7A3E3E' }}
              >
                {running ? 'Seeding...' : 'Seed Database'}
              </button>
              <button
                onClick={clearAndReseed}
                disabled={running}
                className="flex-1 py-3 rounded-xl font-medium disabled:opacity-40"
                style={{ background: '#FFF7ED', color: '#92400E', border: '1px solid #FED7AA' }}
              >
                {running ? 'Working...' : 'Clear & Reseed'}
              </button>
            </div>
          </>
        )}

        {log.length > 0 && (
          <div className="rounded-xl p-4 font-mono text-xs space-y-1" style={{ background: '#FAF7F2', maxHeight: '200px', overflowY: 'auto' }}>
            {log.map((l, i) => <p key={i} style={{ color: l.startsWith('❌') ? '#DC2626' : l.startsWith('✅') ? '#166534' : '#1E1E1E' }}>{l}</p>)}
          </div>
        )}
      </div>
    </div>
  )
}
