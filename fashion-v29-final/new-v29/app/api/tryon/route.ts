/**
 * /api/tryon — Server-side proxy for Replicate IDM-VTON
 * ──────────────────────────────────────────────────────
 * Keeps REPLICATE_API_TOKEN secure on the server.
 *
 * Model: cuuupid/idm-vton on Replicate
 *   https://replicate.com/cuuupid/idm-vton
 *
 * Required env var (in .env.local):
 *   REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxx
 *
 * Cost: ~$0.04–0.06 per prediction (1024×1024 output)
 */

import { NextRequest, NextResponse } from 'next/server'

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN ?? ''

// IDM-VTON model version on Replicate
// Latest stable version — update if Replicate bumps it
const MODEL_VERSION = 'c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4'

export async function POST(req: NextRequest) {
  if (!REPLICATE_TOKEN) {
    return NextResponse.json(
      { error: 'REPLICATE_API_TOKEN not set. Add it to .env.local to enable photo-realistic try-on.' },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { human_img, garm_img, garment_des, category } = body

    if (!human_img || !garm_img) {
      return NextResponse.json({ error: 'human_img and garm_img are required.' }, { status: 400 })
    }

    // ── Step 1: Create prediction ──────────────────────────────
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${REPLICATE_TOKEN}`,
      },
      body: JSON.stringify({
        version: MODEL_VERSION,
        input: {
          human_img,          // data URI (data:image/jpeg;base64,...)
          garm_img,           // data URI
          garment_des: garment_des ?? 'outfit',
          category: category ?? 'dresses',  // 'upper_body' | 'lower_body' | 'dresses'
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,  // 30 = good quality/speed tradeoff (max 40)
          seed: 42,
        },
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      return NextResponse.json({ error: `Replicate create failed: ${errText}` }, { status: createRes.status })
    }

    const prediction = await createRes.json()
    const predictionId = prediction.id

    if (!predictionId) {
      return NextResponse.json({ error: 'No prediction ID returned from Replicate.' }, { status: 500 })
    }

    // ── Step 2: Poll for completion ────────────────────────────
    // IDM-VTON takes ~20–40 seconds on cold start, ~8–15s warm
    const maxAttempts = 60   // 60 × 2s = 2 minutes max
    let attempts = 0

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000))  // Poll every 2 seconds
      attempts++

      const pollRes = await fetch(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
          signal: AbortSignal.timeout(8_000),
        }
      )

      if (!pollRes.ok) continue

      const pollData = await pollRes.json()

      if (pollData.status === 'succeeded') {
        // IDM-VTON returns an array; first item is the try-on result image URL
        const outputUrl = Array.isArray(pollData.output)
          ? pollData.output[0]
          : pollData.output

        if (!outputUrl) {
          return NextResponse.json({ error: 'IDM-VTON returned no output URL.' }, { status: 500 })
        }

        return NextResponse.json({ output_url: outputUrl, prediction_id: predictionId })
      }

      if (pollData.status === 'failed' || pollData.status === 'canceled') {
        return NextResponse.json(
          { error: `IDM-VTON prediction ${pollData.status}: ${pollData.error ?? 'unknown error'}` },
          { status: 500 }
        )
      }

      // status is 'starting' or 'processing' — keep polling
    }

    return NextResponse.json({ error: 'Try-on timed out after 2 minutes. Try again.' }, { status: 504 })

  } catch (e: any) {
    if (e.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Request to Replicate timed out.' }, { status: 504 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
