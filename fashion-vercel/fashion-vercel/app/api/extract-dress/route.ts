import { NextRequest, NextResponse } from 'next/server'

const HF = process.env.HF_SPACE_URL ?? ''

export async function POST(req: NextRequest) {
  try {
    const form    = await req.formData()
    const file    = form.get('file') as File

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const hfForm = new FormData()
    hfForm.append('file', file)

    const hfRes = await fetch(`${HF}/extract-dress`, {
      method: 'POST',
      body: hfForm,
    })

    if (!hfRes.ok) {
      const text = await hfRes.text()
      return NextResponse.json({ error: text }, { status: hfRes.status })
    }

    const data = await hfRes.json()
    return NextResponse.json(data)

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
