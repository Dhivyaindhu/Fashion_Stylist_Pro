import { NextRequest, NextResponse } from 'next/server'

// Your Hugging Face Space URL — set HF_SPACE_URL in Vercel Environment Variables
const HF = (process.env.HF_SPACE_URL ?? '').replace(/\/$/, '')

export async function POST(req: NextRequest) {
  if (!HF) {
    return NextResponse.json(
      { error: 'HF_SPACE_URL environment variable is not set. Add it in Vercel → Settings → Environment Variables.' },
      { status: 500 }
    )
  }
  try {
    const form    = await req.formData()
    const file    = form.get('file') as File
    const category = (form.get('category') as string) ?? 'Women'
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const hfForm = new FormData()
    hfForm.append('file', file)
    hfForm.append('category', category)

    const hfRes = await fetch(`${HF}/analyze`, {
      method:  'POST',
      body:    hfForm,
      signal:  AbortSignal.timeout(60_000),  // 60 second timeout
    })

    if (!hfRes.ok) {
      const text = await hfRes.text()
      return NextResponse.json({ error: `HF Space error ${hfRes.status}: ${text}` }, { status: hfRes.status })
    }

    const data = await hfRes.json()
    return NextResponse.json(data)
  } catch (e: any) {
    if (e.name === 'TimeoutError') return NextResponse.json({ error: 'HF Space timed out (60s). The space may be sleeping — try again in 30s.' }, { status: 504 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
