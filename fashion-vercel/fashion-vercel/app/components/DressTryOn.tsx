'use client'

import { useRef, useState, ChangeEvent } from 'react'

interface FitZone { zone: string; diff: number }

interface DressTryOnProps {
  onTryOn:    (dressSrc: string) => void
  onClear:    () => void
  hasMeasure: boolean
  size:       string
  measurements: { bust_cm: number; waist_cm: number; hip_cm: number } | null
}

/* Standard size → bust cm table */
const SIZE_BUST: Record<string, number> = {
  XS:80, S:84, M:88, L:92, XL:96, XXL:100, XXXL:106,
  '2-4Y':52,'4-6Y':56,'6-8Y':60,'8-10Y':64,'10-12Y':68
}

function fitBadge(diff: number, zone: string) {
  let cls='', icon='', label=''
  if      (diff >= 0 && diff < 6) { cls='fit-perfect'; icon='✅'; label='Perfect Fit' }
  else if (diff >= 6)             { cls='fit-loose';   icon='⬆';  label='Slightly Loose' }
  else if (diff >= -4)            { cls='fit-snug';    icon='⚠';  label='Snug Fit' }
  else                            { cls='fit-tight';   icon='❌'; label='Too Tight' }

  return (
    <div key={zone}
         className={`flex items-center gap-3 p-3 rounded-lg mb-2 bg-[#111128] ${cls}`}>
      <span className="text-xl">{icon}</span>
      <div>
        <div className="font-bold text-sm" style={{
          color: cls==='fit-perfect'?'#22c55e':cls==='fit-loose'?'#eab308':
                 cls==='fit-snug'?'#f97316':'#ef4444'
        }}>{zone}</div>
        <div className="text-xs text-gray-500">
          {label} ({diff>=0?'+':''}{diff.toFixed(1)}cm ease)
        </div>
      </div>
    </div>
  )
}

export default function DressTryOn({ onTryOn, onClear, hasMeasure, size, measurements }: DressTryOnProps) {
  const inputRef              = useRef<HTMLInputElement>(null)
  const [loading, setLoad]    = useState(false)
  const [extracted, setExt]   = useState<string | null>(null)
  const [status, setStatus]   = useState('')
  const [hasDress, setHasDress] = useState(false)

  const fitZones: FitZone[] = measurements ? (() => {
    const std  = SIZE_BUST[size] ?? 88
    return [
      { zone:'Bust/Chest', diff: std        - measurements.bust_cm  },
      { zone:'Waist',      diff: (std - 12) - measurements.waist_cm },
      { zone:'Hip',        diff: (std + 8)  - measurements.hip_cm   },
    ]
  })() : []

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoad(true); setStatus('Extracting garment…')

    const form = new FormData()
    form.append('file', file)

    try {
      const res  = await fetch('/api/extract-dress', { method:'POST', body: form })
      const data = await res.json()
      if (data.error) { setStatus('❌ ' + data.error); setLoad(false); return }

      const src = `data:image/png;base64,${data.dress_b64}`
      setExt(src)
      setHasDress(true)
      onTryOn(src)
      setStatus('✅ Outfit fitted!')
    } catch(err:any) {
      setStatus('❌ ' + err.message)
    }
    setLoad(false)
  }

  const clear = () => {
    setExt(null); setHasDress(false); setStatus(''); onClear()
  }

  return (
    <div className="flex flex-col gap-4">

      {!hasMeasure && (
        <div className="text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-800
                        rounded-xl p-3 text-center">
          ⚠ Complete Step 1 — Body Analysis first
        </div>
      )}

      {/* Upload area */}
      <div
        className="upload-zone flex flex-col items-center justify-center p-5 min-h-[160px] cursor-pointer"
        onClick={() => hasMeasure && inputRef.current?.click()}
        style={{ opacity: hasMeasure ? 1 : 0.5 }}
      >
        <div className="text-4xl mb-2">👗</div>
        <p className="text-purple-400 font-semibold text-sm">Upload Dress / Outfit</p>
        <p className="text-xs text-gray-600 mt-1">White background gives best results</p>
        <input ref={inputRef} type="file" accept="image/*"
               className="hidden" onChange={handleFile} />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-purple-400 text-sm justify-center">
          <span className="spinner inline-block w-4 h-4 border-2 border-purple-400
                           border-t-transparent rounded-full"/>
          {status}
        </div>
      )}

      {!loading && status && (
        <p className="text-sm text-center text-purple-400">{status}</p>
      )}

      {/* Extracted garment preview */}
      {extracted && (
        <div className="glass rounded-xl p-3 flex flex-col items-center gap-2">
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase">
            Extracted Garment
          </p>
          <img src={extracted} alt="extracted dress"
               className="max-h-40 rounded-lg object-contain bg-white/5 p-2" />
          <button onClick={clear}
                  className="step-btn text-xs py-1.5 px-4">
            🗑 Remove Outfit
          </button>
        </div>
      )}

      {/* Fit Analysis */}
      {hasDress && measurements && fitZones.length > 0 && (
        <div className="glass rounded-xl p-4">
          <h3 className="text-yellow-300 font-bold mb-3 text-sm">
            📐 Fit Analysis — Size {size}
          </h3>
          {fitZones.map(z => fitBadge(z.diff, z.zone))}
          <div className="mt-3 p-3 rounded-lg text-center font-bold text-sm"
               style={{ background:'#0d0d22', color:'#c8b8ff' }}>
            {fitZones.every(z=>z.diff>=-4)
              ? '✅ Great overall match!'
              : '⚠ Consider sizing up for comfort'}
          </div>
        </div>
      )}
    </div>
  )
}
