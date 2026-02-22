'use client'

import { useState, useRef } from 'react'

export default function Home() {
  const [step, setStep] = useState<'upload'|'result'>('upload')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [visImg, setVisImg] = useState<string|null>(null)
  const [preview, setPreview] = useState<string|null>(null)
  const [category, setCategory] = useState('Women')
  const [dressSrc, setDressSrc] = useState<string|null>(null)
  const [dressB64, setDressB64] = useState<string|null>(null)
  const [dressPreview, setDressPreview] = useState<string|null>(null)
  const [dressLoading, setDressLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'avatar'|'tryon'|'shop'>('avatar')
  const fileRef = useRef<HTMLInputElement>(null)
  const dressRef = useRef<HTMLInputElement>(null)

  const analyze = async (file: File) => {
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('category', category)
      const res = await fetch('/api/analyze', { method: 'POST', body: form })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setResult(data)
      if (data.vis_jpeg_b64) setVisImg(`data:image/jpeg;base64,${data.vis_jpeg_b64}`)
      setStep('result')
    } catch(e: any) { setError(e.message) }
    setLoading(false)
  }

  const tryOn = async (file: File) => {
    setDressLoading(true)
    setDressPreview(URL.createObjectURL(file))
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/extract-dress', { method: 'POST', body: form })
      const data = await res.json()
      if (data.error) { setError(data.error); setDressLoading(false); return }
      setDressSrc(`data:image/png;base64,${data.dress_b64}`)
      setDressB64(data.dress_b64)
      setDressPreview(`data:image/png;base64,${data.dress_b64}`)
    } catch(e: any) { setError(e.message) }
    setDressLoading(false)
  }

  const SIZE_BUST: Record<string,number> = { XS:80,S:84,M:88,L:92,XL:96,XXL:100,XXXL:106 }

  const avatarHtml = result ? buildAvatar(result, dressB64) : ''

  return (
    <main style={{ minHeight:'100vh', background:'#06061a', color:'#e8e0ff', fontFamily:'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#1a0938,#0d0628)', padding:'24px', borderBottom:'1px solid #1e1848' }}>
        <h1 style={{ margin:0, fontSize:'1.6rem', fontWeight:800, color:'#e8c99a' }}>👗 3D Fashion Stylist Pro</h1>
        <p style={{ margin:'4px 0 0', color:'#7060a0', fontSize:'0.82rem' }}>AI body analysis · SVG 3D avatar · Virtual try-on · Smart recommendations</p>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>

        {/* UPLOAD STEP */}
        {step === 'upload' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
            <div style={{ background:'#10103a', border:'1px solid #2a2860', borderRadius:16, padding:24 }}>
              <div style={{ color:'#e8c99a', fontWeight:800, fontSize:15, marginBottom:8 }}>📸 Step 1 — Upload Full-Body Photo</div>
              <div style={{ color:'#5050a0', fontSize:12, marginBottom:16 }}>Stand straight facing camera, good lighting</div>
              {/* Category */}
              <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                {['Women','Men','Kids'].map(c=>(
                  <button key={c} onClick={()=>setCategory(c)} style={{ flex:1, padding:'8px 0', border:`1px solid ${category===c?'#8060e0':'#1e1848'}`, borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:12, background:category===c?'#2a1f60':'#0d0d2a', color:category===c?'#e8c99a':'#5040a0' }}>{c}</button>
                ))}
              </div>
              {/* Drop zone */}
              <div onClick={()=>fileRef.current?.click()} style={{ border:'2px dashed #2a2860', borderRadius:12, padding:32, cursor:'pointer', background:'#0d0d2a', textAlign:'center', minHeight:180, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
                {preview ? <img src={preview} alt="preview" style={{ maxHeight:200, borderRadius:8, objectFit:'contain' }}/> : <><div style={{ fontSize:48 }}>📷</div><div style={{ color:'#4040a0', fontSize:13 }}>Click to upload photo</div></>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if(f){ setPreview(URL.createObjectURL(f)); analyze(f) } }}/>
              {loading && <div style={{ marginTop:12, color:'#8060e0', fontSize:13, textAlign:'center' }}>⏳ Analysing body measurements...</div>}
              {error && <div style={{ marginTop:12, padding:'10px 14px', background:'#2a0a0a', border:'1px solid #880000', borderRadius:8, color:'#ff8080', fontSize:12 }}>❌ {error}</div>}
            </div>
            <div style={{ background:'#10103a', border:'1px solid #1e1848', borderRadius:16, padding:24, display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ color:'#e8c99a', fontWeight:700, fontSize:14 }}>✨ How it works</div>
              {[['📸','Upload full-body photo'],['🔬','AI detects body measurements'],['👤','3D SVG avatar is generated'],['👗','Try on outfits virtually'],['🛍️','Get personalised recommendations']].map(([e,t])=>(
                <div key={t as string} style={{ display:'flex', gap:12, alignItems:'center' }}>
                  <span style={{ fontSize:20 }}>{e}</span>
                  <span style={{ color:'#8070b0', fontSize:13 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULT STEP */}
        {step === 'result' && result && (
          <div>
            {/* Tabs */}
            <div style={{ display:'flex', borderBottom:'1px solid #1e1848', marginBottom:24, gap:0 }}>
              {[['avatar','👤 3D Avatar'],['tryon','👗 Try-On'],['shop','🛍️ Shop']].map(([id,lbl])=>(
                <button key={id} onClick={()=>setActiveTab(id as any)} style={{ padding:'10px 20px', border:'none', cursor:'pointer', fontWeight:700, fontSize:13, background:'transparent', color:activeTab===id?'#e8c99a':'#4040a0', borderBottom:activeTab===id?'2px solid #e8c99a':'2px solid transparent' }}>{lbl}</button>
              ))}
              <button onClick={()=>{setStep('upload');setResult(null);setPreview(null);setDressSrc(null);setDressB64(null)}} style={{ marginLeft:'auto', padding:'8px 16px', background:'#1a1848', color:'#6050a0', border:'1px solid #2a2860', borderRadius:8, cursor:'pointer', fontSize:12 }}>📸 New Photo</button>
            </div>

            {/* Avatar Tab */}
            {activeTab==='avatar' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
                <div style={{ background:'#08081a', borderRadius:16, overflow:'hidden' }}>
                  <iframe srcDoc={avatarHtml} style={{ width:'100%', height:520, border:'none' }} title="avatar"/>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {/* Detection image */}
                  {visImg && <img src={visImg} alt="detection" style={{ width:'100%', borderRadius:12, border:'1px solid #2a2860' }}/>}
                  {/* Measurements */}
                  <div style={{ background:'#10103a', border:'1px solid #2a2860', borderRadius:14, padding:18 }}>
                    <div style={{ color:'#e8c99a', fontWeight:800, marginBottom:10 }}>{result.body_icon} {result.body_type} — Size <span style={{ background:'#2a1f60', padding:'2px 10px', borderRadius:6 }}>{result.size}</span></div>
                    <div style={{ color:'#6050a0', fontSize:12, marginBottom:12 }}>{result.body_desc}</div>
                    {[['Shoulder',result.shoulder_cm],['Bust',result.bust_cm],['Waist',result.waist_cm],['Hip',result.hip_cm],['Height',result.height_cm]].map(([k,v])=>(
                      <div key={k as string} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #1a1848', fontSize:13 }}>
                        <span style={{ color:'#6050a0' }}>{k}</span>
                        <span style={{ color:'#e8e0ff', fontWeight:700 }}>{v} cm</span>
                      </div>
                    ))}
                  </div>
                  {/* Colors */}
                  <div style={{ background:'#10103a', border:'1px solid #2a2860', borderRadius:14, padding:18 }}>
                    <div style={{ color:'#e8c99a', fontWeight:700, fontSize:13, marginBottom:8 }}>🎨 Best Colors — {result.skin_tone}</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {result.best_colors.map((c:string)=><span key={c} style={{ background:'#1e1848', color:'#c0b0f0', border:'1px solid #2e2868', borderRadius:8, padding:'3px 10px', fontSize:11 }}>{c}</span>)}
                    </div>
                    <div style={{ color:'#e8c99a', fontWeight:700, fontSize:13, margin:'10px 0 6px' }}>💡 Style Tips</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {result.style_tips.map((t:string)=><span key={t} style={{ background:'#1e2848', color:'#90b0f0', border:'1px solid #2e3868', borderRadius:8, padding:'3px 10px', fontSize:11 }}>{t}</span>)}
                    </div>
                  </div>
                  <button onClick={()=>setActiveTab('tryon')} style={{ background:'linear-gradient(135deg,#6040c0,#9060e0)', color:'#fff', border:'none', padding:'12px', borderRadius:12, cursor:'pointer', fontWeight:800, fontSize:14 }}>👗 Try On Outfits →</button>
                </div>
              </div>
            )}

            {/* Try-On Tab */}
            {activeTab==='tryon' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:24 }}>
                <div style={{ background:'#10103a', border:'1px solid #2a2860', borderRadius:16, padding:20 }}>
                  <div style={{ color:'#e8c99a', fontWeight:800, marginBottom:8 }}>👗 Upload Outfit</div>
                  <div style={{ color:'#5050a0', fontSize:12, marginBottom:14 }}>White-background product photos work best</div>
                  <div onClick={()=>dressRef.current?.click()} style={{ border:'2px dashed #2a2860', borderRadius:12, padding:24, cursor:'pointer', background:'#0d0d2a', textAlign:'center', minHeight:160, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
                    {dressPreview ? <img src={dressPreview} alt="dress" style={{ maxHeight:160, borderRadius:8, objectFit:'contain' }}/> : <><div style={{ fontSize:36 }}>👗</div><div style={{ color:'#4040a0', fontSize:13 }}>Click to upload outfit image</div></>}
                  </div>
                  <input ref={dressRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if(f) tryOn(f) }}/>
                  {dressLoading && <div style={{ marginTop:10, color:'#8060e0', fontSize:13 }}>⏳ Extracting garment...</div>}
                  {dressSrc && <button onClick={()=>{setDressSrc(null);setDressB64(null);setDressPreview(null)}} style={{ marginTop:10, width:'100%', background:'#1a0a20', color:'#c060a0', border:'1px solid #401030', padding:'8px', borderRadius:8, cursor:'pointer', fontSize:12 }}>🗑️ Remove Outfit</button>}
                  {/* Fit Analysis */}
                  {result && (
                    <div style={{ marginTop:14, background:'#0d0d22', border:'1px solid #1e1848', borderRadius:12, padding:14 }}>
                      <div style={{ color:'#e8c99a', fontWeight:700, fontSize:13, marginBottom:8 }}>📐 Fit Analysis — Size {result.size}</div>
                      {[['Bust/Chest', (SIZE_BUST[result.size]??88) - result.bust_cm],
                        ['Waist', (SIZE_BUST[result.size]??88)-12 - result.waist_cm],
                        ['Hip',   (SIZE_BUST[result.size]??88)+8  - result.hip_cm]
                      ].map(([zone, diff])=> {
                        const d = diff as number
                        const [icon,lbl,col] = d>=0&&d<6?['✅','Perfect Fit','#22c55e']:d>=6?['⬆','Slightly Loose','#eab308']:d>=-4?['⚠','Snug Fit','#f97316']:['❌','Too Tight','#ef4444']
                        return <div key={zone as string} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'#07071a', borderLeft:`4px solid ${col}`, borderRadius:6, marginBottom:5, fontSize:12 }}>
                          <span>{icon}</span><div><div style={{ color:col, fontWeight:700 }}>{zone as string}</div><div style={{ color:'#666', fontSize:11 }}>{lbl} ({d>=0?'+':''}{d.toFixed(1)}cm)</div></div>
                        </div>
                      })}
                    </div>
                  )}
                </div>
                <div style={{ background:'#08081a', borderRadius:16, overflow:'hidden' }}>
                  <iframe srcDoc={buildAvatar(result, dressB64)} style={{ width:'100%', height:520, border:'none' }} title="avatar-tryon"/>
                </div>
              </div>
            )}

            {/* Shop Tab */}
            {activeTab==='shop' && (
              <ShopPanel bodyType={result.body_type} skinTone={result.skin_tone} size={result.size} bestColors={result.best_colors} category={category}/>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

// ── Shop Panel ───────────────────────────────────────────────
const COLOR_HEX: Record<string,string> = { "Pastel Pink":"#FFD1DC","Lavender":"#E6D0FF","Mint Green":"#AAFFDD","Sky Blue":"#87CEEB","Blush Rose":"#FFB6C1","Butter Yellow":"#FFFACD","Soft Peach":"#FFDAB9","Warm Coral":"#FF7F50","Dusty Mauve":"#C09090","Champagne":"#F7E7CE","Terracotta":"#E07050","Royal Blue":"#4169E1","Emerald":"#50C878","Mustard":"#FFDB58","Teal":"#008080","Burnt Orange":"#CC5500","Cobalt":"#0047AB","Deep Burgundy":"#800020","Fuchsia":"#FF00FF","Crimson":"#DC143C","Navy":"#001F5B","Jade":"#00A86B","Pure White":"#FFFFFF","Bright Gold":"#FFD700","Hot Pink":"#FF69B4","Coral":"#FF6B6B","Blush":"#DE5D83","Peach":"#FFCBA4" }
const PRODUCTS: Record<string,any[]> = {
  Women:[
    {name:"Floral Wrap Dress",body:["Hourglass","Full Hourglass","Rectangle"],colors:["Pastel Pink","Lavender","Blush Rose"],sizes:["XS","S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+floral+wrap+dress",flipkart:"https://www.flipkart.com/search?q=women+floral+wrap+dress"},
    {name:"A-Line Ethnic Kurta",body:["Pear","Rectangle","Petite","Apple"],colors:["Royal Blue","Mint Green","Butter Yellow"],sizes:["XS","S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+a-line+ethnic+kurta",flipkart:"https://www.flipkart.com/search?q=women+a+line+kurta"},
    {name:"Bodycon Party Dress",body:["Hourglass","Full Hourglass"],colors:["Cobalt","Crimson","Pure White"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+bodycon+party+dress",flipkart:"https://www.flipkart.com/search?q=women+bodycon+dress"},
    {name:"Empire Waist Maxi",body:["Apple","Pear","Petite"],colors:["Lavender","Soft Peach","Mint Green"],sizes:["XS","S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+empire+waist+maxi",flipkart:"https://www.flipkart.com/search?q=women+empire+waist+maxi"},
    {name:"Anarkali Suit",body:["Apple","Pear","Full Hourglass","Rectangle"],colors:["Deep Burgundy","Cobalt","Jade"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+anarkali+suit",flipkart:"https://www.flipkart.com/search?q=women+anarkali"},
    {name:"Printed Saree",body:["Pear","Hourglass","Apple","Rectangle"],colors:["Royal Blue","Crimson","Mustard","Teal"],sizes:["Free Size"],amazon:"https://www.amazon.in/s?k=women+printed+saree",flipkart:"https://www.flipkart.com/search?q=women+printed+saree"},
    {name:"Fit & Flare Dress",body:["Hourglass","Pear","Rectangle"],colors:["Blush Rose","Sky Blue","Mint Green"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+fit+flare+dress",flipkart:"https://www.flipkart.com/search?q=women+fit+flare"},
  ],
  Men:[
    {name:"Slim Fit Formal Shirt",body:["Trapezoid","Column","Rectangle"],colors:["Royal Blue","Pure White","Cobalt"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=men+slim+fit+formal+shirt",flipkart:"https://www.flipkart.com/search?q=men+slim+formal+shirt"},
    {name:"Structured Blazer",body:["Triangle","Circle","Column","Rectangle"],colors:["Navy","Deep Burgundy","Teal"],sizes:["S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=men+structured+blazer",flipkart:"https://www.flipkart.com/search?q=men+blazer"},
    {name:"Polo T-Shirt",body:["Trapezoid","Column","Rectangle","Triangle"],colors:["Navy","Cobalt","Emerald","Crimson"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=men+polo+tshirt",flipkart:"https://www.flipkart.com/search?q=men+polo+tshirt"},
  ],
  Kids:[
    {name:"Cotton Frock",body:["Petite"],colors:["Pastel Pink","Mint Green","Butter Yellow"],sizes:["2-4Y","4-6Y","6-8Y","8-10Y"],amazon:"https://www.amazon.in/s?k=kids+cotton+frock",flipkart:"https://www.flipkart.com/search?q=kids+frock"},
    {name:"Party Dress",body:["Petite"],colors:["Fuchsia","Lavender","Bright Gold"],sizes:["2-4Y","4-6Y","6-8Y","8-10Y","10-12Y"],amazon:"https://www.amazon.in/s?k=kids+party+dress",flipkart:"https://www.flipkart.com/search?q=kids+party+dress"},
  ],
}

function ShopPanel({ bodyType, skinTone, size, bestColors, category }: any) {
  const all = PRODUCTS[category] ?? PRODUCTS.Women
  const best = new Set(bestColors)
  let matched = all.filter((p:any)=>p.body.includes(bodyType)&&p.sizes.includes(size)&&p.colors.some((c:string)=>best.has(c)))
  if(!matched.length) matched = all.filter((p:any)=>p.body.includes(bodyType))
  if(!matched.length) matched = all
  return (
    <div>
      <div style={{ color:'#e8c99a', fontWeight:800, fontSize:15, marginBottom:16 }}>🛍️ {matched.length} Recommendations — {bodyType} · {skinTone} · Size {size}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {matched.map((p:any)=>{
          const mc = p.colors.filter((c:string)=>best.has(c)).length ? p.colors.filter((c:string)=>best.has(c)) : p.colors.slice(0,2)
          return (
            <div key={p.name} style={{ background:'#10103a', border:'1px solid #1e1848', borderRadius:14, padding:18 }}>
              <div style={{ color:'#e8c99a', fontWeight:700, fontSize:14, marginBottom:8 }}>{p.name}</div>
              <div style={{ display:'flex', gap:5, marginBottom:8, flexWrap:'wrap' }}>
                {mc.map((c:string)=><span key={c} style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#1e1848', color:'#a090d0', border:'1px solid #2e2868', borderRadius:8, padding:'2px 8px', fontSize:11 }}><span style={{ width:10, height:10, borderRadius:'50%', background:COLOR_HEX[c]??'#888', display:'inline-block' }}/>{c}</span>)}
              </div>
              <div style={{ color:'#3a3070', fontSize:11, marginBottom:12 }}>Sizes: {p.sizes.join(' · ')}</div>
              <div style={{ display:'flex', gap:8 }}>
                <a href={p.amazon} target="_blank" rel="noreferrer" style={{ background:'#ff9900', color:'#000', padding:'6px 14px', borderRadius:7, fontWeight:700, fontSize:12, textDecoration:'none' }}>🛒 Amazon</a>
                <a href={p.flipkart} target="_blank" rel="noreferrer" style={{ background:'#2874f0', color:'#fff', padding:'6px 14px', borderRadius:7, fontWeight:700, fontSize:12, textDecoration:'none' }}>🛒 Flipkart</a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── SVG Avatar builder ───────────────────────────────────────
function lighten(hex: string, f: number) {
  const h = hex.replace('#','')
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16)
  return '#'+[r,g,b].map(c=>Math.max(0,Math.min(255,Math.round(c*f))).toString(16).padStart(2,'0')).join('')
}

function buildAvatar(result: any, dressB64: string|null): string {
  const skin = result.skin_hex ?? '#c8956c'
  const skinTone = result.skin_tone ?? 'Medium'
  const bodyType = result.body_type ?? 'Rectangle'
  const CX=200,W=400,H=560
  const SC=5.2  // bigger body
  const hw=(c:number)=>Math.max(10,Math.round((c/(2*Math.PI))*SC))
  const bu_w=hw(result.bust_cm??88), wa_w=hw(result.waist_cm??72), hi_w=hw(result.hip_cm??90)
  const sh_w=Math.max(hw((result.shoulder_cm??40)*1.08),52)
  const arm_w=Math.max(14,Math.round(sh_w*0.30)), nw=Math.max(14,Math.round(sh_w*0.28))
  const y_sh=220,y_bu=y_sh+72,y_wa=y_bu+62,y_hi=y_wa+44,y_bot=y_hi+80,y_nek=y_sh-20,y_hcy=y_nek-80
  const skin_sh=lighten(skin,0.72), skin_hi=lighten(skin,1.28), skin_mid=lighten(skin,0.88)
  const SKINS: Record<string,{ds:string,h:string}> = { Fair:{ds:'f8d5c2',h:'b8860b'},Light:{ds:'e8b89a',h:'4a3728'},Medium:{ds:'c68642',h:'2d1b0e'},Tan:{ds:'a0522d',h:'1a0f0a'},Deep:{ds:'4a2912',h:'0a0505'} }
  const pal = SKINS[skinTone]??SKINS.Medium
  const db_url=`https://api.dicebear.com/9.x/lorelei/svg?seed=${skinTone+bodyType}&skinColor=${pal.ds}&hairColor=${pal.h}&backgroundColor=transparent&scale=110`
  const bd=(sw:number,bw:number,ww:number,hw_:number,sh=0)=>`M ${CX-sw+sh},${y_sh} C ${CX-sw-8+sh},${y_sh+20} ${CX-bw-6+sh},${y_bu-18} ${CX-bw+sh},${y_bu} C ${CX-bw+5+sh},${y_bu+24} ${CX-ww-4+sh},${y_wa-16} ${CX-ww+sh},${y_wa} C ${CX-ww-6+sh},${y_wa+18} ${CX-hw_+4+sh},${y_hi-14} ${CX-hw_+sh},${y_hi} C ${CX-hw_+sh},${y_hi+28} ${CX-hw_+8+sh},${y_bot-10} ${CX-hw_+12+sh},${y_bot} L ${CX+hw_-12+sh},${y_bot} C ${CX+hw_-8+sh},${y_bot-10} ${CX+hw_+sh},${y_hi+28} ${CX+hw_+sh},${y_hi} C ${CX+hw_-4+sh},${y_hi-14} ${CX+ww+6+sh},${y_wa+18} ${CX+ww+sh},${y_wa} C ${CX+ww+4+sh},${y_wa-16} ${CX+bw-5+sh},${y_bu+24} ${CX+bw+sh},${y_bu} C ${CX+bw+6+sh},${y_bu-18} ${CX+sw+8+sh},${y_sh+20} ${CX+sw+sh},${y_sh} Z`
  const ad=(s:number,sw:number,sh=0)=>{const ax=CX+s*sw+sh,ay=y_sh+8,ex=CX+s*(sw+32)+sh,ey=y_sh+110,hx=CX+s*(sw+14)+sh,hy=y_sh+210;return`M ${ax},${ay} C ${ax+s*16},${ay+30} ${ex-s*6},${ey-28} ${ex},${ey} C ${ex+s*4},${ey+32} ${hx+s*10},${hy-36} ${hx},${hy}`}
  const nd=(nn:number,sh=0)=>`M ${CX-nn+sh},${y_nek+4} C ${CX-nn+2+sh},${y_nek+14} ${CX-nn+2+sh},${y_sh-10} ${CX-nn+3+sh},${y_sh} L ${CX+nn-3+sh},${y_sh} C ${CX+nn-2+sh},${y_sh-10} ${CX+nn-2+sh},${y_nek+14} ${CX+nn+sh},${y_nek+4} Z`
  const init_bd=bd(sh_w,bu_w,wa_w,hi_w), init_la=ad(-1,sh_w), init_ra=ad(1,sh_w), init_nk=nd(nw)
  const ah=Math.round(arm_w/2)
  const fg=`M ${CX-sh_w},${y_sh} C ${CX-sh_w-6},${y_sh+10} ${CX-sh_w-58},${y_sh+20} ${CX-sh_w-64},${y_sh+30} C ${CX-sh_w-68},${y_sh+70} ${CX-sh_w-64},${y_sh+100} ${CX-sh_w-32-ah},${y_sh+110} C ${CX-sh_w-32-ah},${y_sh+140} ${CX-sh_w-14-ah+4},${y_sh+215} ${CX-sh_w-14-ah+8},${y_sh+215} L ${CX-sh_w-14+ah},${y_sh+219} C ${CX-sh_w-32+ah},${y_sh+140} ${CX-sh_w+4},${y_sh+16} ${CX-bu_w-6},${y_bu-18} C ${CX-bu_w+5},${y_bu+24} ${CX-wa_w-4},${y_wa-16} ${CX-wa_w},${y_wa} C ${CX-wa_w-6},${y_wa+18} ${CX-hi_w+4},${y_hi-14} ${CX-hi_w},${y_hi} C ${CX-hi_w},${y_hi+28} ${CX-hi_w+12},${y_bot} L ${CX+hi_w-12},${y_bot} C ${CX+hi_w},${y_hi+28} ${CX+hi_w},${y_hi} ${CX+hi_w-4},${y_hi-14} C ${CX+wa_w+6},${y_wa+18} ${CX+wa_w},${y_wa} ${CX+wa_w+4},${y_wa-16} C ${CX+bu_w-5},${y_bu+24} ${CX+bu_w},${y_bu} ${CX+sh_w-4},${y_sh+16} C ${CX+sh_w-32-ah},${y_sh+100} ${CX+sh_w-32-ah},${y_sh+140} ${CX+sh_w+14-ah},${y_sh+215} L ${CX+sh_w+14+ah+4},${y_sh+219} C ${CX+sh_w+32+ah},${y_sh+140} ${CX+sh_w+32+ah},${y_sh+100} ${CX+sh_w+58+4},${y_sh+100} C ${CX+sh_w+58-4},${y_sh+70} ${CX+sh_w+64},${y_sh+30} C ${CX+sh_w+58},${y_sh+20} ${CX+sh_w+6},${y_sh+10} ${CX+sh_w},${y_sh} Z`
  const gw=sh_w*2+arm_w*4+60
  const dressDefs=dressB64?`<clipPath id="gClip"><path id="garmentClipPath" d="${fg}"/></clipPath><pattern id="dressP" patternUnits="userSpaceOnUse" x="${CX-gw/2}" y="${y_sh}" width="${gw}" height="${y_bot-y_sh+40}"><image href="data:image/png;base64,${dressB64}" x="0" y="0" width="${gw}" height="${y_bot-y_sh+40}" preserveAspectRatio="xMidYMid slice"/></pattern>`:''
  const dressBody=dressB64?`<path id="dressPth" d="${fg}" fill="url(#dressP)" clip-path="url(#gClip)" opacity="0.92"/><path d="${fg}" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="3"/>`:''
  const armOp=dressB64?'0':'1'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#07071a;display:flex;justify-content:center;align-items:flex-start;padding:12px;font-family:system-ui}svg{cursor:grab}</style></head><body>
<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%">
<svg id="av" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="max-width:100%">
<defs>
<radialGradient id="bgG" cx="50%" cy="55%" r="62%"><stop offset="0%" stop-color="#1a1535"/><stop offset="100%" stop-color="#07071a"/></radialGradient>
<linearGradient id="bodyG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${skin_sh}"/><stop offset="40%" stop-color="${skin}"/><stop offset="60%" stop-color="${skin_hi}" stop-opacity="0.88"/><stop offset="100%" stop-color="${skin_sh}"/></linearGradient>
<filter id="bl4"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="ds"><feDropShadow dx="2" dy="4" stdDeviation="5" flood-opacity="0.3"/></filter>
${dressDefs}
</defs>
<rect width="${W}" height="${H}" fill="url(#bgG)"/>
<path id="la" d="${init_la}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${armOp}"/>
<ellipse id="lh" cx="${CX-sh_w-14}" cy="${y_sh+218}" rx="${Math.max(9,ah+1)}" ry="${Math.max(11,ah+3)}" fill="${skin}" opacity="${armOp}"/>
<path id="ra" d="${init_ra}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${armOp}"/>
<ellipse id="rh" cx="${CX+sh_w+14}" cy="${y_sh+218}" rx="${Math.max(9,ah+1)}" ry="${Math.max(11,ah+3)}" fill="${skin}" opacity="${armOp}"/>
<path id="torso" d="${init_bd}" fill="url(#bodyG)" filter="url(#ds)"/>
${dressBody}
<path id="neck" d="${init_nk}" fill="${skin_mid}" filter="url(#ds)"/>
<circle id="head" cx="${CX}" cy="${y_hcy}" r="68" fill="${skin}" filter="url(#ds)"/>
<image href="${db_url}" x="${CX-80}" y="${y_hcy-88}" width="160" height="160" clip-path="circle(68px at 80px 82px)" preserveAspectRatio="xMidYMid meet"/>
<text id="vl" x="${CX}" y="${H-8}" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.25)">FRONT · 0° · ${bodyType}</text>
</svg>
<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
<button onclick="snapTo(0)"   style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">⬆ Front</button>
<button onclick="snapTo(90)"  style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">➡ Right</button>
<button onclick="snapTo(180)" style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">⬇ Back</button>
<button onclick="snapTo(270)" style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">⬅ Left</button>
<button id="sb" onclick="toggleSpin()" style="background:#1a1040;color:#8070c0;border:1px solid #2e2060;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:11px">▶ Spin</button>
</div>
<input type="range" min="0" max="359" value="0" step="1" style="width:260px;accent-color:#8060e0" oninput="setAngle(+this.value)" id="sl"/>
</div>
<script>
(function(){
var CX=${CX},SHW=${sh_w},BUW=${bu_w},WAW=${wa_w},HIW=${hi_w},YSH=${y_sh},YBU=${y_bu},YWA=${y_wa},YHI=${y_hi},YBOT=${y_bot},YNER=${y_nek},YHCY=${y_hcy},NW=${nw},ARW=${arm_w},BT="${bodyType}",hasDress=${dressB64?'true':'false'};
var angle=0,spinning=false,dragX=null,dragA=0;
function m360(a){return((a%360)+360)%360;}
function vn(a){a=m360(a);if(a<22)return'FRONT';if(a<67)return'FRONT-R';if(a<112)return'RIGHT';if(a<157)return'BACK-R';if(a<202)return'BACK';if(a<247)return'BACK-L';if(a<292)return'LEFT';return'FRONT-L';}
function S(id,attr,val){var e=document.getElementById(id);if(e)e.setAttribute(attr,val);}
function O(id,v){var e=document.getElementById(id);if(e)e.style.opacity=v;}
function upd(a){
  a=m360(a);var r=a*Math.PI/180,c=Math.cos(r),s=Math.sin(r),wS=Math.abs(c)*0.82+0.18,sh=Math.round(s*18);
  var sw=Math.max(8,Math.round(SHW*wS)),bw=Math.max(8,Math.round(BUW*wS)),ww=Math.max(8,Math.round(WAW*wS)),hw=Math.max(8,Math.round(HIW*wS)),nn=Math.max(6,Math.round(NW*wS)),a32=Math.round(32*wS),a14=Math.round(14*wS),aw=Math.round(ARW*wS),ah=Math.round(aw/2);
  var lp='M '+(CX-sw+sh)+','+YSH+' C '+(CX-sw-8+sh)+','+(YSH+20)+' '+(CX-bw-6+sh)+','+(YBU-18)+' '+(CX-bw+sh)+','+YBU+' C '+(CX-bw+5+sh)+','+(YBU+24)+' '+(CX-ww-4+sh)+','+(YWA-16)+' '+(CX-ww+sh)+','+YWA+' C '+(CX-ww-6+sh)+','+(YWA+18)+' '+(CX-hw+4+sh)+','+(YHI-14)+' '+(CX-hw+sh)+','+YHI+' C '+(CX-hw+sh)+','+(YHI+28)+' '+(CX-hw+8+sh)+','+(YBOT-10)+' '+(CX-hw+12+sh)+','+YBOT+' ';
  var rp='L '+(CX+hw-12+sh)+','+YBOT+' C '+(CX+hw-8+sh)+','+(YBOT-10)+' '+(CX+hw+sh)+','+(YHI+28)+' '+(CX+hw+sh)+','+YHI+' C '+(CX+hw-4+sh)+','+(YHI-14)+' '+(CX+ww+6+sh)+','+(YWA+18)+' '+(CX+ww+sh)+','+YWA+' C '+(CX+ww+4+sh)+','+(YWA-16)+' '+(CX+bw-5+sh)+','+(YBU+24)+' '+(CX+bw+sh)+','+YBU+' C '+(CX+bw+6+sh)+','+(YBU-18)+' '+(CX+sw+8+sh)+','+(YSH+20)+' '+(CX+sw+sh)+','+YSH+' Z';
  var la_ox=CX-sw-a32*2+sh,ra_ox=CX+sw+a32*2+sh,la_elx=CX-sw-a32+sh,ra_elx=CX+sw+a32+sh,hy=YSH+215;
  var fg='M '+(CX-sw+sh)+','+YSH+' C '+(CX-sw-6+sh)+','+(YSH+10)+' '+(la_ox+6)+','+(YSH+20)+' '+la_ox+','+(YSH+30)+' C '+(la_ox-4)+','+(YSH+70)+' '+la_ox+','+(YSH+100)+' '+(la_elx-ah)+','+(YSH+110)+' C '+(la_elx-ah)+','+(YSH+140)+' '+(CX-sw-a14+sh-ah)+','+(hy-20)+' '+(CX-sw-a14+sh-ah+4)+','+hy+' L '+(CX-sw-a14+sh+ah)+','+(hy+4)+' C '+(la_elx+ah)+','+(YSH+140)+' '+(la_elx+ah)+','+(YSH+100)+' '+(CX-sw+4+sh)+','+(YSH+16)+' C '+(CX-bw-6+sh)+','+(YBU-18)+' '+(CX-bw+5+sh)+','+(YBU+24)+' '+(CX-ww-4+sh)+','+(YWA-16)+' C '+(CX-ww+sh)+','+YWA+' '+(CX-ww-6+sh)+','+(YWA+18)+' '+(CX-hw+4+sh)+','+(YHI-14)+' C '+(CX-hw+sh)+','+YHI+' '+(CX-hw+sh)+','+(YHI+28)+' '+(CX-hw+12+sh)+','+YBOT+' L '+(CX+hw-12+sh)+','+YBOT+' C '+(CX+hw+sh)+','+(YHI+28)+' '+(CX+hw+sh)+','+YHI+' '+(CX+hw-4+sh)+','+(YHI-14)+' C '+(CX+ww+6+sh)+','+(YWA+18)+' '+(CX+ww+sh)+','+YWA+' '+(CX+ww+4+sh)+','+(YWA-16)+' C '+(CX+bw-5+sh)+','+(YBU+24)+' '+(CX+bw+sh)+','+YBU+' '+(CX+sw-4+sh)+','+(YSH+16)+' C '+(ra_elx-ah)+','+(YSH+100)+' '+(ra_elx-ah)+','+(YSH+140)+' '+(CX+sw+a14+sh-ah)+','+hy+' L '+(CX+sw+a14+sh+ah+4)+','+(hy+4)+' C '+(ra_elx+ah)+','+(YSH+140)+' '+(ra_elx+ah)+','+(YSH+100)+' '+(ra_ox+4)+','+(YSH+100)+' C '+(ra_ox-4)+','+(YSH+70)+' '+ra_ox+','+(YSH+30)+' C '+(ra_ox-6)+','+(YSH+20)+' '+(CX+sw+6+sh)+','+(YSH+10)+' '+(CX+sw+sh)+','+YSH+' Z';
  function ap(side){var ax=CX+side*sw+sh,ay=YSH+8,ex=CX+side*(sw+a32)+sh,ey=YSH+110,hx=CX+side*(sw+a14)+sh,hy2=YSH+210;return'M '+ax+','+ay+' C '+(ax+side*16)+','+(ay+30)+' '+(ex-side*6)+','+(ey-28)+' '+ex+','+ey+' C '+(ex+side*4)+','+(ey+32)+' '+(hx+side*10)+','+(hy2-36)+' '+hx+','+hy2;}
  var nd='M '+(CX-nn+sh)+','+(YNER+4)+' C '+(CX-nn+2+sh)+','+(YNER+14)+' '+(CX-nn+2+sh)+','+(YSH-10)+' '+(CX-nn+3+sh)+','+YSH+' L '+(CX+nn-3+sh)+','+YSH+' C '+(CX+nn-2+sh)+','+(YSH-10)+' '+(CX+nn-2+sh)+','+(YNER+14)+' '+(CX+nn+sh)+','+(YNER+4)+' Z';
  S('torso','d',lp+rp);S('neck','d',nd);S('head','cx',CX+sh);
  var fi=document.getElementById('faceImg')||document.querySelector('image');if(fi)fi.setAttribute('x',CX-80+sh);
  O('faceImg',Math.max(0,c).toFixed(2));
  if(!hasDress){var sL=!(a>20&&a<160),sR=!(a>200&&a<340);S('la','d',ap(-1));S('ra','d',ap(1));O('la',sL?'1':'0');O('lh',sL?'1':'0');O('ra',sR?'1':'0');O('rh',sR?'1':'0');}
  if(hasDress){var dp=document.getElementById('dressPth'),dc=document.getElementById('garmentClipPath');if(dp)dp.setAttribute('d',fg);if(dc)dc.setAttribute('d',fg);}
  var vl=document.getElementById('vl');if(vl)vl.textContent=vn(a)+' · '+Math.round(a)+'° · '+BT;
  var sl=document.getElementById('sl');if(sl)sl.value=Math.round(a);
}
function setAngle(a){angle=m360(a);upd(angle);}window.setAngle=setAngle;
function snapTo(t){var st=angle,df=m360(t-st);if(df>180)df-=360;var steps=30,step=0;function tick(){step++;var p=step/steps;p=p<0.5?2*p*p:-1+(4-2*p)*p;angle=m360(st+df*p);upd(angle);if(step<steps)requestAnimationFrame(tick);else{angle=m360(t);upd(angle);}}requestAnimationFrame(tick);}window.snapTo=snapTo;
function toggleSpin(){spinning=!spinning;var b=document.getElementById('sb');if(b)b.textContent=spinning?'⏸ Stop':'▶ Spin';if(spinning)loop();}window.toggleSpin=toggleSpin;
function loop(){if(!spinning)return;angle=m360(angle+1.4);upd(angle);requestAnimationFrame(loop);}
var sv=document.getElementById('av');
if(sv){sv.addEventListener('mousedown',function(e){spinning=false;var b=document.getElementById('sb');if(b)b.textContent='▶ Spin';dragX=e.clientX;dragA=angle;e.preventDefault();});document.addEventListener('mousemove',function(e){if(dragX===null)return;angle=m360(dragA+(e.clientX-dragX)*0.6);upd(angle);});document.addEventListener('mouseup',function(){dragX=null;});sv.addEventListener('touchstart',function(e){spinning=false;dragX=e.touches[0].clientX;dragA=angle;e.preventDefault();},{passive:false});document.addEventListener('touchmove',function(e){if(dragX===null)return;angle=m360(dragA+(e.touches[0].clientX-dragX)*0.6);upd(angle);e.preventDefault();},{passive:false});document.addEventListener('touchend',function(){dragX=null;});}
upd(0);
})();
</script>
</body></html>`
}
