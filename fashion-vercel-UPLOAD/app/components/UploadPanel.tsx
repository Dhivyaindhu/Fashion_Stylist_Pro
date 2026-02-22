'use client'

import { useRef, useState } from 'react'

interface Props {
  onAnalyze: (file: File, category: string) => void
  loading:   boolean
}

export default function UploadPanel({ onAnalyze, loading }: Props) {
  const [preview,  setPreview]  = useState<string|null>(null)
  const [file,     setFile]     = useState<File|null>(null)
  const [category, setCategory] = useState('Women')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if(f) handleFile(f)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ color:'#e8c99a', fontWeight:800, fontSize:15 }}>📸 Step 1 — Body Analysis</div>
      <div style={{ color:'#7060a0', fontSize:12 }}>
        Upload a full-body photo for AI body analysis, size calculation, and avatar generation.
      </div>

      {/* Category selector */}
      <div style={{ display:'flex', gap:8 }}>
        {['Women','Men','Kids'].map(c => (
          <button key={c} onClick={()=>setCategory(c)}
            style={{ flex:1, padding:'8px 0', border:`1px solid ${category===c?'#8060e0':'#1e1848'}`,
                     borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:12,
                     background: category===c ? '#2a1f60' : '#0d0d2a',
                     color: category===c ? '#e8c99a' : '#5040a0' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e=>e.preventDefault()}
        onClick={()=>fileRef.current?.click()}
        style={{ border:`2px dashed ${preview?'#4a3898':'#1e1848'}`, borderRadius:14, padding:24,
                 cursor:'pointer', background:'#0d0d2a', textAlign:'center', minHeight:200,
                 display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
        {preview
          ? <img src={preview} alt="Preview" style={{ maxHeight:220, borderRadius:10, objectFit:'contain' }}/>
          : <>
              <div style={{ fontSize:48 }}>📷</div>
              <div style={{ color:'#5050a0', fontSize:13 }}>Drop full-body photo here or click to browse</div>
              <div style={{ color:'#3a3070', fontSize:11 }}>Best: standing upright, arms slightly away from body</div>
            </>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
             onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>

      <button
        disabled={!file||loading}
        onClick={()=>file&&onAnalyze(file,category)}
        style={{ background: file&&!loading ? 'linear-gradient(135deg,#6040c0,#9060e0)' : '#1a1848',
                 color: file&&!loading ? '#fff' : '#3a3070',
                 border:'none', padding:'13px 20px', borderRadius:12,
                 cursor: file&&!loading ? 'pointer' : 'not-allowed',
                 fontWeight:800, fontSize:14, transition:'all 0.2s' }}>
        {loading ? '⏳ Analysing...' : '🔬 Analyse & Build Avatar'}
      </button>

      <div style={{ color:'#3a3070', fontSize:11, lineHeight:1.6 }}>
        💡 <b style={{ color:'#5040a0' }}>Tips for best results:</b><br/>
        • Stand straight facing the camera<br/>
        • Wear form-fitting clothes<br/>
        • Good lighting, plain background
      </div>
    </div>
  )
}
