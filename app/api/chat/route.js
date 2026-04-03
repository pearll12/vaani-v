// app/api/chat/route.js
// Place this file at: src/app/api/chat/route.js

import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { messages, systemPrompt } = await req.json()

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        max_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Something went wrong!'

    return NextResponse.json({ reply })
  } catch (err) {
    return NextResponse.json({ reply: 'Server error. Please try again.' }, { status: 500 })
  }
}