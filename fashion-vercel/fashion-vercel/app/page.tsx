'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import UploadPanel   from './components/UploadPanel'
import DressTryOn    from './components/DressTryOn'
import RecommendPanel from './components/RecommendPanel'
import type { MorphData } from './components/AvatarViewer'

/* Three.js must be loaded client-side only */
const AvatarViewer = dynamic(() => import('./components/AvatarViewer'), { ssr: false })

/* ─── Types ──────────────────────────────────────────────── */
interface AnalysisResult {
  size:          string
  body_type:     string
  skin_tone:     string
  skin_hex:      string
  method:        string
  height_cm:     number
  shoulder_cm:   number
  bust_cm:       number
  waist_cm:      number
  hip_cm:        number
  inseam_cm:     number
  morph:         MorphData
  best_colors:   string[]
  avoid_colors:  string[]
  style_tips:    string[]
  body_icon:     string
  body_desc:     string
  vis_jpeg_b64:  string
}

type Step = 'analyse' | 'avatar' | 'tryon' | 'shop'

/* ─── Step tab config ─────────────────────────────────────── */
const STEPS: { id: Step; label: string; emoji: string }[] = [
  { id:'analyse', label:'Body Analysis', emoji:'📸' },
  { id:'avatar',  label:'3D Avatar',     emoji:'👤' },
  { id:'tryon',   label:'Virtual Try-On',emoji:'👗' },
  { id:'shop',    label:'Recommendations',emoji:'🛍' },
]

