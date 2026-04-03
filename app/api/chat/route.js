// app/api/chat/route.js
// Dashboard chatbot API — uses Groq (Llama 3.3) for the Priya guide

import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { messages, systemPrompt } = await req.json()

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY is not set')
      return NextResponse.json({ reply: 'API key not configured. Please check server settings.' }, { status: 500 })
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Groq API error: ${response.status}`, errorText)
      return NextResponse.json({ reply: 'AI service temporarily unavailable. Please try again in a moment. 🙏' }, { status: 500 })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Sorry, could not generate a response.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('❌ Chat API error:', err.message)
    return NextResponse.json({ reply: 'Server error. Please try again.' }, { status: 500 })
  }
}