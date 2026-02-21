'use client'

import { useRef, useState, DragEvent, ChangeEvent } from 'react'

interface UploadPanelProps {
  onAnalyze: (file: File, category: string) => void
  loading:   boolean
}

export default function UploadPanel({ onAnalyze, loading }: UploadPanelProps) {
  const inputRef           = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [category, setCat]    = useState('Women')
  const [dragging, setDrag]   = useState(false)
  const [file, setFile]       = useState<File | null>(null)

  const handleFile = (f: File) => {
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) handleFile(f)
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const submit = () => {
    if (file && !loading) onAnalyze(file, category)
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Drop zone */}
      <div
        className={`upload-zone flex flex-col items-center justify-center p-6 min-h-[220px] cursor-pointer
                    ${dragging ? 'border-purple-500 bg-purple-900/10' : ''}`}
        onDragOver={(e)=>{ e.preventDefault(); setDrag(true) }}
        onDragLeave={()=>setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="preview"
               className="max-h-48 rounded-xl object-contain" />
        ) : (
          <>
            <div className="text-5xl mb-3">📷</div>
            <p className="text-purple-400 font-semibold">Drop full-body photo here</p>
            <p className="text-xs text-gray-600 mt-1">or click to browse · JPG / PNG</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*"
               className="hidden" onChange={onChange} />
      </div>

      {/* Category selector */}
      <div>
        <p className="text-xs text-gray-500 mb-2 font-semibold tracking-widest uppercase">Category</p>
        <div className="flex gap-2">
          {['Women','Men','Kids'].map(c => (
            <button key={c}
              className={`step-btn flex-1 ${category===c?'active':''}`}
              onClick={() => setCat(c)}>
              {c==='Women'?'👗':c==='Men'?'👔':'🧒'} {c}
            </button>
          ))}
        </div>
      </div>

      {/* Analyse button */}
      <button
        onClick={submit}
        disabled={!file || loading}
        className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-200
                   disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg,#6030c0,#9060e0)',
                 color:'#fff', boxShadow:'0 0 24px rgba(120,60,220,0.35)' }}
      >
        {loading
          ? <span className="flex items-center justify-center gap-2">
              <span className="spinner inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"/>
              Analysing…
            </span>
          : '🔬 Analyse My Body'}
      </button>

      {/* Tips */}
      <div className="text-xs text-gray-600 space-y-1">
        <p>💡 <b className="text-gray-500">Best results:</b></p>
        <p>• Stand straight, arms slightly away from body</p>
        <p>• Full body visible from head to feet</p>
        <p>• Plain background preferred</p>
      </div>
    </div>
  )
}