export default function Home() {
  const [step,    setStep]    = useState<Step>('analyse')
  const [result,  setResult]  = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [dressSrc,setDress]   = useState<string | null>(null)
  const [visImg,  setVisImg]  = useState<string | null>(null)

  /* ── Analyse ──────────────────────────────────────────── */
  const handleAnalyze = async (file: File, category: string) => {
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('category', category)

      const res  = await fetch('/api/analyze', { method:'POST', body: form })
      const data = await res.json()

      if (data.error) { setError(data.error); setLoading(false); return }

      setResult(data)
      if (data.vis_jpeg_b64)
        setVisImg(`data:image/jpeg;base64,${data.vis_jpeg_b64}`)
      setStep('avatar')
    } catch(e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  /* ── Try-on ───────────────────────────────────────────── */
  const handleTryOn = (src: string) => setDress(src)
  const handleClear = () => setDress(null)

  /* ─────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen" style={{ background:'#060610' }}>

      {/* ── Header ──────────────────────────────────────── */}
      <header className="border-b border-[#1e1848] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">👗</span>
          <div>
            <h1 className="font-bold text-xl text-white leading-none">3D Fashion Stylist</h1>
            <p className="text-xs text-purple-400">AI · 3D Avatar · Virtual Try-On</p>
          </div>
        </div>
        {result && (
          <div className="flex items-center gap-2 glass rounded-xl px-4 py-2">
            <span className="w-4 h-4 rounded-full border border-yellow-600"
                  style={{ background: result.skin_hex }}/>
            <span className="text-sm font-bold text-yellow-300">{result.size}</span>
            <span className="text-xs text-purple-400">{result.body_icon} {result.body_type}</span>
          </div>
        )}
      </header>

      {/* ── Step tabs ───────────────────────────────────── */}
      <nav className="flex border-b border-[#1e1848] px-6 overflow-x-auto">
        {STEPS.map(s => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            disabled={s.id !== 'analyse' && !result}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap
                        disabled:opacity-30 disabled:cursor-not-allowed
                        ${step===s.id
                          ? 'border-purple-500 text-purple-300'
                          : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </nav>

      {/* ── Main layout ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── LEFT PANEL ───────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* STEP: Analyse */}
          {step === 'analyse' && (
            <div className="glass rounded-2xl p-5">
              <h2 className="font-bold text-lg text-white mb-4">📸 Upload Your Photo</h2>
              <UploadPanel onAnalyze={handleAnalyze} loading={loading} />
              {error && (
                <div className="mt-3 p-3 bg-red-900/30 border border-red-800 rounded-xl
                                text-red-400 text-sm">
                  ❌ {error}
                </div>
              )}
            </div>
          )}

          {/* STEP: Avatar — measurements panel */}
          {step === 'avatar' && result && (
            <div className="glass rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="font-bold text-lg text-white">📏 Your Measurements</h2>

              {/* Detection overlay */}
              {visImg && (
                <img src={visImg} alt="detection overlay"
                     className="rounded-xl w-full max-h-64 object-contain bg-black/30" />
              )}

              {/* Measurement grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Height',   result.height_cm,   'cm'],
                  ['Shoulder', result.shoulder_cm,  'cm'],
                  ['Bust',     result.bust_cm,      'cm'],
                  ['Waist',    result.waist_cm,     'cm'],
                  ['Hip',      result.hip_cm,       'cm'],
                  ['Inseam',   result.inseam_cm,    'cm'],
                ].map(([lbl, val, unit]) => (
                  <div key={String(lbl)}
                       className="bg-[#1e1848] border border-[#2e2868] rounded-xl p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">{lbl}</p>
                    <p className="text-xl font-bold text-white">
                      {val}<span className="text-xs text-gray-500 ml-1">{unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Body type */}
              <div className="bg-[#1e1848] border border-[#2e2868] rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Body Type</p>
                <p className="text-xl font-bold text-white">
                  {result.body_icon} {result.body_type}
                </p>
                <p className="text-xs text-purple-400 mt-1">{result.body_desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.style_tips.map(t => (
                    <span key={t}
                          className="bg-purple-900/40 border border-purple-800 text-purple-300
                                     rounded-full px-2.5 py-0.5 text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Detection method badge */}
              <p className="text-xs text-gray-600 text-center">{result.method}</p>
            </div>
          )}

          {/* STEP: Try-on panel */}
          {step === 'tryon' && (
            <div className="glass rounded-2xl p-5">
              <h2 className="font-bold text-lg text-white mb-4">👗 Virtual Try-On</h2>
              <DressTryOn
                onTryOn={handleTryOn}
                onClear={handleClear}
                hasMeasure={!!result}
                size={result?.size ?? 'M'}
                measurements={result ? {
                  bust_cm:  result.bust_cm,
                  waist_cm: result.waist_cm,
                  hip_cm:   result.hip_cm,
                } : null}
              />
            </div>
          )}

          {/* STEP: Recommendations */}
          {step === 'shop' && result && (
            <div className="glass rounded-2xl p-5">
              <RecommendPanel
                category={result.body_type.includes('Petite') ? 'Women' : 'Women'}
                bodyType={result.body_type}
                skinTone={result.skin_tone}
                size={result.size}
                bestColors={result.best_colors}
              />
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: 3D Avatar (always visible after analysis) ── */}
        <div className="flex flex-col gap-4">
          {result ? (
            <>
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-lg text-white">
                    🧍 Your 3D Avatar
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-purple-400">
                    <span>Size</span>
                    <span className="font-bold text-white text-base">{result.size}</span>
                  </div>
                </div>

                <AvatarViewer
                  morphs={result.morph}
                  dressSrc={dressSrc}
                  skinHex={result.skin_hex}
                />
              </div>

              {/* Quick step shortcuts when on avatar tab */}
              {step === 'avatar' && (
                <div className="grid grid-cols-2 gap-3">
                  <button className="step-btn py-3" onClick={() => setStep('tryon')}>
                    👗 Try On a Dress
                  </button>
                  <button className="step-btn py-3" onClick={() => setStep('shop')}>
                    🛍 See Recommendations
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Before analysis — show instructions */
            <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center
                            min-h-[500px] text-center gap-4">
              <div className="text-7xl">🧍</div>
              <h3 className="text-xl font-bold text-white">Your 3D Avatar</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Upload a full-body photo and click Analyse to generate your personalised
                3D avatar with accurate body proportions.
              </p>
              <div className="flex flex-col gap-2 text-left text-xs text-gray-600 mt-2
                              bg-[#0d0d22] rounded-xl p-4 w-full max-w-xs">
                <p className="font-semibold text-gray-400 mb-1">What you'll get:</p>
                <p>✅ Accurate body measurements</p>
                <p>✅ 3D rotatable avatar</p>
                <p>✅ Virtual dress try-on</p>
                <p>✅ Personalised colour palette</p>
                <p>✅ Style & size recommendations</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e1848] mt-8 px-6 py-4 text-center
                         text-xs text-gray-700">
        3D Fashion Stylist · Powered by Hugging Face AI · Built with Next.js & Three.js
      </footer>
    </main>
  )
}
