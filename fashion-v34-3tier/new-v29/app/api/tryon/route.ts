/**
 * /api/tryon — Smart Try-On with automatic fallback chain
 * ─────────────────────────────────────────────────────────
 * Priority order:
 *  1. yisol/IDM-VTON (HF)   → free, photorealistic, ~5-10/day quota
 *  2. Replicate IDM-VTON     → photorealistic, ~₹4/try-on, unlimited
 *  3. Your own HF Space      → free, unlimited, YOLOv8 quality
 *
 * Env vars:
 *   HF_TOKEN              → free HF token (huggingface.co/settings/tokens)
 *   REPLICATE_API_TOKEN   → replicate.com token (~₹4/try-on, only used as fallback)
 *   HF_SPACE_URL          → your own HF Space URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { Client }                    from '@gradio/client'

const HF_TOKEN           = process.env.HF_TOKEN            ?? ''
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN ?? ''
const HF_SPACE_URL        = process.env.HF_SPACE_URL        ?? ''

function dataUriToBlob(dataUri: string): Blob {
  const [header, b64] = dataUri.split(',')
  const mime          = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  return new Blob([Buffer.from(b64, 'base64')], { type: mime })
}

async function urlToDataUri(url: string): Promise<string> {
  const resp = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`)
  const buf  = await resp.arrayBuffer()
  const mime = resp.headers.get('content-type') ?? 'image/jpeg'
  return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`
}

// ── Method 1: IDM-VTON on HuggingFace (free, photorealistic) ─────
async function tryIDMVTON(personBlob: Blob, garmentBlob: Blob): Promise<string> {
  if (!HF_TOKEN) throw new Error('HF_TOKEN not set')
  const client = await Client.connect('yisol/IDM-VTON', {
    hf_token: HF_TOKEN as `hf_${string}`,
  })
  const result = await client.predict('/tryon', [
    { background: personBlob, layers: [], composite: null },
    garmentBlob, 'outfit', true, false, 30, 42,
  ])
  const img = (result.data as any[])?.[0]
  if (!img) throw new Error('No output from IDM-VTON')
  let url = typeof img === 'string' ? img : (img?.url ?? `https://yisol-idm-vton.hf.space/file=${img?.path}`)
  return url.startsWith('data:') ? url : await urlToDataUri(url)
}

// ── Method 2: Replicate IDM-VTON (~₹4/try-on, unlimited) ─────────
async function tryReplicate(humanImg: string, garmImg: string): Promise<string> {
  if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN not set')

  // Start prediction
  const startResp = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      version: 'c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4',
      input: {
        human_img:    humanImg,
        garm_img:     garmImg,
        garment_des:  'outfit',
        is_checked:   true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed:          42,
        category:      'dresses',
      },
    }),
  })
  if (!startResp.ok) {
    const err = await startResp.json().catch(() => ({}))
    throw new Error(`Replicate start failed: ${err?.detail ?? startResp.status}`)
  }
  const prediction = await startResp.json()
  const pollUrl    = prediction.urls?.get ?? `https://api.replicate.com/v1/predictions/${prediction.id}`

  // Poll until complete (max 120s)
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const pollResp = await fetch(pollUrl, {
      headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` },
    })
    const poll = await pollResp.json()
    if (poll.status === 'succeeded') {
      const outputUrl = Array.isArray(poll.output) ? poll.output[0] : poll.output
      if (!outputUrl) throw new Error('Replicate returned no output')
      return await urlToDataUri(outputUrl)
    }
    if (poll.status === 'failed' || poll.status === 'canceled') {
      throw new Error(`Replicate prediction ${poll.status}: ${poll.error ?? ''}`)
    }
  }
  throw new Error('Replicate timed out after 120s')
}

// ── Method 3: Your own HF Space (free, unlimited, YOLOv8) ─────────
async function tryOwnSpace(humanImg: string, garmImg: string): Promise<string> {
  if (!HF_SPACE_URL) throw new Error('HF_SPACE_URL not set')

  const dressBlob   = dataUriToBlob(garmImg)
  const extractForm = new FormData()
  extractForm.append('file', dressBlob, 'dress.png')
  const extractResp = await fetch(`${HF_SPACE_URL}/extract-dress`, {
    method: 'POST', body: extractForm,
    signal: AbortSignal.timeout(30_000),
  })
  if (!extractResp.ok) throw new Error(`extract-dress failed: ${extractResp.status}`)
  const { dress_b64, error: e1 } = await extractResp.json()
  if (e1) throw new Error(e1)

  const personBlob = dataUriToBlob(humanImg)
  const tryonForm  = new FormData()
  tryonForm.append('person_image', personBlob, 'person.jpg')
  tryonForm.append('dress_b64', dress_b64)
  const tryonResp  = await fetch(`${HF_SPACE_URL}/virtual-tryon`, {
    method: 'POST', body: tryonForm,
    signal: AbortSignal.timeout(60_000),
  })
  if (!tryonResp.ok) throw new Error(`virtual-tryon failed: ${tryonResp.status}`)
  const { tryon_b64, error: e2 } = await tryonResp.json()
  if (e2) throw new Error(e2)
  return `data:image/jpeg;base64,${tryon_b64}`
}

export async function POST(req: NextRequest) {
  try {
    const { human_img, garm_img } = await req.json()
    if (!human_img || !garm_img) {
      return NextResponse.json({ error: 'human_img and garm_img required' }, { status: 400 })
    }

    const personBlob  = dataUriToBlob(human_img)
    const garmentBlob = dataUriToBlob(garm_img)

    // ── 1. IDM-VTON free (best quality, daily quota) ──────────────
    if (HF_TOKEN) {
      try {
        console.log('① Trying IDM-VTON (free)...')
        const result = await tryIDMVTON(personBlob, garmentBlob)
        console.log('✅ IDM-VTON success')
        return NextResponse.json({ output_url: result, method: 'IDM-VTON · Free' })
      } catch (e: any) {
        console.warn('❌ IDM-VTON failed:', e.message)
      }
    }

    // ── 2. Replicate fallback (photorealistic, ~₹4) ───────────────
    if (REPLICATE_API_TOKEN) {
      try {
        console.log('② Trying Replicate IDM-VTON (~₹4)...')
        const result = await tryReplicate(human_img, garm_img)
        console.log('✅ Replicate success')
        return NextResponse.json({ output_url: result, method: 'IDM-VTON · Replicate' })
      } catch (e: any) {
        console.warn('❌ Replicate failed:', e.message)
      }
    }

    // ── 3. Own HF Space (free, unlimited, lower quality) ──────────
    if (HF_SPACE_URL) {
      try {
        console.log('③ Trying own HF Space...')
        const result = await tryOwnSpace(human_img, garm_img)
        console.log('✅ Own HF Space success')
        return NextResponse.json({ output_url: result, method: 'HF Space · YOLOv8' })
      } catch (e: any) {
        console.warn('❌ Own HF Space failed:', e.message)
      }
    }

    return NextResponse.json(
      { error: 'All try-on methods unavailable. Please try again in ~1 hour.' },
      { status: 503 }
    )

  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
