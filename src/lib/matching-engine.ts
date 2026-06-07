type Customer = any
type PoolProfile = any

export interface MatchScore {
  profile: any
  score: number
  label: 'High Potential' | 'Strong Fit' | 'Good Compatibility' | 'Worth Exploring'
  strengths: string[]
  discussionAreas: string[]
  explanation: string
}

function parseJSON(str: string | null | undefined): string[] {
  if (!str) return []
  try { return JSON.parse(str) } catch { return [] }
}

function scoreLabel(score: number): MatchScore['label'] {
  if (score >= 80) return 'High Potential'
  if (score >= 65) return 'Strong Fit'
  if (score >= 50) return 'Good Compatibility'
  return 'Worth Exploring'
}

function matchMaleWithFemale(customer: Customer, pool: PoolProfile): Omit<MatchScore, 'profile'> {
  let score = 0
  const strengths: string[] = []
  const discussionAreas: string[] = []

  const ageDiff = customer.age - pool.age
  if (ageDiff >= 0 && ageDiff <= 5) { score += 15; strengths.push('Compatible age difference') }
  else if (ageDiff > 5 && ageDiff <= 8) { score += 8 }
  else if (ageDiff < 0) { score += 2; discussionAreas.push('Age gap consideration — she is older') }
  else { discussionAreas.push('Large age gap may require discussion') }

  const custIncome = customer.incomeLPA || 0
  const poolIncome = pool.incomeLPA || 0
  if (custIncome > poolIncome) { score += 10; strengths.push('Income compatibility aligned') }
  else if (custIncome === poolIncome) { score += 6 }
  else { score += 2; discussionAreas.push('Income dynamics worth discussing') }

  if (customer.heightCm > pool.heightCm) { score += 8; strengths.push('Physical compatibility') }
  else { score += 2 }

  if (customer.wantKids === pool.wantKids) { score += 15; strengths.push('Aligned on family planning') }
  else if (customer.wantKids === 'Maybe' || pool.wantKids === 'Maybe') { score += 7 }
  else { score += 0; discussionAreas.push('Different views on having children — important to discuss') }

  if (customer.religion === pool.religion) { score += 12; strengths.push('Shared religious background') }
  else { score += 2; discussionAreas.push('Different religious backgrounds') }

  if (customer.familyValues === pool.familyValues) { score += 10; strengths.push('Shared family values') }
  else if (
    (customer.familyValues === 'Moderate' && pool.familyValues !== 'Traditional') ||
    (pool.familyValues === 'Moderate' && customer.familyValues !== 'Traditional')
  ) { score += 5 }
  else { discussionAreas.push('Different approaches to family traditions') }

  if (customer.openToRelocate === 'Yes' || pool.openToRelocate === 'Yes') { score += 8; strengths.push('Open to relocation') }
  else if (customer.openToRelocate === 'Maybe' || pool.openToRelocate === 'Maybe') { score += 5 }
  else { discussionAreas.push('Both prefer to stay in their current city — location needs discussion') }

  if (customer.city === pool.city) { score += 7; strengths.push('Same city — easier initial meetings') }

  if (customer.dietaryPreference === pool.dietaryPreference) { score += 5; strengths.push('Compatible dietary preferences') }
  else if (customer.dietaryPreference === 'Vegetarian' && pool.dietaryPreference === 'Jain Vegetarian') { score += 3 }

  if (customer.smoking === pool.smoking && customer.drinking === pool.drinking) { score += 5; strengths.push('Aligned lifestyle choices') }
  else if (pool.smoking === 'Regularly') { score -= 5; discussionAreas.push('Lifestyle differences around smoking') }

  if (
    pool.preferredAgeMin && pool.preferredAgeMax &&
    customer.age >= pool.preferredAgeMin && customer.age <= pool.preferredAgeMax
  ) { score += 5 }

  score = Math.min(100, Math.max(0, score))
  return { score, label: scoreLabel(score), strengths, discussionAreas, explanation: generateExplanation(customer, pool, score, strengths, discussionAreas, 'male') }
}

