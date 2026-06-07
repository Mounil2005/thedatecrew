export interface Customer {
  id: string
  matchmakerId: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  age: number
  email: string
  phone: string
  country: string
  city: string
  openToRelocate: string
  heightCm: number
  undergradCollege: string | null
  degree: string | null
  currentCompany: string | null
  designation: string | null
  incomeLPA: number | null
  profession: string | null
  maritalStatus: string
  siblings: string | null
  familyType: string | null
  familyValues: string | null
  caste: string | null
  religion: string | null
  dietaryPreference: string | null
  smoking: string | null
  drinking: string | null
  languagesKnown: string | null
  hobbies: string | null
  interests: string | null
  wantKids: string
  openToPets: string
  preferredAgeMin: number | null
  preferredAgeMax: number | null
  preferredLocations: string | null
  preferredEducation: string | null
  preferredProfession: string | null
  statusTag: string
  profileCompleteness: number
  createdAt: Date
  updatedAt: Date
  notes?: Note[]
  journeyStages?: JourneyStage[]
  discoveryCalls?: DiscoveryCall[]
  areasForAttention?: AreaForAttention[]
}

export interface Note {
  id: string
  customerId: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface JourneyStage {
  id: string
  customerId: string
  stage: string
  status: string
  completedAt: Date | null
  notes: string | null
  createdAt: Date
}

export interface MatchRecommendation {
  id: string
  customerId: string
  matchProfileId: string
  compatibilityScore: number
  strengths: string
  discussionAreas: string
  aiExplanation: string
  matchLabel: string
  status: string
  sentAt: Date | null
  createdAt: Date
}

export interface DiscoveryCall {
  id: string
  customerId: string
  transcriptText: string | null
  relationshipGoals: string | null
  coreValues: string | null
  dealbreakers: string | null
  familyExpectations: string | null
  relocationPreference: string | null
  lifestylePreferences: string | null
  partnerExpectations: string | null
  processedAt: Date | null
  createdAt: Date
}

export interface AreaForAttention {
  id: string
  customerId: string
  category: string
  description: string
  severity: string
  createdAt: Date
}

export interface PoolProfile {
  id: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  age: number
  email: string
  phone: string
  country: string
  city: string
  openToRelocate: string
  heightCm: number
  undergradCollege: string | null
  degree: string | null
  currentCompany: string | null
  designation: string | null
  incomeLPA: number | null
  profession: string | null
  maritalStatus: string
  siblings: string | null
  familyType: string | null
  familyValues: string | null
  caste: string | null
  religion: string | null
  dietaryPreference: string | null
  smoking: string | null
  drinking: string | null
  languagesKnown: string | null
  hobbies: string | null
  wantKids: string
  openToPets: string
  preferredAgeMin: number | null
  preferredAgeMax: number | null
  preferredLocations: string | null
  createdAt: Date
}

export interface MatchScore {
  profile: PoolProfile
  score: number
  label: string
  strengths: string[]
  discussionAreas: string[]
  explanation: string
}
