import { NextRequest, NextResponse } from 'next/server'

const HF = process.env.HF_SPACE_URL ?? ''

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const hfForm = new FormData()

    const file     = form.get('file') as File
    const category = (form.get('category') as string) ?? 'Women'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    hfForm.append('file', file)
    hfForm.append('category', category)

    const hfRes = await fetch(`${HF}/analyze`, {
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
