import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function calculateProfileCompleteness(customer: Record<string, unknown>): number {
  const fields = [
    'firstName', 'lastName', 'gender', 'dateOfBirth', 'email', 'phone',
    'city', 'heightCm', 'undergradCollege', 'degree', 'currentCompany',
    'designation', 'incomeLPA', 'profession', 'maritalStatus', 'siblings',
    'familyType', 'familyValues', 'caste', 'religion', 'dietaryPreference',
    'smoking', 'drinking', 'languagesKnown', 'hobbies', 'interests',
    'wantKids', 'openToRelocate', 'preferredAgeMin', 'preferredAgeMax',
    'preferredLocations', 'preferredEducation',
  ]
  const filled = fields.filter(f => {
    const val = customer[f]
    return val !== null && val !== undefined && val !== '' && val !== '[]'
  }).length
  return Math.round((filled / fields.length) * 100)
}

export function formatIncome(lpa: number | null | undefined): string {
  if (!lpa) return 'Not specified'
  if (lpa >= 100) return `${(lpa / 100).toFixed(1)} Cr/yr`
  return `${lpa.toFixed(1)} LPA`
}

export function formatHeight(cm: number): string {
  const feet = Math.floor(cm / 30.48)
  const inches = Math.round((cm % 30.48) / 2.54)
  return `${feet}'${inches}" (${cm} cm)`
}
