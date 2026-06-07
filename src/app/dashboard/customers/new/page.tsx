'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { addCustomer } from '@/lib/db'
import { calculateAge, calculateProfileCompleteness } from '@/lib/utils'

const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other']
const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Chandigarh', 'Indore', 'Bhopal', 'Vadodara', 'Coimbatore', 'Kochi', 'Nagpur', 'Other']
const PROFESSIONS = ['Software Engineer', 'Doctor', 'Chartered Accountant', 'Lawyer', 'Architect', 'Investment Banker', 'Marketing Manager', 'Data Scientist', 'Product Manager', 'Consultant', 'Entrepreneur', 'Designer', 'Professor', 'Journalist', 'Financial Analyst', 'HR Manager', 'Other']
const LANGUAGES = ['Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Gujarati', 'Malayalam', 'Punjabi', 'Odia', 'Urdu']
const HOBBIES = ['Reading', 'Travelling', 'Cooking', 'Yoga', 'Music', 'Photography', 'Hiking', 'Gaming', 'Painting', 'Dancing', 'Fitness', 'Volunteering', 'Sports', 'Meditation', 'Writing']

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
      <h2 className="font-semibold text-sm mb-5 pb-4" style={{ color: '#1E1E1E', borderBottom: '1px solid #E5E0D8' }}>
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  )
}

function Field({ label, required, children, full }: { label: string; required?: boolean; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all'
const inputStyle = { borderColor: '#E5E0D8', background: '#FAF7F2', color: '#1E1E1E' }

function Input({ value, onChange, type = 'text', placeholder }: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputClass} style={inputStyle} />
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={inputClass} style={inputStyle}>
      <option value="">— Select —</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Tags({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  function toggle(item: string) {
    onChange(selected.includes(item) ? selected.filter(x => x !== item) : [...selected, item])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o} type="button" onClick={() => toggle(o)}
          className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
          style={{
            background: selected.includes(o) ? '#7A3E3E' : '#FAF7F2',
            color: selected.includes(o) ? '#FFFFFF' : '#6B7280',
            border: `1px solid ${selected.includes(o) ? '#7A3E3E' : '#E5E0D8'}`,
          }}>
          {o}
        </button>
      ))}
    </div>
  )
}

