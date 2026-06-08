import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

export async function POST(req: NextRequest) {
  try {
    const { customer, profile, score, label, strengths } = await req.json()

    const prompt = `You are a warm, professional Indian matchmaker. Write a 2-3 sentence personalised introduction note presenting a match recommendation to your team.

Client: ${customer.firstName} ${customer.lastName}, ${customer.age} yrs, ${customer.profession || 'professional'} in ${customer.city}. ${customer.religion || ''} background, ${customer.familyValues || 'moderate'} values, ${customer.wantKids === 'Yes' ? 'wants children' : customer.wantKids === 'No' ? 'does not want children' : 'open about children'}.

Recommended match: ${profile.firstName} ${profile.lastName}, ${profile.age} yrs, ${profile.profession || 'professional'} in ${profile.city}. ${profile.religion || ''} background, ${profile.familyValues || 'moderate'} values.

Compatibility: ${score}% — ${label}. Key strengths: ${strengths.slice(0, 3).join(', ')}.

Write the note in first-person as the matchmaker. Be specific, warm, and avoid generic filler phrases. Keep it under 80 words.`

    const response = await openai.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
      temperature: 0.75,
    })

    const intro = response.choices[0].message.content?.trim() || ''
    return NextResponse.json({ intro })
  } catch (err: any) {
    return NextResponse.json({ intro: '' }, { status: 200 })
  }
}
