'use client'
import { useState, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════
   Fashion Stylist v29 — REAL PHOTO SPINNING AVATAR
   The person's ACTUAL PHOTO rotates in 3D. No mannequin. No body model.
   Drag left/right to spin. Measurement lines overlay on front view.
═══════════════════════════════════════════════════════════════ */

const COLOR_HEX: Record<string,string> = {
  "Pastel Pink":"#FFD1DC","Lavender":"#E6D0FF","Mint Green":"#AAFFDD","Sky Blue":"#87CEEB",
  "Blush Rose":"#FFB6C1","Butter Yellow":"#FFFACD","Soft Peach":"#FFDAB9","Warm Coral":"#FF7F50",
  "Dusty Mauve":"#C09090","Champagne":"#F7E7CE","Terracotta":"#E07050","Royal Blue":"#4169E1",
  "Emerald":"#50C878","Mustard":"#FFDB58","Teal":"#008080","Burnt Orange":"#CC5500",
  "Cobalt":"#0047AB","Deep Burgundy":"#800020","Fuchsia":"#FF00FF","Crimson":"#DC143C",
  "Navy":"#001F5B","Jade":"#00A86B","Pure White":"#FFFFFF","Bright Gold":"#FFD700",
  "Hot Pink":"#FF69B4","Coral":"#FF6B6B","Blush":"#DE5D83","Peach":"#FFCBA4",
}

const PRODUCTS: Record<string,any[]> = {
  Women:[
    {name:"Floral Wrap Dress",body:["Hourglass","Full Hourglass","Rectangle"],colors:["Pastel Pink","Lavender","Blush Rose"],sizes:["XS","S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+floral+wrap+dress",flipkart:"https://www.flipkart.com/search?q=women+floral+wrap+dress"},
    {name:"A-Line Ethnic Kurta",body:["Pear","Full Pear","Rectangle","Petite","Apple"],colors:["Royal Blue","Mint Green","Butter Yellow"],sizes:["XS","S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+a-line+ethnic+kurta",flipkart:"https://www.flipkart.com/search?q=women+a+line+kurta"},
    {name:"Bodycon Party Dress",body:["Hourglass","Full Hourglass"],colors:["Cobalt","Crimson","Pure White"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+bodycon+party+dress",flipkart:"https://www.flipkart.com/search?q=women+bodycon+dress"},
    {name:"Empire Waist Maxi",body:["Apple","Pear","Full Pear","Petite"],colors:["Lavender","Soft Peach","Mint Green"],sizes:["XS","S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+empire+waist+maxi",flipkart:"https://www.flipkart.com/search?q=women+empire+waist+maxi"},
    {name:"Anarkali Suit",body:["Apple","Pear","Full Hourglass","Rectangle"],colors:["Deep Burgundy","Cobalt","Jade"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+anarkali+suit",flipkart:"https://www.flipkart.com/search?q=women+anarkali"},
    {name:"Printed Saree",body:["Pear","Hourglass","Apple","Rectangle","Full Hourglass"],colors:["Royal Blue","Crimson","Mustard","Teal"],sizes:["Free Size"],amazon:"https://www.amazon.in/s?k=women+printed+saree",flipkart:"https://www.flipkart.com/search?q=women+printed+saree"},
    {name:"Salwar Kameez",body:["Pear","Rectangle","Apple","Hourglass"],colors:["Terracotta","Mustard","Cobalt"],sizes:["XS","S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+salwar+kameez",flipkart:"https://www.flipkart.com/search?q=women+salwar+kameez"},
    {name:"Kaftan Dress",body:["Apple","Oval","Rectangle","Pear","Full Pear"],colors:["Teal","Emerald","Mustard","Coral"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+kaftan+dress",flipkart:"https://www.flipkart.com/search?q=women+kaftan"},
  ],
  Men:[
    {name:"Slim Fit Formal Shirt",body:["Trapezoid","Column","Rectangle"],colors:["Royal Blue","Pure White","Cobalt"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=men+slim+fit+formal+shirt",flipkart:"https://www.flipkart.com/search?q=men+slim+formal+shirt"},
    {name:"Structured Blazer",body:["Triangle","Circle","Column","Rectangle"],colors:["Navy","Deep Burgundy","Teal"],sizes:["S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=men+structured+blazer",flipkart:"https://www.flipkart.com/search?q=men+blazer"},
    {name:"Polo T-Shirt",body:["Trapezoid","Column","Rectangle","Triangle"],colors:["Navy","Cobalt","Emerald","Crimson"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=men+polo+tshirt",flipkart:"https://www.flipkart.com/search?q=men+polo+tshirt"},
    {name:"Kurta Pyjama",body:["Rectangle","Column","Trapezoid","Circle"],colors:["Pure White","Cobalt","Deep Burgundy"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=men+kurta+pyjama+set",flipkart:"https://www.flipkart.com/search?q=men+kurta+pyjama"},
  ],
  Kids:[
    {name:"Cotton Frock",body:["Petite"],colors:["Pastel Pink","Mint Green","Butter Yellow"],sizes:["2Y","3Y","4Y","5Y","6Y"],amazon:"https://www.amazon.in/s?k=kids+cotton+frock",flipkart:"https://www.flipkart.com/search?q=kids+frock"},
    {name:"Party Dress",body:["Petite"],colors:["Fuchsia","Lavender","Bright Gold"],sizes:["4Y","5Y","6Y","7Y","8Y+"],amazon:"https://www.amazon.in/s?k=kids+party+dress",flipkart:"https://www.flipkart.com/search?q=kids+party+dress"},
  ],
}

/* ════════════════════════════════════════════════════════════════
   BUILD THE SPINNING PHOTO PAGE (runs inside iframe)
   
   Technique:
   - CSS perspective + rotateY on a card that holds the photo
   - Front face = photo with measurement line overlays
   - Back face  = same photo mirrored + darkened  
   - Side view  = photo compressed via scaleX (perspective illusion)
   - Measurement lines fade out as card rotates to side/back
   ════════════════════════════════════════════════════════════════ */
function buildSpinPage(result: any, photoDataUrl: string, dressB64: string | null): string {
  const bt   = result?.body_type || ''
  const size = result?.size || ''

  // Measurement line positions as % of card height (front-face overlay)
  // yPct calibrated to typical standing full-body photo proportions
  const lines = result ? [
    { label:`Bust ${result.bust_cm}cm`,    y:29, color:'#00d4ff' },
    { label:`Waist ${result.waist_cm}cm`,  y:41, color:'#ffd700' },
    { label:`Hip ${result.hip_cm}cm`,      y:56, color:'#c084fc' },
  ] : []

  const linesHTML = lines.map(l => `
    <div style="
      position:absolute;left:6%;right:6%;top:${l.y}%;
      border-top:2px solid ${l.color};
      opacity:0.9;pointer-events:none;z-index:4;
    ">
      <span style="
        position:absolute;right:0;top:-17px;
        font-size:10px;font-weight:800;color:${l.color};
        background:rgba(0,0,0,0.55);padding:1px 5px;border-radius:3px;
        white-space:nowrap;text-shadow:0 1px 3px #000;
      ">${l.label}</span>
    </div>`).join('')

  // Optional dress overlay on front face
  const dressLayer = dressB64
    ? `<div style="position:absolute;top:22%;left:0;right:0;bottom:0;pointer-events:none;z-index:3;border-radius:0 0 14px 14px;overflow:hidden;">
         <img src="data:image/png;base64,${dressB64}" style="width:100%;height:100%;object-fit:cover;opacity:0.85;"/>
       </div>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{
  width:100%;height:100%;
  background:radial-gradient(ellipse at 50% 46%,#140e38 0%,#05050f 100%);
  display:flex;flex-direction:column;
  align-items:center;justify-content:flex-start;
  padding:18px 8px 12px;
  font-family:system-ui,sans-serif;
  overflow:hidden;user-select:none;
}

/* ── 3-D stage ── */
#stage{
  perspective:1000px;
  perspective-origin:50% 46%;
  width:224px;height:430px;
  flex-shrink:0;
}

/* ── The rotating card ── */
#card{
  width:100%;height:100%;
  position:relative;
  transform-style:preserve-3d;
  transform:rotateY(0deg);
  cursor:grab;
  will-change:transform;
}
#card:active{cursor:grabbing;}

/* ── Both faces ── */
.face{
  position:absolute;inset:0;
  backface-visibility:hidden;
  -webkit-backface-visibility:hidden;
  border-radius:14px;
  overflow:hidden;
  box-shadow:0 10px 44px rgba(0,0,0,0.75),0 0 0 1px rgba(255,255,255,0.05);
}
.face img.photo{
  width:100%;height:100%;
  object-fit:cover;object-position:top center;
  display:block;pointer-events:none;
}
#front{transform:rotateY(0deg);}
#back {transform:rotateY(180deg);}
#back img.photo{transform:scaleX(-1);filter:brightness(0.65) saturate(0.8);}

/* ── Floor shadow ── */
#shadow{
  width:180px;height:16px;margin-top:-2px;flex-shrink:0;
  background:radial-gradient(ellipse,rgba(100,70,220,0.22) 0%,transparent 70%);
}

/* ── Size pill ── */
#pill{
  margin-top:10px;flex-shrink:0;
  display:flex;align-items:center;gap:8px;
  background:rgba(22,16,56,0.92);
  border:1px solid rgba(120,80,220,0.28);
  border-radius:30px;padding:5px 16px;
}
#pill .sz{color:#ffd700;font-weight:800;font-size:15px;}
#pill .bt{color:#7060a0;font-size:12px;}

/* ── Controls ── */
#ctrls{
  margin-top:12px;flex-shrink:0;
  display:flex;gap:6px;flex-wrap:wrap;justify-content:center;
}
button{
  background:rgba(24,18,58,0.94);color:#c0b0f0;
  border:1px solid rgba(80,60,160,0.5);
  padding:6px 14px;border-radius:8px;
  cursor:pointer;font-size:11px;font-weight:700;
  transition:background .15s,color .15s;
  -webkit-tap-highlight-color:transparent;
}
button:hover,button:active{background:#3a2d80;color:#fff;}
#spinBtn.on{background:#5b21b6;color:#fff;border-color:#8b5cf6;}

/* ── Slider ── */
#sl{
  margin-top:8px;flex-shrink:0;
  width:210px;accent-color:#7c3aed;
}
#vl{
  margin-top:5px;flex-shrink:0;
  font-size:10px;letter-spacing:1.2px;
  color:rgba(160,140,220,0.28);
}
</style>
</head>
<body>

<div id="stage">
  <div id="card">

    <!-- FRONT: real photo + measurement lines + optional dress -->
    <div class="face" id="front">
      <img class="photo" src="${photoDataUrl}" alt="you"/>
      ${linesHTML}
      ${dressLayer}
    </div>

    <!-- BACK: mirrored photo -->
    <div class="face" id="back">
      <img class="photo" src="${photoDataUrl}" alt="back"/>
    </div>

  </div>
</div>

<div id="shadow"></div>

<div id="pill">
  <span class="sz">${size}</span>
  <span class="bt">${bt}</span>
</div>

<div id="ctrls">
  <button onclick="snapTo(0)">⬆ Front</button>
  <button onclick="snapTo(90)">➡ Right</button>
  <button onclick="snapTo(180)">⬇ Back</button>
  <button onclick="snapTo(270)">⬅ Left</button>
  <button id="spinBtn" onclick="toggleSpin()">▶ Spin</button>
</div>
<input type="range" id="sl" min="0" max="359" value="0" step="1" oninput="setAngle(+this.value)"/>
<div id="vl">FRONT · 0°</div>

<script>
(function(){
  var card=document.getElementById('card');
  var sl=document.getElementById('sl');
  var spinBtn=document.getElementById('spinBtn');
  var vl=document.getElementById('vl');
  var angle=0,spinning=false,raf=null;
  var dragX=null,dragA=0;

  var lines=document.querySelectorAll('#front>div[style*="border-top"]');

  function m360(a){return((a%360)+360)%360;}

  function label(a){
    a=m360(a);
    if(a<22)return'FRONT';if(a<67)return'FRONT-R';if(a<112)return'RIGHT';
    if(a<157)return'BACK-R';if(a<202)return'BACK';if(a<247)return'BACK-L';
    if(a<292)return'LEFT';return'FRONT-L';
  }

  function render(a){
    a=m360(a);
    // CSS 3D rotation — browser handles back-face hiding
    card.style.transform='rotateY('+a+'deg)';
    // Fade measurement lines: visible front, invisible at sides/back
    var cos=Math.cos(a*Math.PI/180);
    var lo=Math.max(0,cos).toFixed(2);
    lines.forEach(function(l){l.style.opacity=lo;});
    sl.value=Math.round(a);
    vl.textContent=label(a)+' · '+Math.round(a)+'°';
  }

  function setAngle(a){angle=m360(a);render(angle);}
  window.setAngle=setAngle;

  function snapTo(t){
    stop();
    var s=angle,d=m360(t-s);if(d>180)d-=360;
    var N=28,i=0;
    function tick(){
      i++;var p=i/N;p=p<.5?2*p*p:-1+(4-2*p)*p;
      angle=m360(s+d*p);render(angle);
      if(i<N)raf=requestAnimationFrame(tick);
      else{angle=m360(t);render(angle);}
    }
    raf=requestAnimationFrame(tick);
  }
  window.snapTo=snapTo;

  function stop(){
    spinning=false;spinBtn.textContent='▶ Spin';
    spinBtn.classList.remove('on');
    if(raf){cancelAnimationFrame(raf);raf=null;}
  }

  function toggleSpin(){
    spinning=!spinning;
    spinBtn.textContent=spinning?'⏸ Stop':'▶ Spin';
    spinning?spinBtn.classList.add('on'):spinBtn.classList.remove('on');
    if(spinning)loop();else if(raf){cancelAnimationFrame(raf);raf=null;}
  }
  window.toggleSpin=toggleSpin;

  function loop(){if(!spinning)return;angle=m360(angle+0.9);render(angle);raf=requestAnimationFrame(loop);}

  // Mouse drag
  card.addEventListener('mousedown',function(e){stop();dragX=e.clientX;dragA=angle;e.preventDefault();});
  document.addEventListener('mousemove',function(e){if(dragX===null)return;angle=m360(dragA+(e.clientX-dragX)*0.55);render(angle);});
  document.addEventListener('mouseup',function(){dragX=null;});

  // Touch drag
  card.addEventListener('touchstart',function(e){stop();dragX=e.touches[0].clientX;dragA=angle;e.preventDefault();},{passive:false});
  document.addEventListener('touchmove',function(e){if(dragX===null)return;angle=m360(dragA+(e.touches[0].clientX-dragX)*0.55);render(angle);e.preventDefault();},{passive:false});
  document.addEventListener('touchend',function(){dragX=null;});

  render(0);
})();
</script>
</body>
</html>`
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [step,         setStep]        = useState<'upload'|'result'>('upload')
  const [loading,      setLoading]     = useState(false)
  const [error,        setError]       = useState('')
  const [result,       setResult]      = useState<any>(null)
  const [visImg,       setVisImg]      = useState<string|null>(null)
  const [preview,      setPreview]     = useState<string|null>(null)
  const [photoDataUrl, setPhotoDataUrl]= useState<string|null>(null) // full data URL for iframe
  const [category,     setCategory]    = useState('Women')
  const [userHeight,   setUserHeight]  = useState('')
  const [dressB64,     setDressB64]    = useState<string|null>(null)
  const [dressPreview, setDressPreview]= useState<string|null>(null)
  const [dressLoading, setDressLoading]= useState(false)
  const [activeTab,    setActiveTab]   = useState<'avatar'|'tryon'|'shop'>('avatar')

  const fileRef  = useRef<HTMLInputElement>(null)
  const dressRef = useRef<HTMLInputElement>(null)

  /* Read file as base64 data URL (for embedding in iframe srcDoc) */
  const readDataUrl = (file: File): Promise<string> =>
    new Promise(res => {
      const r = new FileReader()
      r.onload = () => res(r.result as string)
      r.readAsDataURL(file)
    })

  const analyze = async (file: File) => {
    setLoading(true); setError('')
    try {
      // Read photo as data URL — this is what the spinning avatar uses
      const dataUrl = await readDataUrl(file)
      setPhotoDataUrl(dataUrl)

      // Send to HF backend for measurements
      const form = new FormData()
      form.append('file', file)
      form.append('category', category)
      if (userHeight) form.append('user_height', userHeight)

      const data = await fetch('/api/analyze', { method:'POST', body:form }).then(r=>r.json())
      if (data.error) { setError(data.error); setLoading(false); return }

      setResult(data)
      if (data.vis_jpeg_b64) setVisImg(`data:image/jpeg;base64,${data.vis_jpeg_b64}`)

      // Auto extract dress from same photo (silent)
      extractDressFrom(file, true)

      setStep('result')
    } catch(e:any) { setError(e.message) }
    setLoading(false)
  }

  const extractDressFrom = async (file: File, silent = false) => {
    if (!silent) setDressLoading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const data = await fetch('/api/extract-dress', { method:'POST', body:form }).then(r=>r.json())
      if (!data.error) {
        setDressB64(data.dress_b64)
        setDressPreview(`data:image/png;base64,${data.dress_b64}`)
        if (!silent) setActiveTab('tryon')
      }
    } catch {}
    if (!silent) setDressLoading(false)
  }

  const clearDress = () => { setDressB64(null); setDressPreview(null) }

  /* Fit analysis badges */
  const WOMEN_BUST: Record<string,number> = {XS:76,S:82,M:88,L:94,XL:100,XXL:108,XXXL:116,'4XL':124}
  const fitBadges = () => {
    if (!result) return null
    const std = WOMEN_BUST[result.size] ?? result.bust_cm
    return [
      ['Bust/Chest', std - result.bust_cm],
      ['Waist', (std-14) - result.waist_cm],
      ['Hip', (std+6) - result.hip_cm],
    ].map(([zone, diff]) => {
      const d = diff as number
      const [icon,lbl,col] = d>=0&&d<6 ? ['✅','Perfect fit','#22c55e'] : d>=6 ? ['⬆','Slightly loose','#eab308'] : d>=-5 ? ['⚠','Snug','#f97316'] : ['❌','Too tight','#ef4444']
      return (
        <div key={zone as string} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'#06061a',borderLeft:`3px solid ${col}`,borderRadius:6,marginBottom:5,fontSize:12}}>
          <span>{icon}</span>
          <div>
            <div style={{color:col,fontWeight:700,fontSize:12}}>{zone as string}</div>
            <div style={{color:'#444',fontSize:11}}>{lbl} ({d>=0?'+':''}{d.toFixed(1)}cm)</div>
          </div>
        </div>
      )
    })
  }

  /* The spinning photo iframe — key changes force re-render when photo/dress changes */
  const spinFrame = (id: string, withDress: boolean) => {
    if (!photoDataUrl || !result) return (
      <div style={{background:'#080818',borderRadius:16,height:500,display:'flex',alignItems:'center',justifyContent:'center',color:'#2a2a60',fontSize:14}}>
        Photo loads here
      </div>
    )
    const k = `${id}-${photoDataUrl.length}-${withDress&&dressB64?dressB64.length:0}`
    return (
      <div style={{background:'#080818',borderRadius:16,overflow:'hidden',minHeight:500}}>
        <iframe
          key={k}
          srcDoc={buildSpinPage(result, photoDataUrl, withDress ? dressB64 : null)}
          style={{width:'100%',height:560,border:'none',display:'block'}}
          title={id}
          sandbox="allow-scripts"
        />
      </div>
    )
  }

  const tabBtn = (id: string, label: string) => (
    <button onClick={()=>setActiveTab(id as any)} style={{
      padding:'10px 18px', border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
      background:'transparent',
      color: activeTab===id ? '#e8c99a' : '#38307a',
      borderBottom: activeTab===id ? '2px solid #e8c99a' : '2px solid transparent',
      whiteSpace:'nowrap', transition:'color .15s'
    }}>{label}</button>
  )

  /* ─── RENDER ─── */
  return (
    <main style={{minHeight:'100vh',background:'#06061a',color:'#e8e0ff',fontFamily:'system-ui,sans-serif'}}>

      {/* ── HEADER ── */}
      <div style={{background:'linear-gradient(135deg,#160830,#0a0420)',padding:'15px 22px',borderBottom:'1px solid #160d38',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <h1 style={{margin:0,fontSize:'1.35rem',fontWeight:800,color:'#e8c99a'}}>
            👗 3D Fashion Stylist Pro
          </h1>
          <p style={{margin:'2px 0 0',color:'#4a3870',fontSize:'0.72rem'}}>
            Your photo spins in 3D · AI body measurements · Smart style recommendations
          </p>
        </div>
        {result && (
          <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(20,14,50,0.9)',border:'1px solid #221848',borderRadius:12,padding:'6px 14px'}}>
            <span style={{width:10,height:10,borderRadius:'50%',background:result.skin_hex,border:'1px solid #666',display:'inline-block'}}/>
            <span style={{fontWeight:800,color:'#ffd700',fontSize:15}}>{result.size}</span>
            <span style={{color:'#6050a0',fontSize:12}}>{result.body_icon} {result.body_type}</span>
          </div>
        )}
      </div>

      <div style={{maxWidth:1180,margin:'0 auto',padding:'16px 12px'}}>

        {/* ══ UPLOAD STEP ══ */}
        {step==='upload' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>

            <div style={{background:'#0c0c2a',border:'1px solid #1a1848',borderRadius:18,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:4}}>📸 Upload Your Photo</div>
              <div style={{color:'#3a3068',fontSize:12,marginBottom:14,lineHeight:1.55}}>
                Your <b style={{color:'#7050c0'}}>actual photo</b> spins in 3D — no mannequin, no avatar.<br/>Stand facing camera, full body visible.
              </div>

              {/* Category */}
              <div style={{display:'flex',gap:6,marginBottom:10}}>
                {['Women','Men','Kids'].map(c=>(
                  <button key={c} onClick={()=>setCategory(c)} style={{
                    flex:1,padding:'8px 0',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12,
                    border:`1px solid ${category===c?'#6030c0':'#181840'}`,
                    background:category===c?'#22166a':'#090920',
                    color:category===c?'#e8c99a':'#362870',transition:'all .2s'
                  }}>{c}</button>
                ))}
              </div>

              {/* Height */}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,background:'#08081e',borderRadius:10,padding:'9px 12px',border:'1px solid #141440'}}>
                <span style={{fontSize:16}}>📏</span>
                <span style={{color:'#3a3060',fontSize:12,flexShrink:0}}>Height</span>
                <input type="number" value={userHeight} onChange={e=>setUserHeight(e.target.value)}
                  placeholder="162" min="80" max="220"
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#e8e0ff',fontSize:14,fontWeight:700,minWidth:0}}/>
                <span style={{color:'#282850',fontSize:12,flexShrink:0}}>cm</span>
              </div>

              {/* Drop zone */}
              <div onClick={()=>fileRef.current?.click()} style={{
                border:`2px dashed ${preview?'#4030a0':'#161640'}`,
                borderRadius:14,cursor:'pointer',
                background:'#080818',textAlign:'center',
                minHeight:200,display:'flex',flexDirection:'column',
                alignItems:'center',justifyContent:'center',gap:10,
                padding:preview?6:28,transition:'all .2s',
                boxShadow:preview?'0 0 0 1px rgba(100,60,200,0.2)':'none'
              }}>
                {preview
                  ? <img src={preview} alt="preview" style={{maxHeight:260,borderRadius:10,objectFit:'contain'}}/>
                  : <>
                    <div style={{fontSize:56}}>📷</div>
                    <div style={{color:'#3a2c80',fontSize:13,fontWeight:700}}>Tap to choose your photo</div>
                    <div style={{color:'#1e1c40',fontSize:11}}>JPG · PNG · WEBP</div>
                  </>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e=>{const f=e.target.files?.[0];if(f){setPreview(URL.createObjectURL(f));analyze(f)}}}/>

              {loading && (
                <div style={{marginTop:12,padding:'12px 14px',background:'#120a30',border:'1px solid #301870',borderRadius:10,textAlign:'center'}}>
                  <div style={{color:'#8060d0',fontWeight:700,fontSize:13}}>⏳ Analysing your photo...</div>
                  <div style={{color:'#3a2870',fontSize:11,marginTop:4}}>Measuring body · Preparing spin view</div>
                </div>
              )}
              {error && (
                <div style={{marginTop:12,padding:'10px 14px',background:'#1e0606',border:'1px solid #500',borderRadius:8,color:'#ff6060',fontSize:12}}>
                  ❌ {error}
                </div>
              )}
            </div>

            {/* What you get */}
            <div style={{background:'#0c0c2a',border:'1px solid #141440',borderRadius:18,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:16}}>✨ What happens</div>
              {([
                ['📸','Your real photo spins in 3D — drag it left or right to rotate'],
                ['📐','AI measures bust, waist, hip and recommends your size'],
                ['📏','Measurement lines overlay directly on your photo'],
                ['👗','Your current outfit is auto-detected for the try-on view'],
                ['🎨','Personalised colour palette matched to your skin tone'],
                ['🛍','Shop your exact size on Amazon & Flipkart'],
              ] as [string,string][]).map(([icon,text]) => (
                <div key={text} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:13}}>
                  <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
                  <span style={{color:'#4a3880',fontSize:13,lineHeight:1.5}}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ RESULT STEP ══ */}
        {step==='result' && result && (
          <div>
            {/* Tab bar */}
            <div style={{display:'flex',borderBottom:'1px solid #141440',marginBottom:16,overflowX:'auto'}}>
              {tabBtn('avatar','👤 3D Avatar')}
              {tabBtn('tryon','👗 Try-On')}
              {tabBtn('shop','🛍 Shop')}
              <button onClick={()=>{setStep('upload');setResult(null);setPreview(null);setPhotoDataUrl(null);clearDress()}}
                style={{marginLeft:'auto',padding:'7px 13px',background:'#110d30',color:'#3a2870',border:'1px solid #1a1640',borderRadius:8,cursor:'pointer',fontSize:12}}>
                📸 New Photo
              </button>
            </div>

            {/* ── 3D AVATAR TAB ── */}
            {activeTab==='avatar' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>

                {/* Spinning photo — NO DRESS on avatar tab */}
                {spinFrame('av1', false)}

                {/* Right panel */}
                <div style={{display:'flex',flexDirection:'column',gap:14}}>

                  {/* Detection overlay image */}
                  {visImg && (
                    <div style={{borderRadius:12,overflow:'hidden',border:'1px solid #1a1a50',background:'#000'}}>
                      <img src={visImg} alt="measurement analysis" style={{width:'100%',maxHeight:200,objectFit:'contain',display:'block'}}/>
                      <div style={{padding:'5px 10px',background:'#080818',color:'#303060',fontSize:10}}>
                        AI measurement detection — lines show exact scan positions
                      </div>
                    </div>
                  )}

                  {/* Body type + measurements */}
                  <div style={{background:'#0c0c2a',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:8}}>
                      <span style={{fontSize:24}}>{result.body_icon}</span>
                      <span style={{color:'#e8c99a',fontWeight:800,fontSize:16}}>{result.body_type}</span>
                      <span style={{background:'#2e1578',color:'#ffd700',padding:'3px 12px',borderRadius:8,fontWeight:800,fontSize:14}}>{result.size}</span>
                    </div>
                    <div style={{color:'#3a3060',fontSize:12,marginBottom:12,lineHeight:1.5}}>{result.body_desc}</div>

                    {result.quality_warnings?.length > 0 && (
                      <div style={{background:'rgba(255,150,0,0.06)',border:'1px solid rgba(255,150,0,0.18)',borderRadius:8,padding:'7px 10px',marginBottom:10}}>
                        {result.quality_warnings.slice(0,2).map((w:string)=>(
                          <div key={w} style={{color:'#906000',fontSize:11}}>⚠ {w}</div>
                        ))}
                      </div>
                    )}

                    {/* Measurements */}
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                      {([
                        ['Shoulder', result.shoulder_cm],
                        ['Bust',     result.bust_cm],
                        ['Waist',    result.waist_cm],
                        ['Hi-Hip',   result.high_hip_cm],
                        ['Hip',      result.hip_cm],
                        ['Height',   result.height_cm],
                      ] as [string,any][]).map(([k,v])=>(
                        <div key={k} style={{background:'#06061a',border:'1px solid #101038',borderRadius:8,padding:'7px 9px'}}>
                          <div style={{color:'#28285a',fontSize:9,textTransform:'uppercase',letterSpacing:0.8}}>{k}</div>
                          <div style={{color:'#ddd8f8',fontWeight:800,fontSize:14}}>{v}<span style={{fontSize:9,color:'#28285a',marginLeft:1}}>cm</span></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Colours + tips */}
                  <div style={{background:'#0c0c2a',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
                    <div style={{color:'#e8c99a',fontWeight:700,fontSize:12,marginBottom:8}}>🎨 Your Colours — {result.skin_tone}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:10}}>
                      {result.best_colors?.slice(0,7).map((c:string)=>(
                        <span key={c} style={{display:'inline-flex',alignItems:'center',gap:4,background:'#141440',color:'#9080c0',border:'1px solid #202060',borderRadius:8,padding:'3px 8px',fontSize:11}}>
                          <span style={{width:8,height:8,borderRadius:'50%',background:COLOR_HEX[c]||'#888',display:'inline-block'}}/>
                          {c}
                        </span>
                      ))}
                    </div>
                    <div style={{color:'#e8c99a',fontWeight:700,fontSize:12,marginBottom:6}}>💡 Style Tips</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {result.style_tips?.map((t:string)=>(
                        <span key={t} style={{background:'#101840',color:'#6080c0',border:'1px solid #1a2850',borderRadius:8,padding:'3px 8px',fontSize:11}}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <button onClick={()=>setActiveTab('tryon')} style={{
                    background:'linear-gradient(135deg,#4018a0,#7030c0)',
                    color:'#fff',border:'none',padding:'12px',borderRadius:12,
                    cursor:'pointer',fontWeight:800,fontSize:14,letterSpacing:0.2
                  }}>
                    👗 Virtual Try-On →
                  </button>
                </div>
              </div>
            )}

            {/* ── TRY-ON TAB ── */}
            {activeTab==='tryon' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:16}}>

                <div style={{display:'flex',flexDirection:'column',gap:14}}>

                  {/* Outfit upload */}
                  <div style={{background:'#0c0c2a',border:'1px solid #1a1848',borderRadius:16,padding:18}}>
                    <div style={{color:'#e8c99a',fontWeight:800,marginBottom:4}}>👗 Upload a New Outfit</div>
                    <div style={{color:'#3a2e70',fontSize:12,marginBottom:12,lineHeight:1.5}}>
                      Your current outfit is already shown on your spinning photo.<br/>Upload a different garment image to swap it.
                    </div>
                    <div onClick={()=>dressRef.current?.click()} style={{
                      border:'2px dashed #161640',borderRadius:12,padding:14,cursor:'pointer',
                      background:'#080818',textAlign:'center',minHeight:130,
                      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8
                    }}>
                      {dressPreview
                        ? <img src={dressPreview} alt="outfit" style={{maxHeight:130,borderRadius:8,objectFit:'contain'}}/>
                        : <><span style={{fontSize:32}}>👗</span><span style={{color:'#2e2860',fontSize:12}}>Upload outfit image</span></>
                      }
                    </div>
                    <input ref={dressRef} type="file" accept="image/*" style={{display:'none'}}
                      onChange={e=>{const f=e.target.files?.[0];if(f)extractDressFrom(f)}}/>
                    {dressLoading && <div style={{marginTop:8,color:'#5040a0',fontSize:12,textAlign:'center'}}>⏳ Extracting outfit...</div>}
                    {dressB64 && (
                      <button onClick={clearDress} style={{marginTop:10,width:'100%',background:'#120816',color:'#903080',border:'1px solid #280c26',padding:'8px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>
                        🗑 Remove outfit overlay
                      </button>
                    )}
                  </div>

                  {/* Fit analysis */}
                  <div style={{background:'#06061a',border:'1px solid #101038',borderRadius:14,padding:14}}>
                    <div style={{color:'#e8c99a',fontWeight:700,fontSize:13,marginBottom:10}}>📐 Fit for Size {result.size}</div>
                    {fitBadges()}
                    <div style={{marginTop:6,fontSize:11,color:'#282848',textAlign:'center',padding:'6px',background:'#080818',borderRadius:6}}>
                      Ease = space between body and garment. 0–6 cm = ideal fit.
                    </div>
                  </div>

                  <div style={{background:'#0c0c2a',border:'1px solid #141440',borderRadius:10,padding:12,fontSize:12,color:'#282858',lineHeight:1.6}}>
                    <b style={{color:'#503890'}}>💡 Tips:</b>
                    <div>• Drag your photo left/right to spin 360°</div>
                    <div>• Product photos on white background work best</div>
                    <div>• The outfit overlays on the front face</div>
                  </div>
                </div>

                {/* Spinning photo WITH dress overlay */}
                {spinFrame('av2', true)}
              </div>
            )}

            {/* ── SHOP TAB ── */}
            {activeTab==='shop' && (
              <ShopPanel bodyType={result.body_type} skinTone={result.skin_tone}
                size={result.size} bestColors={result.best_colors} category={category}/>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function ShopPanel({bodyType,skinTone,size,bestColors,category}:any){
  const all  = PRODUCTS[category]||PRODUCTS.Women
  const best = new Set(bestColors)
  let matched = all.filter((p:any)=>p.body.includes(bodyType)&&p.sizes.includes(size)&&p.colors.some((c:string)=>best.has(c)))
  if(!matched.length) matched = all.filter((p:any)=>p.body.includes(bodyType))
  if(!matched.length) matched = all
  return(
    <div>
      <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:14}}>
        🛍 {matched.length} picks — {bodyType} · {skinTone} · Size {size}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
        {matched.map((p:any)=>{
          const mc=p.colors.filter((c:string)=>best.has(c)).length?p.colors.filter((c:string)=>best.has(c)):p.colors.slice(0,2)
          return(
            <div key={p.name} style={{background:'#0c0c2a',border:'1px solid #141440',borderRadius:14,padding:16}}>
              <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:8}}>{p.name}</div>
              <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
                {mc.map((c:string)=>(
                  <span key={c} style={{display:'inline-flex',alignItems:'center',gap:3,background:'#141440',color:'#9080c0',border:'1px solid #202060',borderRadius:8,padding:'2px 7px',fontSize:11}}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:COLOR_HEX[c]||'#888',display:'inline-block'}}/>
                    {c}
                  </span>
                ))}
              </div>
              <div style={{color:'#222250',fontSize:11,marginBottom:12}}>Sizes: {p.sizes.join(' · ')}</div>
              <div style={{display:'flex',gap:8}}>
                <a href={p.amazon}   target="_blank" rel="noreferrer" style={{background:'#ff9900',color:'#000',padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textDecoration:'none',flex:1,textAlign:'center'}}>🛒 Amazon</a>
                <a href={p.flipkart} target="_blank" rel="noreferrer" style={{background:'#2874f0',color:'#fff',padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textDecoration:'none',flex:1,textAlign:'center'}}>🛒 Flipkart</a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
