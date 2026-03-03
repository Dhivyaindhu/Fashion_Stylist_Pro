/**
 * /api/tryon — Multi-Space Virtual Try-On (FREE)
 * ─────────────────────────────────────────────────────────────────
 * Tries 3 different free HuggingFace Spaces in order.
 * If one hits quota, it automatically falls back to the next.
 *
 * Order:
 *  1. Nymbo/Virtual-Try-On       — different quota pool, open API
 *  2. freddyaboulton/IDM-VTON    — separate IDM-VTON mirror
 *  3. yisol/IDM-VTON             — original (may hit ZeroGPU quota)
 *
 * Required env var:
 *   HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *   Get free at: huggingface.co/settings/tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { Client }                    from '@gradio/client'

const HF_TOKEN = process.env.HF_TOKEN ?? ''

function dataUriToBlob(dataUri: string): Blob {
  const [header, b64] = dataUri.split(',')
  const mime          = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const buf           = Buffer.from(b64, 'base64')
  return new Blob([buf], { type: mime })
}

async function urlToDataUri(url: string): Promise<string> {
  const resp = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!resp.ok) throw new Error(`Failed to download image: ${resp.status}`)
  const buf  = await resp.arrayBuffer()
  const mime = resp.headers.get('content-type') ?? 'image/jpeg'
  const b64  = Buffer.from(buf).toString('base64')
  return `data:${mime};base64,${b64}`
}

function extractUrl(outputData: any[]): string | null {
  const img = outputData?.[0]
  if (!img) return null
  if (typeof img === 'string' && img.startsWith('data:'))  return img
  if (typeof img === 'string' && img.startsWith('http'))   return img
  if (img?.url)  return img.url
  if (img?.path) {
    const path = img.path.startsWith('/') ? img.path : `/${img.path}`
    // Will be resolved to correct space URL by caller
    return `__path__${path}`
  }
  return null
}

// ── Space 1: Nymbo/Virtual-Try-On ────────────────────────────────
async function tryNymbo(personBlob: Blob, garmentBlob: Blob): Promise<string> {
  console.log('Trying Space 1: Nymbo/Virtual-Try-On...')
  const client = await Client.connect('Nymbo/Virtual-Try-On', {
    hf_token: HF_TOKEN as `hf_${string}`,
  })
  const result     = await client.predict('/tryon', [
    { background: personBlob, layers: [], composite: null },
    garmentBlob,
    'outfit',
    true,
    false,
    30,
    42,
  ])
  const data       = result.data as any[]
  let url          = extractUrl(data)
  if (!url) throw new Error('No output from Nymbo space')
  if (url.startsWith('__path__')) {
    url = `https://nymbo-virtual-try-on.hf.space/file=${url.replace('__path__', '')}`
  }
  return url.startsWith('data:') ? url : await urlToDataUri(url)
}

// ── Space 2: freddyaboulton/IDM-VTON ─────────────────────────────
async function tryFreddy(personBlob: Blob, garmentBlob: Blob): Promise<string> {
  console.log('Trying Space 2: freddyaboulton/IDM-VTON...')
  const client = await Client.connect('freddyaboulton/IDM-VTON', {
    hf_token: HF_TOKEN as `hf_${string}`,
  })
  const result     = await client.predict('/tryon', [
    { background: personBlob, layers: [], composite: null },
    garmentBlob,
    'outfit',
    true,
    false,
    30,
    42,
  ])
  const data       = result.data as any[]
  let url          = extractUrl(data)
  if (!url) throw new Error('No output from freddyaboulton space')
  if (url.startsWith('__path__')) {
    url = `https://freddyaboulton-idm-vton.hf.space/file=${url.replace('__path__', '')}`
  }
  return url.startsWith('data:') ? url : await urlToDataUri(url)
}

// ── Space 3: yisol/IDM-VTON (original) ───────────────────────────
async function tryYisol(personBlob: Blob, garmentBlob: Blob): Promise<string> {
  console.log('Trying Space 3: yisol/IDM-VTON (original)...')
  const client = await Client.connect('yisol/IDM-VTON', {
    hf_token: HF_TOKEN as `hf_${string}`,
  })
  const result     = await client.predict('/tryon', [
    { background: personBlob, layers: [], composite: null },
    garmentBlob,
    'outfit',
    true,
    false,
    30,
    42,
  ])
  const data       = result.data as any[]
  let url          = extractUrl(data)
  if (!url) throw new Error('No output from yisol space')
  if (url.startsWith('__path__')) {
    url = `https://yisol-idm-vton.hf.space/file=${url.replace('__path__', '')}`
  }
  return url.startsWith('data:') ? url : await urlToDataUri(url)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { human_img, garm_img, garment_des } = body

    if (!human_img || !garm_img) {
      return NextResponse.json({ error: 'human_img and garm_img are required.' }, { status: 400 })
    }
    if (!HF_TOKEN) {
      return NextResponse.json(
        { error: 'HF_TOKEN not set. Get a free token at huggingface.co/settings/tokens and add it to Vercel env vars.' },
        { status: 500 }
      )
    }

    const personBlob  = dataUriToBlob(human_img)
    const garmentBlob = dataUriToBlob(garm_img)
    const errors: string[] = []

    // ── Try all 3 spaces in order ─────────────────────────────────
    for (const [name, fn] of [
      ['Nymbo/Virtual-Try-On',      () => tryNymbo(personBlob, garmentBlob)],
      ['freddyaboulton/IDM-VTON',   () => tryFreddy(personBlob, garmentBlob)],
      ['yisol/IDM-VTON',            () => tryYisol(personBlob, garmentBlob)],
    ] as [string, () => Promise<string>][]) {
      try {
        const dataUri = await fn()
        console.log(`✅ Success with ${name}`)
        return NextResponse.json({ output_url: dataUri, source: name })
      } catch (e: any) {
        const msg = e?.message ?? String(e)
        console.warn(`❌ ${name} failed: ${msg}`)
        errors.push(`${name}: ${msg}`)
        // Continue to next space
      }
    }

    // All 3 failed
    return NextResponse.json(
      { error: `All try-on spaces are busy or at quota. Try again in ~1 hour.\n\nDetails:\n${errors.join('\n')}` },
      { status: 503 }
    )

  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
