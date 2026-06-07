export interface DiscoveryInsights {
  relationshipGoals: string
  coreValues: string[]
  dealbreakers: string[]
  familyExpectations: string
  relocationPreference: string
  lifestylePreferences: string[]
  partnerExpectations: string
}

const RELATIONSHIP_GOAL_PATTERNS = [
  /looking for.*?(marriage|partner|relationship|commitment)/i,
  /want.*?(serious|long.?term|settle)/i,
  /goal.*?(family|settle|married)/i,
]

const VALUE_KEYWORDS: Record<string, string[]> = {
  'Family First': ['family', 'close family', 'family-oriented', 'family values'],
  'Honesty': ['honest', 'truthful', 'transparency', 'trust'],
  'Ambition': ['ambitious', 'career', 'driven', 'success'],
  'Work-Life Balance': ['balance', 'work-life', 'time for family'],
  'Respect': ['respect', 'mutual respect', 'boundaries'],
  'Spirituality': ['spiritual', 'faith', 'religious', 'prayer', 'temple'],
  'Independence': ['independent', 'own space', 'freedom'],
  'Loyalty': ['loyal', 'faithful', 'committed'],
}

const DEALBREAKER_PATTERNS: Record<string, RegExp[]> = {
  'Smoking': [/smoking.*?(no|never|hard no|dealbreaker)/i, /don't.*?smoke/i, /no.*?smoker/i],
  'Drinking': [/drinking.*?(no|never|dealbreaker)/i, /don't.*?drink/i, /alcohol.*?(no|never)/i],
  'No children': [/(don't|not).*?want.*?kids/i, /child.?free/i],
  'Different religion': [/same.*?religion/i, /religion.*?important/i],
  'Long distance': [/not.*?long.?distance/i, /can't.*?relocate/i],
}

const RELOCATION_PATTERNS: Record<string, RegExp[]> = {
  'Yes': [/open to relocat/i, /willing to move/i, /can relocate/i, /flexible.*?location/i],
  'No': [/(can't|cannot|won't).*?relocat/i, /stay.*?(here|city)/i, /not.*?move/i],
  'Maybe': [/depends/i, /right.*?person/i, /would consider/i, /maybe.*?relocat/i],
}

function extractRelationshipGoals(text: string): string {
  for (const pattern of RELATIONSHIP_GOAL_PATTERNS) {
    if (text.match(pattern)) return 'Seeking a serious, long-term relationship leading to marriage'
  }
  return 'Long-term committed relationship'
}

function extractCoreValues(text: string): string[] {
  const found: string[] = []
  const lower = text.toLowerCase()
  for (const [value, keywords] of Object.entries(VALUE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) found.push(value)
  }
  return found.length > 0 ? found : ['Honesty', 'Family Values', 'Respect']
}

function extractDealbreakers(text: string): string[] {
  const found: string[] = []
  for (const [dealbreaker, patterns] of Object.entries(DEALBREAKER_PATTERNS)) {
    if (patterns.some(p => p.test(text))) found.push(dealbreaker)
  }
  return found
}

function extractRelocationPreference(text: string): string {
  for (const [pref, patterns] of Object.entries(RELOCATION_PATTERNS)) {
    if (patterns.some(p => p.test(text))) return pref
  }
  return 'Maybe'
}

function extractLifestylePrefs(text: string): string[] {
  const prefs: string[] = []
  if (/travel/i.test(text)) prefs.push('Enjoys travelling')
  if (/cook|food|meal/i.test(text)) prefs.push('Values home-cooked meals')
  if (/fitness|gym|yoga|health/i.test(text)) prefs.push('Health-conscious lifestyle')
  if (/family.*?time|weekend.*?family/i.test(text)) prefs.push('Values family time on weekends')
  if (/outdoor|nature|hiking/i.test(text)) prefs.push('Outdoor activities')
  if (/read|book/i.test(text)) prefs.push('Reading and intellectual pursuits')
  return prefs.length > 0 ? prefs : ['Values quality time', 'Family-oriented lifestyle']
}

function extractFamilyExpectations(text: string): string {
  if (/close.*?family|joint.*?family|family.*?involved/i.test(text)) {
    return 'Expects close family involvement in life decisions and events'
  }
  if (/nuclear|independen|own.*?space/i.test(text)) {
    return 'Prefers a nuclear family setup with occasional family gatherings'
  }
  return 'Moderate family involvement, values maintaining cultural traditions'
}

function extractPartnerExpectations(text: string): string {
  const traits: string[] = []
  if (/ambitious|career|professional/i.test(text)) traits.push('professionally established')
  if (/kind|compassion|caring/i.test(text)) traits.push('kind and compassionate')
  if (/mature|grounded|stable/i.test(text)) traits.push('emotionally mature')
  if (/family|family.?oriented/i.test(text)) traits.push('family-oriented')
  if (/respect/i.test(text)) traits.push('respectful')
  if (traits.length === 0) return 'Looking for a caring, ambitious, and family-oriented partner'
  return `Partner should be ${traits.join(', ')}`
}

export function extractInsightsFromTranscript(transcriptText: string): DiscoveryInsights {
  return {
    relationshipGoals: extractRelationshipGoals(transcriptText),
    coreValues: extractCoreValues(transcriptText),
    dealbreakers: extractDealbreakers(transcriptText),
    familyExpectations: extractFamilyExpectations(transcriptText),
    relocationPreference: extractRelocationPreference(transcriptText),
    lifestylePreferences: extractLifestylePrefs(transcriptText),
    partnerExpectations: extractPartnerExpectations(transcriptText),
  }
}
