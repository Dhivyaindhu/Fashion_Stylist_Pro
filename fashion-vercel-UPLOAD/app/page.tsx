'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import UploadPanel    from './components/UploadPanel'
import DressTryOn     from './components/DressTryOn'
import RecommendPanel from './components/RecommendPanel'
import type { MorphData } from './components/AvatarViewer'

const AvatarViewer = dynamic(() => import('./components/AvatarViewer'), { ssr: false })

interface AnalysisResult {
  size:         string
  body_type:    string
  skin_tone:    string
  skin_hex:     string
  method:       string
  height_cm:    number
  shoulder_cm:  number
  bust_cm:      number
  waist_cm:     number
  hip_cm:       number
  inseam_cm:    number
  morph:        MorphData
  best_colors:  string[]
  avoid_colors: string[]
  style_tips:   string[]
  body_icon:    string
  body_desc:    string
  vis_jpeg_b64: string
}

type Step = 'analyse' | 'avatar' | 'tryon' | 'shop'

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
  const [dressB64,setDressB64]= useState<string | null>(null)
  const [visImg,  setVisImg]  = useState<string | null>(null)

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
      if (data.vis_jpeg_b64) setVisImg(`data:image/jpeg;base64,${data.vis_jpeg_b64}`)
      setStep('avatar')
    } catch(e: any) { setError(e.message) }
    setLoading(false)
  }

  const handleTryOn = (src: string, b64: string) => { setDress(src); setDressB64(b64) }
  const handleClear = () => { setDress(null); setDressB64(null) }

  return (
    <main style={{ minHeight:'100vh', background:'#06061a', color:'#e8e0ff', fontFamily:'system-ui,sans-serif', padding:'0 0 40px' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1a0938 0%,#0d0628 100%)', padding:'28px 24px 20px', borderBottom:'1px solid #1e1848' }}>
        <h1 style={{ margin:0, fontSize:'1.7rem', fontWeight:800, color:'#e8c99a', letterSpacing:'-0.01em' }}>
          👗 3D Fashion Stylist Pro
        </h1>
        <p style={{ margin:'4px 0 0', color:'#7060a0', fontSize:'0.85rem' }}>
          AI body analysis · SVG 3D avatar · Virtual try-on · Smart recommendations
        </p>
      </div>

      {/* Step tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid #1e1848', background:'#09091f', padding:'0 16px' }}>
        {STEPS.map((s,i) => (
          <button key={s.id}
            onClick={() => s.id!=='analyse' && result ? setStep(s.id) : s.id==='analyse' && setStep(s.id)}
            style={{
              padding:'12px 18px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.82rem',
              background:'transparent', letterSpacing:'0.04em',
              color: step===s.id ? '#e8c99a' : (result||s.id==='analyse') ? '#6050a0' : '#2d2860',
              borderBottom: step===s.id ? '2px solid #e8c99a' : '2px solid transparent',
              transition:'all 0.2s'
            }}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 16px' }}>

        {/* STEP 1 — Analysis */}
        {step==='analyse' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:24 }}>
            <div>
              <UploadPanel onAnalyze={handleAnalyze} loading={loading} />
              {error && (
                <div style={{ marginTop:12, padding:'10px 14px', background:'#2a0a0a', border:'1px solid #880000', borderRadius:10, color:'#ff8080', fontSize:13 }}>
                  ❌ {error}
                </div>
              )}
            </div>
            {visImg && (
              <div>
                <div style={{ color:'#a090d0', fontWeight:700, marginBottom:8, fontSize:13 }}>📐 Pose Detection</div>
                <img src={visImg} alt="Pose" style={{ width:'100%', borderRadius:12, border:'1px solid #2a2860' }}/>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Avatar */}
        {step==='avatar' && result && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
            <AvatarViewer
              morphs={result.morph}
              dressSrc={dressSrc}
              dressB64={dressB64}
              skinHex={result.skin_hex}
              skinTone={result.skin_tone}
              bodyType={result.body_type}
            />
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Measurement card */}
              <div style={{ background:'#10103a', border:'1px solid #2a2860', borderRadius:14, padding:18 }}>
                <div style={{ color:'#e8c99a', fontWeight:800, fontSize:15, marginBottom:12 }}>
                  {result.body_icon} {result.body_type}
                </div>
                <div style={{ color:'#7060a0', fontSize:12, marginBottom:14 }}>{result.body_desc}</div>
                {[
                  ['Height',   result.height_cm],
                  ['Shoulder', result.shoulder_cm],
                  ['Bust',     result.bust_cm],
                  ['Waist',    result.waist_cm],
                  ['Hip',      result.hip_cm],
                ].map(([k,v]) => (
                  <div key={k as string} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #1a1848', fontSize:13 }}>
                    <span style={{ color:'#8070b0' }}>{k}</span>
                    <span style={{ color:'#e8e0ff', fontWeight:700 }}>{v} cm</span>
                  </div>
                ))}
                <div style={{ marginTop:12, display:'flex', justifyContent:'space-between', fontSize:13 }}>
                  <span style={{ color:'#8070b0' }}>Recommended Size</span>
                  <span style={{ background:'#2a1f60', color:'#e8c99a', fontWeight:800, padding:'2px 12px', borderRadius:8 }}>{result.size}</span>
                </div>
              </div>
              {/* Colors */}
              <div style={{ background:'#10103a', border:'1px solid #2a2860', borderRadius:14, padding:18 }}>
                <div style={{ color:'#e8c99a', fontWeight:700, fontSize:13, marginBottom:10 }}>🎨 Best Colors — {result.skin_tone} Skin</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {result.best_colors.map(c => (
                    <span key={c} style={{ background:'#1e1848', color:'#c0b0f0', border:'1px solid #2e2868', borderRadius:8, padding:'3px 10px', fontSize:11 }}>{c}</span>
                  ))}
                </div>
                <div style={{ color:'#e8c99a', fontWeight:700, fontSize:13, margin:'12px 0 8px' }}>💡 Style Tips</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {result.style_tips.map(t => (
                    <span key={t} style={{ background:'#1e2848', color:'#90b0f0', border:'1px solid #2e3868', borderRadius:8, padding:'3px 10px', fontSize:11 }}>{t}</span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setStep('tryon')}
                style={{ background:'linear-gradient(135deg,#6040c0,#9060e0)', color:'#fff', border:'none', padding:'12px 20px', borderRadius:12, cursor:'pointer', fontWeight:800, fontSize:14 }}>
                👗 Try On Outfits →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Try-On */}
        {step==='tryon' && result && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
            <DressTryOn
              onTryOn={handleTryOn}
              onClear={handleClear}
              measurements={{ bust:result.bust_cm, waist:result.waist_cm, hip:result.hip_cm }}
              size={result.size}
            />
            <AvatarViewer
              morphs={result.morph}
              dressSrc={dressSrc}
              dressB64={dressB64}
              skinHex={result.skin_hex}
              skinTone={result.skin_tone}
              bodyType={result.body_type}
            />
          </div>
        )}

        {/* STEP 4 — Shop */}
        {step==='shop' && result && (
          <RecommendPanel
            category="Women"
            skinTone={result.skin_tone}
            bodyType={result.body_type}
            size={result.size}
            bestColors={result.best_colors}
          />
        )}

        {!result && step!=='analyse' && (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#4040a0' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>📸</div>
            <div style={{ fontSize:16 }}>Complete Step 1 (Body Analysis) first</div>
            <button onClick={()=>setStep('analyse')} style={{ marginTop:16, background:'#2a1f60', color:'#c8b8ff', border:'1px solid #4a3898', padding:'10px 24px', borderRadius:10, cursor:'pointer', fontWeight:700 }}>
              Go to Analysis →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