export default function NewClientPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firstName: '', lastName: '', gender: '', dateOfBirth: '', heightCm: '',
    maritalStatus: 'Single', religion: '', caste: '',
    email: '', phone: '', city: '', country: 'India', openToRelocate: '',
    undergradCollege: '', degree: '', currentCompany: '', designation: '',
    profession: '', incomeLPA: '',
    familyType: '', familyValues: '', siblings: '', wantKids: '', openToPets: '',
    dietaryPreference: '', smoking: 'Never', drinking: 'Never',
    preferredAgeMin: '', preferredAgeMax: '', preferredEducation: '', preferredProfession: '',
  })

  const [languagesKnown, setLanguagesKnown] = useState<string[]>([])
  const [hobbies, setHobbies] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [preferredLocations, setPreferredLocations] = useState<string[]>([])

  function set(key: string) {
    return (value: string) => setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.gender) {
      setError('First name, last name, and gender are required.')
      return
    }
    setSaving(true)
    setError('')

    const payload: Record<string, any> = {
      ...form,
      age: form.dateOfBirth ? calculateAge(form.dateOfBirth) : undefined,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      incomeLPA: form.incomeLPA ? Number(form.incomeLPA) : undefined,
      preferredAgeMin: form.preferredAgeMin ? Number(form.preferredAgeMin) : undefined,
      preferredAgeMax: form.preferredAgeMax ? Number(form.preferredAgeMax) : undefined,
      languagesKnown: JSON.stringify(languagesKnown),
      hobbies: JSON.stringify(hobbies),
      interests: JSON.stringify(interests),
      preferredLocations: JSON.stringify(preferredLocations),
    }

    Object.keys(payload).forEach(k => {
      if (payload[k] === '' || payload[k] === undefined) delete payload[k]
    })

    payload.profileCompleteness = calculateProfileCompleteness(payload)

    try {
      const id = await addCustomer(payload)
      router.push(`/dashboard/customers/${id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/dashboard/customers" className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-70" style={{ color: '#6B7280' }}>
        <ArrowLeft size={16} />Back to Clients
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1E1E1E' }}>Add New Client</h1>
          <p style={{ color: '#6B7280' }}>Fill in the biodata details to create a new client profile</p>
        </div>
        <button
          form="new-client-form"
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
          style={{ background: '#7A3E3E' }}
        >
          <Save size={14} />{saving ? 'Saving...' : 'Save Client'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 mb-6 text-sm" style={{ background: '#FFF5F5', color: '#DC2626', border: '1px solid #FCA5A5' }}>
          {error}
        </div>
      )}

      <form id="new-client-form" onSubmit={handleSave} className="space-y-4">

        <FormSection title="Personal Information">
          <Field label="First Name" required>
            <Input value={form.firstName} onChange={set('firstName')} placeholder="e.g. Arjun" />
          </Field>
          <Field label="Last Name" required>
            <Input value={form.lastName} onChange={set('lastName')} placeholder="e.g. Sharma" />
          </Field>
          <Field label="Gender" required>
            <Select value={form.gender} onChange={set('gender')} options={['Male', 'Female']} />
          </Field>
          <Field label="Date of Birth">
            <Input value={form.dateOfBirth} onChange={set('dateOfBirth')} type="date" />
          </Field>
          <Field label="Height (cm)">
            <Input value={form.heightCm} onChange={set('heightCm')} type="number" placeholder="e.g. 172" />
          </Field>
          <Field label="Marital Status">
            <Select value={form.maritalStatus} onChange={set('maritalStatus')} options={['Single', 'Divorced', 'Widowed']} />
          </Field>
          <Field label="Religion">
            <Select value={form.religion} onChange={set('religion')} options={RELIGIONS} />
          </Field>
          <Field label="Caste">
            <Input value={form.caste} onChange={set('caste')} placeholder="e.g. Brahmin" />
          </Field>
          <Field label="Languages Known" full>
            <Tags options={LANGUAGES} selected={languagesKnown} onChange={setLanguagesKnown} />
          </Field>
        </FormSection>

        <FormSection title="Contact & Location">
          <Field label="Email">
            <Input value={form.email} onChange={set('email')} type="email" placeholder="name@example.com" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
          </Field>
          <Field label="City">
            <Select value={form.city} onChange={set('city')} options={CITIES} />
          </Field>
          <Field label="Country">
            <Input value={form.country} onChange={set('country')} placeholder="India" />
          </Field>
          <Field label="Open to Relocate">
            <Select value={form.openToRelocate} onChange={set('openToRelocate')} options={['Yes', 'No', 'Maybe']} />
          </Field>
        </FormSection>

        <FormSection title="Education & Career">
          <Field label="College / University">
            <Input value={form.undergradCollege} onChange={set('undergradCollege')} placeholder="e.g. IIT Bombay" />
          </Field>
          <Field label="Degree">
            <Input value={form.degree} onChange={set('degree')} placeholder="e.g. B.Tech Computer Science" />
          </Field>
          <Field label="Current Company">
            <Input value={form.currentCompany} onChange={set('currentCompany')} placeholder="e.g. Google" />
          </Field>
          <Field label="Designation">
            <Input value={form.designation} onChange={set('designation')} placeholder="e.g. Senior Engineer" />
          </Field>
          <Field label="Profession">
            <Select value={form.profession} onChange={set('profession')} options={PROFESSIONS} />
          </Field>
          <Field label="Annual Income (LPA)">
            <Input value={form.incomeLPA} onChange={set('incomeLPA')} type="number" placeholder="e.g. 24" />
          </Field>
        </FormSection>

        <FormSection title="Family Background">
          <Field label="Family Type">
            <Select value={form.familyType} onChange={set('familyType')} options={['Nuclear', 'Joint', 'Extended']} />
          </Field>
          <Field label="Family Values">
            <Select value={form.familyValues} onChange={set('familyValues')} options={['Traditional', 'Moderate', 'Liberal']} />
          </Field>
          <Field label="Siblings">
            <Select value={form.siblings} onChange={set('siblings')} options={['None', '1 Brother', '1 Sister', '2 Brothers', '2 Sisters', '1 Brother 1 Sister']} />
          </Field>
          <Field label="Want Children">
            <Select value={form.wantKids} onChange={set('wantKids')} options={['Yes', 'No', 'Maybe']} />
          </Field>
          <Field label="Open to Pets">
            <Select value={form.openToPets} onChange={set('openToPets')} options={['Yes', 'No', 'Maybe']} />
          </Field>
        </FormSection>

        <FormSection title="Lifestyle">
          <Field label="Dietary Preference">
            <Select value={form.dietaryPreference} onChange={set('dietaryPreference')} options={['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Jain Vegetarian']} />
          </Field>
          <Field label="Smoking">
            <Select value={form.smoking} onChange={set('smoking')} options={['Never', 'Occasionally', 'Socially']} />
          </Field>
          <Field label="Drinking">
            <Select value={form.drinking} onChange={set('drinking')} options={['Never', 'Occasionally', 'Socially']} />
          </Field>
          <Field label="Hobbies" full>
            <Tags options={HOBBIES} selected={hobbies} onChange={setHobbies} />
          </Field>
          <Field label="Interests" full>
            <Tags options={HOBBIES} selected={interests} onChange={setInterests} />
          </Field>
        </FormSection>

        <FormSection title="Partner Preferences">
          <Field label="Preferred Age — Min">
            <Input value={form.preferredAgeMin} onChange={set('preferredAgeMin')} type="number" placeholder="e.g. 26" />
          </Field>
          <Field label="Preferred Age — Max">
            <Input value={form.preferredAgeMax} onChange={set('preferredAgeMax')} type="number" placeholder="e.g. 34" />
          </Field>
          <Field label="Preferred Education">
            <Select value={form.preferredEducation} onChange={set('preferredEducation')} options={['Graduate', 'Post Graduate', 'Professional Degree', 'Open']} />
          </Field>
          <Field label="Preferred Profession">
            <Input value={form.preferredProfession} onChange={set('preferredProfession')} placeholder="e.g. Doctor or Any" />
          </Field>
          <Field label="Preferred Cities" full>
            <Tags options={CITIES.filter(c => c !== 'Other')} selected={preferredLocations} onChange={setPreferredLocations} />
          </Field>
        </FormSection>

        <div className="flex justify-end pt-2 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white disabled:opacity-60"
            style={{ background: '#7A3E3E' }}
          >
            <Save size={14} />{saving ? 'Saving...' : 'Save Client'}
          </button>
        </div>

      </form>
    </div>
  )
}
