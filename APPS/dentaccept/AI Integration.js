// supabase/functions/ai-explain/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

serve(async (req) => {
  const { procedure, language, concern } = await req.json()
  
  const systemPrompt = `You are a dental patient educator. Explain procedures in simple, empathetic language.
  Rules:
  - Use 8th-grade reading level
  - Focus on "what this means for YOU"
  - Include 1 specific consequence of waiting
  - Keep under 150 words
  - Never use medical jargon without explanation
  - ${language === 'es' ? 'Respond in Spanish' : 'Respond in English'}`
  
  const userPrompt = `Explain ${procedure} to a patient who is concerned about: ${concern || 'cost and pain'}.
  Include: what it is, why they need it, what happens during the procedure, and what happens if they wait.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  })

  const data = await response.json()
  
  return new Response(JSON.stringify({
    explanation: data.content[0].text,
    procedure,
    language,
    cached: false
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})