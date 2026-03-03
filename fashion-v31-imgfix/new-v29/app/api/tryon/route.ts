/**
 * /api/tryon — Calls yisol/IDM-VTON on HuggingFace Spaces (FREE)
 * ─────────────────────────────────────────────────────────────────
 * IMPORTANT FIX: IDM-VTON returns a temporary /tmp/gradio/xxx path
 * that expires within seconds. We immediately download the image and
 * return it as a base64 data URI so it never expires in the browser.
 *
 * Required env var (.env.local  /  Vercel  /  HF Space Secrets):
 *   HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *
 * Get a FREE token at: https://huggingface.co/settings/tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { Client }                    from '@gradio/client'

const HF_TOKEN = process.env.HF_TOKEN ?? ''

/** Convert a base64 data URI → Blob */
function dataUriToBlob(dataUri: string): Blob {
  const [header, b64] = dataUri.split(',')
  const mime          = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
  const buf           = Buffer.from(b64, 'base64')
  return new Blob([buf], { type: mime })
}

/**
 * Download image from any URL and return as base64 data URI.
 * This is critical — IDM-VTON temporary files expire in seconds.
 */
async function urlToDataUri(url: string): Promise<string> {
  const resp     = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!resp.ok) throw new Error(`Failed to download result image: ${resp.status}`)
  const buf      = await resp.arrayBuffer()
  const mime     = resp.headers.get('content-type') ?? 'image/jpeg'
  const b64      = Buffer.from(buf).toString('base64')
  return `data:${mime};base64,${b64}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { human_img, garm_img, garment_des } = body

    if (!human_img || !garm_img) {
      return NextResponse.json(
        { error: 'human_img and garm_img are required.' },
        { status: 400 }
      )
    }

    if (!HF_TOKEN) {
      return NextResponse.json(
        { error: 'HF_TOKEN not set. Get a free token at huggingface.co/settings/tokens and add HF_TOKEN=hf_xxx to .env.local (local) / Vercel env vars / HF Space secrets.' },
        { status: 500 }
      )
    }

    // ── Connect to IDM-VTON on HuggingFace ────────────────────────────
    console.log('Connecting to yisol/IDM-VTON...')
    const client = await Client.connect('yisol/IDM-VTON', {
      hf_token: HF_TOKEN as `hf_${string}`,
    })

    const personBlob  = dataUriToBlob(human_img)
    const garmentBlob = dataUriToBlob(garm_img)

    // ── Call /tryon with positional array (required by this Space) ────
    console.log('Calling IDM-VTON /tryon...')
    const result = await client.predict('/tryon', [
      { background: personBlob, layers: [], composite: null },
      garmentBlob,
      garment_des ?? 'outfit',
      true,   // is_checked  — auto-mask ON
      false,  // is_checked_crop — crop OFF
      30,     // denoise_steps
      42,     // seed
    ])

    // ── Extract output URL from Gradio response ────────────────────────
    const outputData = result.data as any[]
    const img        = outputData?.[0]

    console.log('IDM-VTON raw output type:', typeof img, Object.keys(img ?? {}))

    let tempUrl: string | null = null

    if (typeof img === 'string' && img.startsWith('data:')) {
      // Already a data URI — return directly, no download needed
      return NextResponse.json({ output_url: img })
    } else if (typeof img === 'string' && img.startsWith('http')) {
      tempUrl = img
    } else if (img?.url) {
      tempUrl = img.url
    } else if (img?.path) {
      // Temporary path — must resolve to full URL immediately
      const path = img.path.startsWith('/') ? img.path : `/${img.path}`
      tempUrl    = `https://yisol-idm-vton.hf.space/file=${path}`
    }

    if (!tempUrl) {
      console.error('No output URL found in:', JSON.stringify(outputData))
      return NextResponse.json(
        { error: 'IDM-VTON returned no output image. Try again in 30 seconds.' },
        { status: 500 }
      )
    }

    // ── CRITICAL: Download immediately before the temp file expires ───
    console.log('Downloading result image from:', tempUrl)
    const dataUri = await urlToDataUri(tempUrl)
    console.log('Image downloaded, size:', Math.round(dataUri.length / 1024), 'KB')

    return NextResponse.json({ output_url: dataUri })

  } catch (e: any) {
    const msg = e?.message ?? String(e)
    console.error('IDM-VTON error:', msg)

    if (msg.includes('401') || msg.includes('unauthorized')) {
      return NextResponse.json(
        { error: 'HF_TOKEN invalid. Check your token at huggingface.co/settings/tokens' },
        { status: 401 }
      )
    }
    if (msg.includes('quota') || msg.includes('ZeroGPU') || msg.includes('GPU')) {
      return NextResponse.json(
        { error: 'ZeroGPU quota reached. Wait ~1 hour or upgrade to HuggingFace PRO for higher limits.' },
        { status: 429 }
      )
    }
    if (msg.includes('SSE') || msg.includes('connect') || msg.includes('fetch') || msg.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'IDM-VTON Space is sleeping or busy. Wait 30 seconds and try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