function matchFemaleWithMale(customer: Customer, pool: PoolProfile): Omit<MatchScore, 'profile'> {
  let score = 0
  const strengths: string[] = []
  const discussionAreas: string[] = []

  const professionalPairs: Record<string, string[]> = {
    'Doctor': ['Doctor', 'Lawyer', 'Architect', 'Consultant'],
    'Lawyer': ['Doctor', 'Lawyer', 'Investment Banker', 'Consultant'],
    'Software Engineer': ['Software Engineer', 'Data Scientist', 'Product Manager', 'Entrepreneur'],
    'Chartered Accountant': ['CA', 'Financial Analyst', 'Investment Banker', 'Consultant'],
    'Architect': ['Architect', 'Designer', 'Entrepreneur', 'Consultant'],
  }
  const compatible = professionalPairs[customer.profession || ''] || []
  if (compatible.includes(pool.profession || '')) { score += 15; strengths.push('Complementary professional backgrounds') }
  else { score += 5 }

  if (customer.familyValues === pool.familyValues) { score += 15; strengths.push('Deeply aligned family values') }
  else if (Math.abs(['Traditional', 'Moderate', 'Liberal'].indexOf(customer.familyValues || 'Moderate') -
    ['Traditional', 'Moderate', 'Liberal'].indexOf(pool.familyValues || 'Moderate')) === 1) {
    score += 8
  } else {
    discussionAreas.push('Notable difference in family values orientation')
  }

  if (customer.openToRelocate === pool.openToRelocate) { score += 12; strengths.push('Aligned on relocation') }
  else if (customer.openToRelocate === 'Yes') { score += 10; strengths.push('Open to relocation for the right match') }
  else if (customer.openToRelocate === 'Maybe') { score += 6 }
  else { discussionAreas.push('Relocation expectations need careful discussion') }

  if (customer.wantKids === pool.wantKids) { score += 12; strengths.push('Aligned on family planning') }
  else if (customer.wantKids === 'Maybe' || pool.wantKids === 'Maybe') { score += 6 }
  else { discussionAreas.push('Differing views on children — a key conversation to have early') }

  const lifestyleScore =
    (customer.dietaryPreference === pool.dietaryPreference ? 4 : 0) +
    (customer.smoking === pool.smoking ? 3 : pool.smoking === 'Regularly' ? -3 : 0) +
    (customer.drinking === pool.drinking ? 3 : 0)
  score += Math.max(0, lifestyleScore)
  if (lifestyleScore >= 6) strengths.push('Compatible lifestyle preferences')
  else if (lifestyleScore < 2) discussionAreas.push('Lifestyle alignment worth exploring')

  const eduLevels = ['Graduate', 'Post Graduate', 'Professional Degree']
  const custEdu = eduLevels.indexOf(customer.preferredEducation || 'Graduate')
  const poolDeg = pool.degree?.includes('MBA') || pool.degree?.includes('M.Tech') || pool.degree?.includes('MBBS') ? 2 : 1
  if (Math.abs(custEdu - poolDeg) <= 1) { score += 8; strengths.push('Comparable educational backgrounds') }

  if (customer.religion === pool.religion) { score += 10; strengths.push('Shared faith and religious values') }
  else { discussionAreas.push('Different religious backgrounds to navigate') }

  if (customer.city === pool.city) { score += 8; strengths.push('Same city — convenient for meetings') }
  else {
    const preferredLocs = parseJSON(customer.preferredLocations)
    if (preferredLocs.includes(pool.city)) { score += 5 }
    else { discussionAreas.push('Different cities — logistics of meeting to plan') }
  }

  if (
    customer.preferredAgeMin && customer.preferredAgeMax &&
    pool.age >= customer.preferredAgeMin && pool.age <= customer.preferredAgeMax
  ) { score += 5; strengths.push('Within preferred age range') }

  score = Math.min(100, Math.max(0, score))
  return { score, label: scoreLabel(score), strengths, discussionAreas, explanation: generateExplanation(customer, pool, score, strengths, discussionAreas, 'female') }
}

function generateExplanation(
  customer: Customer,
  pool: PoolProfile,
  score: number,
  strengths: string[],
  discussionAreas: string[],
  gender: 'male' | 'female'
): string {
  const name = customer.firstName
  const matchName = pool.firstName

  if (score >= 80) {
    return `${name} and ${matchName} show strong alignment across key compatibility dimensions. ${strengths.slice(0, 2).join(' and ')} stand out as particularly strong foundations. ${discussionAreas.length > 0 ? `The primary area for early conversation would be ${discussionAreas[0].toLowerCase()}.` : 'No major compatibility concerns were identified.'} This pairing warrants an introduction.`
  } else if (score >= 65) {
    return `${name} and ${matchName} are a solid match with meaningful compatibility. ${strengths.length > 0 ? strengths[0] + ' is a notable strength.' : ''} ${discussionAreas.length > 0 ? `Worth discussing ${discussionAreas[0].toLowerCase()} early in the process.` : ''} A positive introduction is recommended.`
  } else if (score >= 50) {
    return `${name} and ${matchName} have a reasonable compatibility baseline. ${strengths.length > 0 ? 'Key strength: ' + strengths[0] + '.' : ''} ${discussionAreas.length > 0 ? 'Areas to navigate include: ' + discussionAreas.slice(0, 2).join(', ').toLowerCase() + '.' : ''} Proceed with a light-touch introduction and gather feedback.`
  } else {
    return `${name} and ${matchName} have some compatibility but notable differences exist. ${discussionAreas.length > 0 ? 'Key areas to consider: ' + discussionAreas[0].toLowerCase() + '.' : ''} Best introduced only if client has shown flexibility in these areas during discovery sessions.`
  }
}

export function computeMatches(customer: any, pool: any[]): MatchScore[] {
  const oppositeGender = customer.gender === 'Male' ? 'Female' : 'Male'
  const filteredPool = pool.filter(p => p.gender === oppositeGender)

  const results: MatchScore[] = filteredPool.map(profile => {
    const result = customer.gender === 'Male'
      ? matchMaleWithFemale(customer, profile)
      : matchFemaleWithMale(customer, profile)
    return { profile, ...result }
  })

  return results.sort((a, b) => b.score - a.score)
}
