/**
 * /api/tryon — Smart Try-On with automatic fallback chain
 * ─────────────────────────────────────────────────────────
 * Priority:
 *  1. yisol/IDM-VTON (HF)       → free, photorealistic, ~5-10/day quota
 *  2. Segmind SegFit v1.3        → photorealistic, 100 FREE calls/day, ~₹1/call after
 *  3. Replicate IDM-VTON         → photorealistic, ~₹4/try-on, unlimited
 *  4. Your own HF Space          → free, unlimited, YOLOv8 quality
 *
 * Env vars needed:
 *   HF_TOKEN            → free at huggingface.co/settings/tokens
 *   SEGMIND_API_KEY     → free at segmind.com (100 free calls/day!)
 *   REPLICATE_API_TOKEN → replicate.com (only used if both above fail)
 *   HF_SPACE_URL        → your own HF Space URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { Client }                    from '@gradio/client'

const HF_TOKEN            = process.env.HF_TOKEN            ?? ''
const SEGMIND_API_KEY     = process.env.SEGMIND_API_KEY     ?? ''
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

// ── Method 1: IDM-VTON on HuggingFace (free, ~5-10/day) ──────────
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

// ── Method 2: Segmind SegFit v1.3 (100 FREE calls/day!) ──────────
// Sign up free at segmind.com — no credit card needed for free tier
async function trySegmind(humanImg: string, garmImg: string): Promise<string> {
  if (!SEGMIND_API_KEY) throw new Error('SEGMIND_API_KEY not set')

  // Convert data URIs to Blobs for multipart upload
  const personBlob  = dataUriToBlob(humanImg)
  const garmentBlob = dataUriToBlob(garmImg)

  const form = new FormData()
  form.append('model_image',  personBlob,  'person.jpg')
  form.append('outfit_image', garmentBlob, 'garment.jpg')
  form.append('quality',      'quality')   // fast / balanced / quality

  const resp = await fetch('https://api.segmind.com/v1/segfit-v1.3', {
    method: 'POST',
    headers: { 'x-api-key': SEGMIND_API_KEY },
    body: form,
    signal: AbortSignal.timeout(120_000),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(`Segmind failed: ${err?.error ?? resp.status}`)
  }

  // Segmind returns the image directly as binary (not JSON)
  const contentType = resp.headers.get('content-type') ?? 'image/jpeg'
  if (contentType.includes('application/json')) {
    const json = await resp.json()
    throw new Error(`Segmind error: ${json?.error ?? JSON.stringify(json)}`)
  }

  const buf = await resp.arrayBuffer()
  return `data:${contentType};base64,${Buffer.from(buf).toString('base64')}`
}

// ── Method 3: Replicate IDM-VTON (~₹4/try-on, unlimited) ─────────
async function tryReplicate(humanImg: string, garmImg: string): Promise<string> {
  if (!REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN not set')

  const startResp = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: 'c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4',
      input: { human_img: humanImg, garm_img: garmImg, garment_des: 'outfit',
               is_checked: true, is_checked_crop: false, denoise_steps: 30, seed: 42, category: 'dresses' },
    }),
  })
  if (!startResp.ok) throw new Error(`Replicate start failed: ${startResp.status}`)
  const prediction = await startResp.json()
  const pollUrl    = prediction.urls?.get ?? `https://api.replicate.com/v1/predictions/${prediction.id}`

  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000))
    const poll = await fetch(pollUrl, { headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` } })
    const data = await poll.json()
    if (data.status === 'succeeded') {
      const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output
      return await urlToDataUri(outputUrl)
    }
    if (data.status === 'failed' || data.status === 'canceled') throw new Error(`Replicate: ${data.error}`)
  }
  throw new Error('Replicate timed out')
}

// ── Method 4: Own HF Space (free, unlimited, YOLOv8) ─────────────
async function tryOwnSpace(humanImg: string, garmImg: string): Promise<string> {
  if (!HF_SPACE_URL) throw new Error('HF_SPACE_URL not set')

  const extractForm = new FormData()
  extractForm.append('file', dataUriToBlob(garmImg), 'dress.png')
  const extractResp = await fetch(`${HF_SPACE_URL}/extract-dress`, {
    method: 'POST', body: extractForm, signal: AbortSignal.timeout(30_000),
  })
  if (!extractResp.ok) throw new Error(`extract-dress: ${extractResp.status}`)
  const { dress_b64, error: e1 } = await extractResp.json()
  if (e1) throw new Error(e1)

  const tryonForm = new FormData()
  tryonForm.append('person_image', dataUriToBlob(humanImg), 'person.jpg')
  tryonForm.append('dress_b64', dress_b64)
  const tryonResp = await fetch(`${HF_SPACE_URL}/virtual-tryon`, {
    method: 'POST', body: tryonForm, signal: AbortSignal.timeout(60_000),
  })
  if (!tryonResp.ok) throw new Error(`virtual-tryon: ${tryonResp.status}`)
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

    const methods = [
      { name: 'IDM-VTON · Free',       label: 'photorealistic · free',      fn: () => tryIDMVTON(personBlob, garmentBlob) },
      { name: 'SegFit · Free 100/day', label: 'photorealistic · 100 free/day', fn: () => trySegmind(human_img, garm_img) },
      { name: 'IDM-VTON · Replicate',  label: 'photorealistic · ~₹4',       fn: () => tryReplicate(human_img, garm_img) },
      { name: 'HF Space · YOLOv8',     label: 'free · unlimited',            fn: () => tryOwnSpace(human_img, garm_img) },
    ]

    for (const { name, fn } of methods) {
      try {
        console.log(`Trying: ${name}`)
        const result = await fn()
        console.log(`✅ Success: ${name}`)
        return NextResponse.json({ output_url: result, method: name })
      } catch (e: any) {
        console.warn(`❌ ${name} failed: ${e.message}`)
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
