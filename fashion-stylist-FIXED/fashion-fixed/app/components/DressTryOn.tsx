'use client'

import { useState, useRef } from 'react'

interface Props {
  onTryOn: (src: string, b64: string) => void
  onClear:  () => void
  measurements: { bust: number; waist: number; hip: number }
  size: string
}

const SIZE_BUST: Record<string,number> = {
  XS:80,S:84,M:88,L:92,XL:96,XXL:100,XXXL:106,
  'Free Size':88,'2-4Y':52,'4-6Y':56,'6-8Y':60,'8-10Y':64,'10-12Y':68
}

function badge(diff: number, zone: string) {
  let icon='✅',lbl='Perfect Fit',col='#22c55e'
  if(diff>=6){icon='⬆';lbl='Slightly Loose';col='#eab308'}
  else if(diff>=-4&&diff<0){icon='⚠';lbl='Snug Fit';col='#f97316'}
  else if(diff<-4){icon='❌';lbl='Too Tight';col='#ef4444'}
  return (
    <div key={zone} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#0d0d22',borderLeft:`4px solid ${col}`,borderRadius:6,marginBottom:6 }}>
      <span style={{ fontSize:18 }}>{icon}</span>
      <div>
        <div style={{ color:col,fontWeight:700,fontSize:13 }}>{zone}</div>
        <div style={{ color:'#888',fontSize:11 }}>{lbl} ({diff>=0?'+':''}{diff.toFixed(1)}cm ease)</div>
      </div>
    </div>
  )
}

export default function DressTryOn({ onTryOn, onClear, measurements, size }: Props) {
  const [preview, setPreview] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [status,  setStatus]  = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const std_bust  = SIZE_BUST[size] ?? 88
  const std_waist = std_bust - 12
  const std_hip   = std_bust + 8

  const handleFile = async (file: File) => {
    const url = URL.createObjectURL(file)
    setPreview(url)
    setLoading(true); setStatus('Extracting garment...')
    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch('/api/extract-dress', { method:'POST', body: form })
      const data = await res.json()
      if(data.error){ setStatus('❌ '+data.error); setLoading(false); return }
      const src = `data:image/png;base64,${data.dress_b64}`
      setPreview(src)
      onTryOn(src, data.dress_b64)
      setStatus('✅ Outfit fitted!')
    } catch(e:any){ setStatus('❌ '+e.message) }
    setLoading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if(f) handleFile(f)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ color:'#e8c99a', fontWeight:800, fontSize:15 }}>👗 Virtual Try-On</div>
      <div style={{ color:'#7060a0', fontSize:12 }}>Upload a product image. White-background photos work best.</div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e=>e.preventDefault()}
        onClick={()=>fileRef.current?.click()}
        style={{ border:'2px dashed #2a2860', borderRadius:14, padding:24, cursor:'pointer',
                 background:'#0d0d2a', textAlign:'center', minHeight:120,
                 display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
        {preview
          ? <img src={preview} alt="Dress" style={{ maxHeight:180, borderRadius:10, objectFit:'contain' }}/>
          : <>
              <div style={{ fontSize:36 }}>👗</div>
              <div style={{ color:'#5050a0', fontSize:13 }}>Drop outfit image or click to browse</div>
            </>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
             onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>

      {status && <div style={{ color: status.startsWith('✅')?'#22c55e':'#f97316', fontSize:13, fontWeight:600 }}>{status}</div>}
      {loading && <div style={{ color:'#6050a0', fontSize:12 }}>⏳ Processing...</div>}

      {preview && (
        <button onClick={()=>{ setPreview(null); setStatus(''); onClear(); }}
          style={{ background:'#1a0a20', color:'#c060a0', border:'1px solid #401030', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
          🗑️ Remove Outfit
        </button>
      )}

      {/* Fit Analysis */}
      <div style={{ background:'#0d0d22', border:'1px solid #1e1848', borderRadius:12, padding:14 }}>
        <div style={{ color:'#e8c99a', fontWeight:700, fontSize:13, marginBottom:10 }}>📐 Fit Analysis — Size {size}</div>
        {badge(std_bust  - measurements.bust,  'Bust/Chest')}
        {badge(std_waist - measurements.waist, 'Waist')}
        {badge(std_hip   - measurements.hip,   'Hip')}
        <div style={{ marginTop:10, padding:10, background:'#07071a', borderRadius:8, textAlign:'center', color:'#c8b8ff', fontWeight:700, fontSize:13 }}>
          {std_bust-measurements.bust>=-4&&std_waist-measurements.waist>=-4&&std_hip-measurements.hip>=-4 ? '✅ Great Match' : '⚠ Check Measurements'}
        </div>
      </div>
    </div>
  )
}
