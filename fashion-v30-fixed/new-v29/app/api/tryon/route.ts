/**
 * /api/tryon — Calls yisol/IDM-VTON on HuggingFace Spaces (FREE)
 * ─────────────────────────────────────────────────────────────────
 * Uses @gradio/client to call the official IDM-VTON Gradio Space.
 * Photorealistic results — same diffusion model as Replicate, completely free.
 *
 * Required env var (.env.local):
 *   HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *
 * Get a FREE token at: https://huggingface.co/settings/tokens
 * (Free account → no payment, just sign up)
 *
 * Speed: ~30–120s depending on ZeroGPU queue
 *
 * IMPORTANT: Parameters must be passed as a POSITIONAL ARRAY to this
 * Gradio Space — named object format does NOT work with IDM-VTON.
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
        { error: 'HF_TOKEN not set. Get a free token at huggingface.co/settings/tokens and add HF_TOKEN=hf_xxx to .env.local' },
        { status: 500 }
      )
    }

    // ── Connect to IDM-VTON on HuggingFace ────────────────────────────
    const client = await Client.connect('yisol/IDM-VTON', {
      hf_token: HF_TOKEN as `hf_${string}`,
    })

    const personBlob  = dataUriToBlob(human_img)
    const garmentBlob = dataUriToBlob(garm_img)

    // ── Call /tryon — MUST be positional array, not named object ──────
    // Parameter order confirmed from IDM-VTON Gradio app.py:
    // [0] dict  — ImageEditor  { background: Blob, layers: [], composite: null }
    // [1] garm_img   — garment image Blob
    // [2] garment_des — text description string
    // [3] is_checked  — true = auto-mask generation
    // [4] is_checked_crop — false = no crop
    // [5] denoise_steps — 30 (good quality/speed tradeoff)
    // [6] seed — 42
    const result = await client.predict('/tryon', [
      { background: personBlob, layers: [], composite: null },
      garmentBlob,
      garment_des ?? 'outfit',
      true,   // auto-mask ON
      false,  // crop OFF
      30,     // denoise steps
      42,     // seed
    ])

    // ── Extract output image URL ───────────────────────────────────────
    // Gradio returns array: [try-on image, masked image]
    // First item is the photorealistic try-on result
    const outputData = result.data as any[]
    const img        = outputData?.[0]

    let outputUrl: string | null = null

    if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:'))) {
      outputUrl = img
    } else if (img?.url) {
      outputUrl = img.url                           // Gradio 4.x file object
    } else if (img?.path) {
      // Resolve relative path to full Space URL
      outputUrl = `https://yisol-idm-vton.hf.space/file=${img.path}`
    }

    if (!outputUrl) {
      console.error('IDM-VTON raw output:', JSON.stringify(outputData))
      return NextResponse.json(
        { error: 'IDM-VTON returned no output image. The Space may be busy — try again in 30 seconds.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ output_url: outputUrl })

  } catch (e: any) {
    const msg = e?.message ?? String(e)
    console.error('IDM-VTON error:', msg)

    // Friendly errors for common failures
    if (msg.includes('401') || msg.includes('unauthorized')) {
      return NextResponse.json(
        { error: 'HF_TOKEN invalid. Check your token at huggingface.co/settings/tokens' },
        { status: 401 }
      )
    }
    if (msg.includes('quota') || msg.includes('ZeroGPU') || msg.includes('GPU')) {
      return NextResponse.json(
        { error: 'ZeroGPU daily quota reached. Wait ~1 hour or upgrade to HuggingFace PRO ($9/mo) for higher limits.' },
        { status: 429 }
      )
    }
    if (msg.includes('SSE') || msg.includes('connect') || msg.includes('fetch')) {
      return NextResponse.json(
        { error: 'IDM-VTON Space is sleeping or busy. Wait 30 seconds and try again — it will wake up automatically.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
