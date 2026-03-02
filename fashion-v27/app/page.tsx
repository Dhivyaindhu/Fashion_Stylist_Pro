'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════════════════
   Fashion Stylist Pro v38 — FIXED AVATAR + ACCURATE MEASUREMENTS
   ─────────────────────────────────────────────────────────────────
   FIX 1 · 3D AVATAR    → Full user photo spins 360° (CSS 3D card)
                          NOT mannequin + face — the whole photo rotates
   FIX 2 · ANALYSIS     → Uses backend y_frac for exact line positions
                          Lines land on the actual BUST/WAIST/HIP zones
   FIX 3 · PHOTO TRY-ON → Upload a NEW dress (not person's own dress)
                          Dress removed from person, new dress applied
   FIX 4 · AVATAR DRESS → Try-on result replaces avatar photo
   ═══════════════════════════════════════════════════════════════════ */

const BACKEND_URL = 'https://indhu321-fashion-stylist-app.hf.space'

// ── Colour hex lookup ────────────────────────────────────────────
const COLOR_HEX: Record<string,string> = {
  "Pastel Pink":"#FFD1DC","Lavender":"#E6D0FF","Mint Green":"#AAFFDD","Sky Blue":"#87CEEB",
  "Blush Rose":"#FFB6C1","Butter Yellow":"#FFFACD","Soft Peach":"#FFDAB9","Warm Coral":"#FF7F50",
  "Dusty Mauve":"#C09090","Champagne":"#F7E7CE","Terracotta":"#E07050","Royal Blue":"#4169E1",
  "Emerald":"#50C878","Mustard":"#FFDB58","Teal":"#008080","Burnt Orange":"#CC5500",
  "Cobalt":"#0047AB","Deep Burgundy":"#800020","Fuchsia":"#FF00FF","Crimson":"#DC143C",
  "Navy":"#001F5B","Jade":"#00A86B","Pure White":"#FFFFFF","Bright Gold":"#FFD700",
  "Hot Pink":"#FF69B4","Coral":"#FF6B6B","Blush":"#DE5D83","Peach":"#FFCBA4",
  "Ivory":"#FFFFF0","Rust":"#B7410E","Forest Green":"#228B22","Plum":"#8B008B",
  "Camel":"#C19A6B","Sage":"#B2AC88","Dusty Rose":"#DCAE96","Burnt Sienna":"#E97451",
}

// ── Skin-tone palettes ───────────────────────────────────────────
const SKIN_PALETTES: Record<string,{best:string[],avoid:string[],neutrals:string[],hex:string,tip:string}> = {
  Fair:{hex:'#f5d5c8',best:["Pastel Pink","Lavender","Mint Green","Sky Blue","Blush Rose","Butter Yellow","Soft Peach","Dusty Rose","Sage"],neutrals:["Ivory","Champagne","Camel"],avoid:["Pure White","Neon Yellow","Neon Green"],tip:"Soft muted tones complement your fair complexion. Avoid stark white — ivory or champagne flatters more."},
  Light:{hex:'#ebbfa0',best:["Warm Coral","Dusty Mauve","Terracotta","Sky Blue","Blush","Peach","Sage","Dusty Rose","Cobalt"],neutrals:["Champagne","Camel","Ivory"],avoid:["Pale pastels","Washed-out greys"],tip:"Warm earth tones and soft corals make your skin glow. Rich blues create beautiful contrast."},
  Medium:{hex:'#c8956c',best:["Royal Blue","Emerald","Mustard","Teal","Burnt Orange","Cobalt","Coral","Forest Green","Plum"],neutrals:["Camel","Rust","Burnt Sienna"],avoid:["Muddy browns","Orange-browns similar to skin"],tip:"Bold jewel tones are your superpower. Vibrant colours create stunning contrast against medium skin."},
  Tan:{hex:'#a0694a',best:["Cobalt","Deep Burgundy","Fuchsia","Crimson","Navy","Teal","Jade","Bright Gold","Forest Green"],neutrals:["Rust","Camel","Burnt Sienna"],avoid:["Dull khaki","Muddy olive","Washed-out colours"],tip:"Rich saturated colours and warm metallics illuminate tan skin beautifully. Avoid dull tones."},
  Deep:{hex:'#5c2e10',best:["Pure White","Bright Gold","Cobalt","Fuchsia","Hot Pink","Emerald","Crimson","Lavender","Mint Green"],neutrals:["Camel","Ivory","Champagne"],avoid:["Dark navy on dark skin","Black-on-black","Dark muddy tones"],tip:"High-contrast bright colours and metallics are stunning. Pure white creates a striking, elegant look."},
}

// ── Body-type data ───────────────────────────────────────────────
const BODY_DATA: Record<string,{icon:string,desc:string,shape:string,tips:string[],avoid:string[],bestStyles:string[],sareeStyle:string,colorFocus:string}> = {
  "Hourglass":{icon:"⌛",shape:"Balanced shoulders & hips · Defined waist",desc:"Your proportions are naturally balanced — any silhouette that highlights your waist works.",tips:["Wrap dresses","Bodycon silhouettes","Belted kurtas","Fit & Flare","V-necks"],avoid:["Shapeless boxy cuts","Oversized tops that hide your waist"],bestStyles:["Wrap Dress","Sheath Dress","Belted Anarkali","Saree with narrow pallu"],sareeStyle:"Nivi drape — classic pleated pallu over shoulder flatters your shape perfectly.",colorFocus:"Any colour works. Bold solids and patterns both look great."},
  "Full Hourglass":{icon:"⌛",shape:"Balanced proportions · Very defined waist",desc:"Similar to hourglass but with more volume. Celebrate your curves with fitted silhouettes.",tips:["Wrap dresses","V-necks","Belted styles","A-line skirts","Fit & Flare"],avoid:["Boxy oversized tops","Voluminous skirts"],bestStyles:["Wrap Dress","Sheath Dress","Belted Maxi","Saree"],sareeStyle:"Any drape works beautifully. Try Mumtaz or Nivi style.",colorFocus:"Bold solids showcase your curves. Avoid busy prints at the widest points."},
  "Pear":{icon:"🍐",shape:"Hips wider than bust · Smaller upper body",desc:"Draw attention upward with bright tops and detailed necklines. Streamline the lower half.",tips:["A-line skirts","Empire waist tops","Boat necks","Embellished necklines","Dark bottoms"],avoid:["Tight pencil skirts","Bold prints on hips","Skinny bottoms with plain tops"],bestStyles:["A-line Kurta","Empire Waist Maxi","Off-shoulder Top + Dark Palazzo","Anarkali"],sareeStyle:"Saree with broad border work at hem — instead use plain border. Pallu over shoulder adds width at top.",colorFocus:"Bright/bold colours on top, dark solids on bottom."},
  "Apple":{icon:"🍎",shape:"Fuller midsection · Low waist definition",desc:"Create the illusion of a waist with empire cuts and vertical lines. V-necks elongate.",tips:["Empire waist cuts","V-necklines","Flowy tunics","Vertical stripes","A-line hemlines"],avoid:["Belted waists","Clingy fabrics at stomach","Crop tops","Horizontal stripes"],bestStyles:["Empire Waist Maxi","Flowy Anarkali","A-line Kurta","Tunic + Palazzo"],sareeStyle:"Pre-pleated or Gujarati saree style — blouse hem that falls straight rather than tucking.",colorFocus:"Dark monochromatic head-to-toe. Avoid bold prints at mid-section."},
  "Rectangle":{icon:"▭",shape:"Balanced proportions · Minimal waist definition",desc:"Create curves with peplums, ruffles, and belts. Almost everything works on you.",tips:["Peplum tops","Ruffled hems","Belted dresses","Wrap styles","Layered looks"],avoid:["Very straight shift dresses","One-note monotone head to toe"],bestStyles:["Peplum Kurti","Belted Wrap Dress","Fit & Flare","Ruffled Saree Blouse"],sareeStyle:"Any drape style works. Experiment with Gujarati, Mumtaz, or Lehenga-style sarees.",colorFocus:"You can wear anything! Play with colour-blocking and bold prints."},
  "Inverted Triangle":{icon:"🔻",shape:"Broader shoulders · Narrower hips",desc:"Add volume below the waist to create balance. Avoid shoulder details.",tips:["A-line skirts","Wide-leg trousers","Peplum tops","Flared hemlines","Low-rise bottoms"],avoid:["Shoulder pads","Halter necks","Boat necks","Ruffled sleeves","Cap sleeves"],bestStyles:["A-line Skirt Suit","Peplum Kurti","Flared Palazzo","Bell-bottom Salwar"],sareeStyle:"Lots of pleats at bottom. Fabric-heavy drape at hip area adds width below waist.",colorFocus:"Plain/dark on top, bold prints and bright on bottom."},
  "Oval":{icon:"🥚",shape:"Wider midsection · Narrow shoulders & hips",desc:"Create vertical lines and elongate your silhouette. Monochrome outfits work magic.",tips:["V-necks","Vertical patterns","Long cardigans","Empire cuts","Straight-leg trousers"],avoid:["Wide belts","Horizontal stripes","Cropped tops","Stiff fabrics"],bestStyles:["Long A-line Kurta","Straight-cut Palazzo","Empire Maxi","Monochrome Saree"],sareeStyle:"Darker saree with lighter blouse. Keep pallu simple and drape close to body.",colorFocus:"Dark monochrome from top to toe. Add light accent at neckline only."},
}

// ── Dress products ───────────────────────────────────────────────
const PRODUCTS: Record<string,any[]> = {
  Women:[
    {name:"Floral Wrap Dress",body:["Hourglass","Full Hourglass","Rectangle"],colors:["Pastel Pink","Lavender","Blush Rose"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+floral+wrap+dress",flipkart:"https://www.flipkart.com/search?q=women+floral+wrap+dress"},
    {name:"A-Line Ethnic Kurta",body:["Pear","Apple","Rectangle"],colors:["Royal Blue","Mint Green","Coral"],sizes:["S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+a-line+kurta",flipkart:"https://www.flipkart.com/search?q=women+a+line+kurta"},
    {name:"Empire Waist Maxi",body:["Apple","Pear","Oval"],colors:["Lavender","Soft Peach","Mint Green"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+empire+waist+maxi+dress",flipkart:"https://www.flipkart.com/search?q=women+empire+maxi"},
    {name:"Anarkali Suit",body:["Apple","Pear","Rectangle","Oval"],colors:["Deep Burgundy","Cobalt","Jade"],sizes:["S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+anarkali+suit",flipkart:"https://www.flipkart.com/search?q=women+anarkali"},
    {name:"Bodycon Party Dress",body:["Hourglass","Full Hourglass"],colors:["Cobalt","Crimson","Jade"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+bodycon+dress",flipkart:"https://www.flipkart.com/search?q=women+bodycon+dress"},
    {name:"Printed Saree",body:["Pear","Hourglass","Full Hourglass","Apple","Rectangle"],colors:["Royal Blue","Crimson","Mustard"],sizes:["Free Size"],amazon:"https://www.amazon.in/s?k=women+printed+saree",flipkart:"https://www.flipkart.com/search?q=women+printed+saree"},
    {name:"Peplum Kurti",body:["Rectangle","Inverted Triangle"],colors:["Cobalt","Emerald","Fuchsia"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+peplum+kurti",flipkart:"https://www.flipkart.com/search?q=women+peplum+kurti"},
    {name:"Palazzo Set",body:["Pear","Apple","Oval","Rectangle"],colors:["Teal","Mustard","Lavender"],sizes:["S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+palazzo+set",flipkart:"https://www.flipkart.com/search?q=women+palazzo+set"},
    {name:"Straight-Cut Kurti",body:["Oval","Rectangle","Apple"],colors:["Navy","Forest Green","Plum"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+straight+cut+kurti",flipkart:"https://www.flipkart.com/search?q=women+straight+cut+kurti"},
  ],
  Men:[
    {name:"Slim Fit Formal Shirt",body:["Rectangle"],colors:["Royal Blue","Pure White","Cobalt"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=men+slim+fit+shirt",flipkart:"https://www.flipkart.com/search?q=men+formal+shirt"},
    {name:"Structured Blazer",body:["Rectangle"],colors:["Navy","Deep Burgundy","Teal"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=men+structured+blazer",flipkart:"https://www.flipkart.com/search?q=men+blazer"},
    {name:"Kurta Pyjama",body:["Rectangle"],colors:["Pure White","Cobalt"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=men+kurta+pyjama",flipkart:"https://www.flipkart.com/search?q=men+kurta+pyjama"},
  ],
  Kids:[
    {name:"Cotton Frock",body:["Rectangle"],colors:["Pastel Pink","Mint Green"],sizes:["2Y","3Y","4Y"],amazon:"https://www.amazon.in/s?k=kids+frock",flipkart:"https://www.flipkart.com/search?q=kids+frock"},
    {name:"Party Dress",body:["Rectangle"],colors:["Fuchsia","Lavender"],sizes:["4Y","5Y","6Y"],amazon:"https://www.amazon.in/s?k=kids+party+dress",flipkart:"https://www.flipkart.com/search?q=kids+party+dress"},
  ],
}

/* ════════════════════════════════════════════════════════════════
   CSS 3D PHOTO AVATAR — Full user photo spinning 360°
   The WHOLE photo rotates, not just the face on a mannequin!
   ════════════════════════════════════════════════════════════════ */
function PhotoAvatar({ photoUrl, tryOnUrl }: { photoUrl: string|null, tryOnUrl: string|null }) {
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef<number|null>(null)
  const dragStartAngle = useRef(0)
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame>|null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayUrl = tryOnUrl || photoUrl

  const normalizeAngle = (a: number) => ((a % 360) + 360) % 360

  // Drag to rotate
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (spinning) { setSpinning(false); if(rafRef.current) cancelAnimationFrame(rafRef.current) }
    dragStartX.current = e.clientX
    dragStartAngle.current = angle
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [spinning, angle])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStartX.current === null) return
    const delta = (e.clientX - dragStartX.current) * 0.6
    setAngle(normalizeAngle(dragStartAngle.current + delta))
  }, [])

  const handlePointerUp = useCallback(() => {
    dragStartX.current = null
    setIsDragging(false)
  }, [])

  const snapTo = (target: number) => {
    setSpinning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const start = angle
    let diff = normalizeAngle(target - start)
    if (diff > 180) diff -= 360
    let step = 0
    const N = 30
    const tick = () => {
      step++
      const p = step / N
      const eased = p < 0.5 ? 2*p*p : -1+(4-2*p)*p
      setAngle(normalizeAngle(start + diff * eased))
      if (step < N) rafRef.current = requestAnimationFrame(tick)
      else setAngle(normalizeAngle(target))
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const toggleSpin = () => {
    const newSpin = !spinning
    setSpinning(newSpin)
    if (!newSpin && rafRef.current) cancelAnimationFrame(rafRef.current)
  }

  useEffect(() => {
    if (!spinning) return
    const loop = () => {
      setAngle(a => normalizeAngle(a + 1.2))
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [spinning])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // 3D projection: compress width at side views, shift at 45° angles
  const rad = angle * Math.PI / 180
  const cosA = Math.cos(rad)
  const sinA = Math.sin(rad)
  const scaleX = Math.abs(cosA) * 0.85 + 0.15
  const isBack = Math.abs(cosA) < 0   // never negative
  const isMirrored = cosA < 0          // back face = mirror
  const brightness = 0.65 + Math.abs(cosA) * 0.35  // darker at side view

  const viewLabel = (() => {
    const a = normalizeAngle(angle)
    if (a < 22 || a > 338) return 'FRONT'
    if (a < 67) return 'FRONT-R'
    if (a < 112) return 'RIGHT SIDE'
    if (a < 157) return 'BACK-R'
    if (a < 202) return 'BACK'
    if (a < 247) return 'BACK-L'
    if (a < 292) return 'LEFT SIDE'
    return 'FRONT-L'
  })()

  if (!displayUrl) {
    return (
      <div style={{background:'#0a0a1e',borderRadius:16,minHeight:480,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12}}>
        <div style={{fontSize:48}}>👤</div>
        <div style={{color:'#3a3060',fontSize:13}}>Upload photo to see 3D avatar</div>
      </div>
    )
  }

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,userSelect:'none'}}>
      {/* 3D spinning photo */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 60%, #1a0f3a 0%, #04040e 100%)',
          boxShadow: '0 8px 40px rgba(80,40,180,0.3)',
          width: '100%',
          maxWidth: 380,
        }}
      >
        <div style={{
          transition: isDragging ? 'none' : 'transform 0.05s',
          transform: `scaleX(${isMirrored ? -scaleX : scaleX})`,
          filter: `brightness(${brightness})`,
        }}>
          <img
            src={displayUrl}
            alt="avatar"
            draggable={false}
            style={{
              width: '100%',
              display: 'block',
              borderRadius: 14,
              objectFit: 'cover',
              maxHeight: 520,
            }}
          />
        </div>
        {/* Try-on badge */}
        {tryOnUrl && (
          <div style={{position:'absolute',top:10,left:10,background:'rgba(91,33,182,0.9)',color:'#fff',fontSize:9,fontWeight:800,padding:'3px 8px',borderRadius:8,letterSpacing:0.5}}>
            ✨ TRY-ON ACTIVE
          </div>
        )}
        {/* Angle label */}
        <div style={{position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.6)',color:'rgba(180,160,255,0.7)',fontSize:10,padding:'2px 8px',borderRadius:6,whiteSpace:'nowrap'}}>
          {viewLabel} · {Math.round(normalizeAngle(angle))}°
        </div>
        {/* Side-view darkening overlay */}
        {scaleX < 0.5 && (
          <div style={{position:'absolute',inset:0,background:'rgba(4,4,14,0.6)',borderRadius:14,pointerEvents:'none'}} />
        )}
      </div>

      {/* Rotation controls */}
      <div style={{display:'flex',gap:5,flexWrap:'wrap',justifyContent:'center'}}>
        {([['⬆ Front',0],['➡ Right',90],['⬇ Back',180],['⬅ Left',270]] as [string,number][]).map(([lbl,deg]) => (
          <button key={deg} onClick={()=>snapTo(deg)} style={{
            padding:'6px 12px',background:'rgba(26,20,62,0.92)',color:'#c0b0f0',
            border:'1px solid rgba(80,60,160,0.5)',borderRadius:8,cursor:'pointer',
            fontSize:11,fontWeight:700,
          }}>{lbl}</button>
        ))}
        <button onClick={toggleSpin} style={{
          padding:'6px 14px',background:spinning?'#5b21b6':'rgba(26,20,62,0.92)',
          color:spinning?'#fff':'#c0b0f0',border:'1px solid rgba(80,60,160,0.5)',
          borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:700,
        }}>{spinning ? '⏸ Stop' : '▶ Spin'}</button>
      </div>

      {/* Drag hint */}
      <div style={{color:'#2a2050',fontSize:10,textAlign:'center'}}>
        ← Drag to rotate · Scroll buttons to snap →
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   ANALYSIS VIEW — Uses backend y_frac for EXACT line positions
   ════════════════════════════════════════════════════════════════ */
function AnalysisView({ result, photoUrl }: { result: any, photoUrl: string|null }) {
  const m = result
  const bd = BODY_DATA[m.body_type] || BODY_DATA['Rectangle']

  // PRIORITY: use backend measurement_lines (y_frac = exact pixel position)
  // FALLBACK: use Olivia Paisley guide percentages if backend didn't return lines
  const mLines = (m.measurement_lines && m.measurement_lines.length > 0)
    ? m.measurement_lines.map((l: any) => ({
        label: l.label,
        yPct: Math.round(l.y_frac * 100),
        val:  l.val || l.value,
        color: l.color || '#00d4ff',
      }))
    : [
        { label:'BUST',     yPct: 28, val: m.bust_cm,       color:'#00d4ff' },
        { label:'WAIST',    yPct: 40, val: m.waist_cm,      color:'#ffd700' },
        { label:'HIGH HIP', yPct: 50, val: m.high_hip_cm||m.hip_cm, color:'#ff80ff' },
        { label:'LOW HIP',  yPct: 57, val: m.hip_cm,        color:'#a080ff' },
      ]

  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
      {/* Photo with measurement overlays */}
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',background:'#000',minHeight:400}}>
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="analysis"
            style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center',display:'block'}}
          />
        ) : (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:400,color:'#303060',fontSize:14}}>
            Photo not available
          </div>
        )}
        {photoUrl && mLines.map((l, i) => (
          <div key={l.label} style={{
            position:'absolute',
            left:'2%',right:'2%',
            top:`${l.yPct}%`,
            borderTop:`2px solid ${l.color}`,
            display:'flex',justifyContent:'space-between',alignItems:'flex-end',
            pointerEvents:'none',
          }}>
            <span style={{
              fontSize:9,fontWeight:800,color:l.color,
              background:'rgba(0,0,0,0.72)',padding:'1px 5px',
              borderRadius:3,marginTop:-14,letterSpacing:0.6,
            }}>{l.label}</span>
            <span style={{
              fontSize:10,fontWeight:800,color:l.color,
              background:'rgba(0,0,0,0.72)',padding:'1px 6px',
              borderRadius:3,marginTop:-16,
            }}>{typeof l.val === 'number' ? `${l.val.toFixed(0)}cm` : `${l.val}cm`}</span>
          </div>
        ))}
        {/* Size + body type badge */}
        <div style={{position:'absolute',top:10,left:10,background:'rgba(10,6,30,0.90)',border:'1px solid rgba(139,92,246,0.5)',borderRadius:8,padding:'4px 10px',display:'flex',gap:6,alignItems:'center'}}>
          <span style={{color:'#ffd700',fontWeight:800,fontSize:14}}>{m.size}</span>
          <span style={{color:'#8060c0',fontSize:11}}>{bd.icon} {m.body_type}</span>
        </div>
        {/* Method label */}
        {m.method && (
          <div style={{position:'absolute',bottom:8,right:8,background:'rgba(0,0,0,0.6)',color:'rgba(140,120,220,0.7)',fontSize:8,padding:'2px 6px',borderRadius:4}}>
            {m.method} · {m.confidence}%
          </div>
        )}
      </div>

      {/* Body type card + measurements */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <span style={{fontSize:28}}>{bd.icon}</span>
            <div>
              <div style={{color:'#e8c99a',fontWeight:800,fontSize:16}}>{m.body_type}</div>
              <div style={{color:'#4a4070',fontSize:11}}>{bd.shape}</div>
            </div>
          </div>
          <div style={{color:'#5050a0',fontSize:12,lineHeight:1.6,marginBottom:10}}>{bd.desc}</div>
          <div style={{marginBottom:8}}>
            <div style={{color:'#22c55e',fontWeight:700,fontSize:12,marginBottom:5}}>✓ Wear this</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {bd.tips.map(t=><span key={t} style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)',color:'#22c55e',borderRadius:6,padding:'2px 8px',fontSize:11}}>{t}</span>)}
            </div>
          </div>
          <div>
            <div style={{color:'#ef4444',fontWeight:700,fontSize:12,marginBottom:5}}>✗ Avoid</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {bd.avoid.map(t=><span key={t} style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',color:'#ef4444',borderRadius:6,padding:'2px 8px',fontSize:11}}>{t}</span>)}
            </div>
          </div>
        </div>

        {/* Measurements grid */}
        <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
          <div style={{color:'#e8c99a',fontWeight:700,fontSize:12,marginBottom:10}}>📏 Measurements</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6}}>
            {([
              ['Shoulder', m.shoulder_cm, '#80ff80'],
              ['Bust',     m.bust_cm,     '#00d4ff'],
              ['Waist',    m.waist_cm,    '#ffd700'],
              ['High Hip', m.high_hip_cm,'#ff80ff'],
              ['Low Hip',  m.hip_cm,      '#a080ff'],
              ['Height',   m.height_cm,  '#c0c0ff'],
            ] as [string,any,string][]).map(([k,v,c]) => (
              <div key={k} style={{background:'#06061a',border:`1px solid ${c}22`,borderRadius:8,padding:'8px 10px'}}>
                <div style={{color:'#303060',fontSize:9,textTransform:'uppercase',letterSpacing:0.8,marginBottom:2}}>{k}</div>
                <div style={{color:c,fontWeight:800,fontSize:15}}>
                  {v ? parseFloat(v).toFixed(0) : '—'}
                  <span style={{fontSize:9,color:'#303060',marginLeft:2}}>cm</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saree style tip */}
        {bd.sareeStyle && (
          <div style={{background:'#0c0c28',border:'1px solid #251548',borderRadius:12,padding:12}}>
            <div style={{color:'#a78bfa',fontWeight:700,fontSize:11,marginBottom:5}}>🥻 Saree Drape Tip</div>
            <div style={{color:'#4a3880',fontSize:11,lineHeight:1.6}}>{bd.sareeStyle}</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   COLOURS TAB
   ════════════════════════════════════════════════════════════════ */
function ColoursTab({ result }: { result: any }) {
  const st  = result.skin_tone || 'Medium'
  const bt  = result.body_type || 'Rectangle'
  const pal = SKIN_PALETTES[st] || SKIN_PALETTES['Medium']
  const bd  = BODY_DATA[bt]    || BODY_DATA['Rectangle']

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16,display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:pal.hex,border:'3px solid rgba(255,255,255,0.12)',flexShrink:0,boxShadow:`0 4px 16px ${pal.hex}55`}}/>
        <div style={{flex:1}}>
          <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:2}}>{st} Skin Tone</div>
          <div style={{color:'#5050a0',fontSize:12,lineHeight:1.6}}>{pal.tip}</div>
        </div>
      </div>

      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
        <div style={{color:'#22c55e',fontWeight:700,fontSize:13,marginBottom:12}}>✨ Your Best Colours</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:8}}>
          {pal.best.map(c=>(
            <div key={c} style={{display:'flex',alignItems:'center',gap:8,background:'#08081e',border:'1px solid #161640',borderRadius:10,padding:'8px 10px'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:COLOR_HEX[c]||'#888',flexShrink:0,border:'2px solid rgba(255,255,255,0.12)',boxShadow:`0 2px 8px ${COLOR_HEX[c]||'#888'}55`}}/>
              <div>
                <div style={{color:'#c0b0e0',fontSize:11,fontWeight:700}}>{c}</div>
                <div style={{color:'#303060',fontSize:9}}>{COLOR_HEX[c]||''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
        <div style={{color:'#e8c99a',fontWeight:700,fontSize:13,marginBottom:10}}>🤍 Your Neutrals</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {pal.neutrals.map(c=>(
            <div key={c} style={{display:'flex',alignItems:'center',gap:7,background:'#08081e',border:'1px solid #202040',borderRadius:10,padding:'6px 12px'}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:COLOR_HEX[c]||'#aaa',border:'1px solid rgba(255,255,255,0.15)'}}/>
              <span style={{color:'#9080a0',fontSize:12}}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
        <div style={{color:'#ef4444',fontWeight:700,fontSize:12,marginBottom:8}}>✗ Best to Avoid</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {pal.avoid.map(a=><span key={a} style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',color:'#ef4444',borderRadius:6,padding:'3px 10px',fontSize:11}}>{a}</span>)}
        </div>
      </div>

      <div style={{background:'#0c0c28',border:'1px solid #252565',borderRadius:14,padding:14}}>
        <div style={{color:'#e8c99a',fontWeight:700,fontSize:12,marginBottom:6}}>💡 Colour Strategy for {bt}</div>
        <div style={{color:'#5050a0',fontSize:12,lineHeight:1.6}}>{bd.colorFocus}</div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   SHOP TAB
   ════════════════════════════════════════════════════════════════ */
function ShopTab({ result, category, onTryOn }: { result: any, category: string, onTryOn: (name: string) => void }) {
  const bt   = result.body_type
  const size = result.size
  const best = new Set(result.best_colors || [])
  const all  = PRODUCTS[category] || PRODUCTS.Women

  const t1 = all.filter((p:any)=>p.body.includes(bt)&&p.sizes.includes(size)&&p.colors.some((c:string)=>best.has(c)))
  const t2 = all.filter((p:any)=>p.body.includes(bt)&&p.sizes.includes(size)&&!t1.includes(p))
  const t3 = all.filter((p:any)=>p.body.includes(bt)&&!t1.includes(p)&&!t2.includes(p))
  const matched = [...t1,...t2,...t3].length ? [...t1,...t2,...t3] : all

  const bd = BODY_DATA[bt] || BODY_DATA['Rectangle']

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
        <div style={{color:'#e8c99a',fontWeight:800,fontSize:14,marginBottom:6}}>
          🛍 Best Styles for {bt} · Size {size}
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
          {bd.bestStyles.map(s=><span key={s} style={{background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.25)',color:'#a78bfa',borderRadius:8,padding:'3px 10px',fontSize:12}}>{s}</span>)}
        </div>
        <div style={{color:'#4a4070',fontSize:11}}>Showing {matched.length} recommendations</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
        {matched.map((p:any) => {
          const mc = p.colors.filter((c:string)=>best.has(c))
          const showColors = mc.length ? mc : p.colors.slice(0,3)
          const isPerfect = t1.includes(p)
          return (
            <div key={p.name} style={{background:'#0c0c28',border:`1px solid ${isPerfect?'rgba(139,92,246,0.35)':'#1a1840'}`,borderRadius:14,padding:16,position:'relative'}}>
              {isPerfect && <div style={{position:'absolute',top:-8,right:10,background:'#5b21b6',color:'#fff',fontSize:9,fontWeight:800,padding:'2px 8px',borderRadius:10,letterSpacing:0.5}}>PERFECT MATCH</div>}
              <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:6}}>{p.name}</div>
              <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
                {showColors.map((c:string)=>(
                  <span key={c} style={{display:'inline-flex',alignItems:'center',gap:3,background:'#141440',color:'#9080c0',border:'1px solid #202060',borderRadius:8,padding:'2px 7px',fontSize:11}}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:COLOR_HEX[c]||'#888',display:'inline-block',border:'1px solid rgba(255,255,255,0.1)'}}/>
                    {c}
                  </span>
                ))}
              </div>
              <div style={{color:'#252558',fontSize:11,marginBottom:12}}>Sizes: {p.sizes.join(' · ')}</div>
              <div style={{display:'flex',gap:8}}>
                <a href={p.amazon}   target="_blank" rel="noreferrer" style={{flex:1,background:'#ff9900',color:'#000',padding:'8px 0',borderRadius:8,fontWeight:700,fontSize:12,textDecoration:'none',textAlign:'center'}}>🛒 Amazon</a>
                <a href={p.flipkart} target="_blank" rel="noreferrer" style={{flex:1,background:'#2874f0',color:'#fff',padding:'8px 0',borderRadius:8,fontWeight:700,fontSize:12,textDecoration:'none',textAlign:'center'}}>🛒 Flipkart</a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [step,          setStep]         = useState<'upload'|'result'>('upload')
  const [loading,       setLoading]      = useState(false)
  const [error,         setError]        = useState('')
  const [result,        setResult]       = useState<any>(null)
  const [photoUrl,      setPhotoUrl]     = useState<string|null>(null)
  const [preview,       setPreview]      = useState<string|null>(null)
  const [category,      setCategory]     = useState('Women')
  const [userHeight,    setUserHeight]   = useState('')
  const [dressB64,      setDressB64]     = useState<string|null>(null)
  const [dressPreview,  setDressPreview] = useState<string|null>(null)
  const [dressLoading,  setDressLoading] = useState(false)
  const [tryOnUrl,      setTryOnUrl]     = useState<string|null>(null)
  const [activeTab,     setActiveTab]    = useState<'avatar'|'tryon'|'analysis'|'colours'|'shop'>('avatar')
  const [tryOnStatus,   setTryOnStatus]  = useState('')

  const fileRef  = useRef<HTMLInputElement>(null)
  const dressRef = useRef<HTMLInputElement>(null)

  const analyze = async (file: File) => {
    setLoading(true); setError(''); setTryOnUrl(null); setDressB64(null); setDressPreview(null)
    try {
      setPhotoUrl(URL.createObjectURL(file))
      const form = new FormData()
      form.append('file', file)
      form.append('category', category)
      if (userHeight) form.append('user_height', userHeight)

      const res  = await fetch(`${BACKEND_URL}/analyze`, { method: 'POST', body: form })
      const data = await res.json()

      if (data.error) { setError(data.error); setLoading(false); return }
      setResult(data)
      setStep('result')
    } catch(e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const extractDress = async (file: File) => {
    setDressLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch(`${BACKEND_URL}/extract-dress`, { method: 'POST', body: form })
      const data = await res.json()
      if (!data.error && data.dress_b64) {
        setDressB64(data.dress_b64)
        setDressPreview(`data:image/png;base64,${data.dress_b64}`)
        setTryOnUrl(null) // reset previous try-on
      }
    } catch(e: any) {
      console.error('Dress extract failed:', e)
    }
    setDressLoading(false)
  }

  const generateTryOn = async () => {
    if (!photoUrl || !dressB64 || !result) return
    setDressLoading(true)
    setTryOnStatus('⏳ Generating try-on...')
    try {
      const form     = new FormData()
      const photoBlob = await fetch(photoUrl).then(r => r.blob())
      form.append('person_image', photoBlob)
      form.append('dress_b64',    dressB64)
      form.append('measurements', JSON.stringify(result))

      const res  = await fetch(`${BACKEND_URL}/virtual-tryon`, { method: 'POST', body: form })
      const data = await res.json()
      if (data.tryon_b64) {
        setTryOnUrl(`data:image/jpeg;base64,${data.tryon_b64}`)
        setActiveTab('tryon')
        setTryOnStatus('')
      } else {
        setTryOnStatus('❌ Try-on failed — try a different dress image')
      }
    } catch(e: any) {
      setTryOnStatus(`❌ Error: ${e.message}`)
    }
    setDressLoading(false)
  }

  const clearAll = () => {
    setStep('upload'); setResult(null); setPreview(null); setPhotoUrl(null)
    setDressB64(null); setDressPreview(null); setTryOnUrl(null); setTryOnStatus('')
  }

  const tabBtn = (id: string, label: string, active: boolean) => (
    <button onClick={()=>setActiveTab(id as any)} style={{
      padding:'10px 14px',border:'none',cursor:'pointer',fontWeight:700,fontSize:12,
      background:'transparent',
      color:active?'#e8c99a':'#38307a',
      borderBottom:active?'2px solid #e8c99a':'2px solid transparent',
      whiteSpace:'nowrap',transition:'color .15s',
    }}>{label}</button>
  )

  return (
    <main style={{minHeight:'100vh',background:'#06061a',color:'#e8e0ff',fontFamily:'system-ui,sans-serif'}}>

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#160830,#0a0420)',padding:'14px 20px',borderBottom:'1px solid #140d30',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <h1 style={{margin:0,fontSize:'1.3rem',fontWeight:800,color:'#e8c99a'}}>👗 Fashion Stylist Pro v38</h1>
          <p style={{margin:'2px 0 0',color:'#4a3870',fontSize:'0.70rem'}}>
            360° photo avatar · Accurate body analysis · Virtual try-on · AI recommendations
          </p>
        </div>
        {result && (
          <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(20,14,50,0.9)',border:'1px solid #221848',borderRadius:12,padding:'5px 12px'}}>
            <span style={{width:10,height:10,borderRadius:'50%',background:result.skin_hex,border:'1px solid #666',display:'inline-block'}}/>
            <span style={{fontWeight:800,color:'#ffd700',fontSize:14}}>{result.size}</span>
            <span style={{color:'#7060a0',fontSize:11}}>{(BODY_DATA[result.body_type]||BODY_DATA['Rectangle']).icon} {result.body_type}</span>
          </div>
        )}
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'16px 12px'}}>

        {/* ── UPLOAD STEP ─────────────────────────────────── */}
        {step === 'upload' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:16}}>
            <div style={{background:'#0c0c28',border:'1px solid #181840',borderRadius:18,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:4}}>📸 Upload Your Photo</div>
              <div style={{color:'#383068',fontSize:12,marginBottom:14,lineHeight:1.5}}>
                Full-body photo facing camera for best measurements. Your photo becomes the 360° spinning avatar!
              </div>
              {/* Category */}
              <div style={{display:'flex',gap:6,marginBottom:10}}>
                {['Women','Men','Kids'].map(c=>(
                  <button key={c} onClick={()=>setCategory(c)} style={{
                    flex:1,padding:'8px 0',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12,
                    border:`1px solid ${category===c?'#6030c0':'#181840'}`,
                    background:category===c?'#22166a':'#090920',
                    color:category===c?'#e8c99a':'#362870',
                  }}>{c}</button>
                ))}
              </div>
              {/* Height input */}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,background:'#08081e',borderRadius:10,padding:'9px 12px',border:'1px solid #141440'}}>
                <span>📏</span>
                <span style={{color:'#383060',fontSize:12}}>Height (optional but improves accuracy)</span>
                <input type="number" value={userHeight} onChange={e=>setUserHeight(e.target.value)}
                  placeholder="162" min="80" max="220"
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#e8e0ff',fontSize:14,fontWeight:700,minWidth:0}}/>
                <span style={{color:'#282850',fontSize:12}}>cm</span>
              </div>
              {/* Drop zone */}
              <div onClick={()=>fileRef.current?.click()} style={{
                border:`2px dashed ${preview?'#4030a0':'#161638'}`,
                borderRadius:14,cursor:'pointer',background:'#080818',textAlign:'center',
                minHeight:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,
                padding:preview?6:28,
              }}>
                {preview
                  ? <img src={preview} alt="preview" style={{maxHeight:260,borderRadius:10,objectFit:'contain'}}/>
                  : <><div style={{fontSize:56}}>📷</div><div style={{color:'#3a2c80',fontSize:13,fontWeight:700}}>Tap to choose photo</div><div style={{color:'#20185a',fontSize:11}}>Full body preferred</div></>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e=>{const f=e.target.files?.[0];if(f){setPreview(URL.createObjectURL(f));analyze(f)}}}/>
              {loading && (
                <div style={{marginTop:12,padding:'12px 14px',background:'#120a30',border:'1px solid #301870',borderRadius:10,textAlign:'center'}}>
                  <div style={{color:'#8060d0',fontWeight:700,fontSize:13}}>⏳ Analysing your photo...</div>
                  <div style={{color:'#3a2870',fontSize:11,marginTop:4}}>YOLO pose detection → 4-zone measurement → body type classification</div>
                </div>
              )}
              {error && <div style={{marginTop:12,padding:'10px 14px',background:'#1e0606',border:'1px solid #500',borderRadius:8,color:'#ff6060',fontSize:12}}>❌ {error}</div>}
            </div>

            <div style={{background:'#0c0c28',border:'1px solid #141440',borderRadius:18,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:14}}>✨ What You Get</div>
              {([
                ['🔄','360° spinning avatar — YOUR FULL PHOTO rotates, drag to turn'],
                ['📊','Accurate analysis — YOLO/PyTorch pose + 4-zone measurement'],
                ['📏','Exact measurement lines — placed at actual body positions'],
                ['👗','Virtual try-on — upload a NEW dress, not your current one'],
                ['🎨','Color palette — matched to your skin tone and body type'],
                ['🛍','Smart recommendations — perfect-match dresses for you'],
              ] as [string,string][]).map(([icon,text])=>(
                <div key={text} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:13}}>
                  <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
                  <span style={{color:'#4a3880',fontSize:13,lineHeight:1.5}}>{text}</span>
                </div>
              ))}
              <div style={{marginTop:16,padding:'10px 14px',background:'#06061a',border:'1px solid #1a1030',borderRadius:10}}>
                <div style={{color:'#6050a0',fontSize:11,lineHeight:1.7}}>
                  💡 <b style={{color:'#8070c0'}}>Tip for try-on:</b> Upload a clean dress/outfit photo (like a product photo) separately. The system removes the background and applies it to your body photo. Do NOT use the same photo — upload a different dress!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT STEP ─────────────────────────────────── */}
        {step === 'result' && result && (
          <div>
            {/* Tab bar */}
            <div style={{display:'flex',borderBottom:'1px solid #141440',marginBottom:16,overflowX:'auto',gap:0}}>
              {tabBtn('avatar',   '🔄 3D Avatar',    activeTab==='avatar')}
              {tabBtn('tryon',    '👗 Try-On',       activeTab==='tryon')}
              {tabBtn('analysis', '📊 Analysis',     activeTab==='analysis')}
              {tabBtn('colours',  '🎨 Colours',      activeTab==='colours')}
              {tabBtn('shop',     '🛍 Shop',         activeTab==='shop')}
              <button onClick={clearAll} style={{marginLeft:'auto',padding:'7px 13px',background:'#110d30',color:'#3a2870',border:'1px solid #1a1640',borderRadius:8,cursor:'pointer',fontSize:12,flexShrink:0}}>
                📸 New Photo
              </button>
            </div>

            {/* ── 3D AVATAR TAB ── */}
            {activeTab === 'avatar' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:16,alignItems:'start'}}>
                <PhotoAvatar photoUrl={photoUrl} tryOnUrl={tryOnUrl} />
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {/* Upload dress */}
                  <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:16,padding:18}}>
                    <div style={{color:'#e8c99a',fontWeight:800,marginBottom:4}}>👗 Upload a Dress to Try On</div>
                    <div style={{color:'#3a2e70',fontSize:12,marginBottom:4,lineHeight:1.5}}>
                      Upload a <b style={{color:'#6050a0'}}>different dress image</b> (product photo works best). The system will apply it to your body photo.
                    </div>
                    <div style={{color:'#ff8060',fontSize:11,marginBottom:12}}>
                      ⚠️ Don't upload your own photo — upload a dress/outfit you want to try!
                    </div>
                    <div onClick={()=>dressRef.current?.click()} style={{
                      border:'2px dashed #161640',borderRadius:12,padding:14,cursor:'pointer',
                      background:'#080818',textAlign:'center',minHeight:120,
                      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,
                    }}>
                      {dressPreview
                        ? <img src={dressPreview} alt="dress" style={{maxHeight:120,borderRadius:8,objectFit:'contain'}}/>
                        : <><span style={{fontSize:36}}>👗</span><span style={{color:'#2e2860',fontSize:12}}>Upload dress photo</span><span style={{color:'#1a1640',fontSize:10}}>PNG/JPG · Product photo preferred</span></>
                      }
                    </div>
                    <input ref={dressRef} type="file" accept="image/*" style={{display:'none'}}
                      onChange={e=>{const f=e.target.files?.[0];if(f)extractDress(f)}}/>
                    {dressLoading && <div style={{marginTop:8,color:'#6050c0',fontSize:12,textAlign:'center'}}>⏳ Processing dress...</div>}
                    {tryOnStatus && <div style={{marginTop:8,color:'#ff8060',fontSize:12,textAlign:'center'}}>{tryOnStatus}</div>}
                    {dressB64 && !dressLoading && (
                      <button onClick={generateTryOn} style={{
                        marginTop:10,width:'100%',
                        background:'linear-gradient(135deg,#4018a0,#7030c0)',
                        color:'#fff',border:'none',padding:'11px',borderRadius:8,
                        cursor:'pointer',fontSize:13,fontWeight:700,
                      }}>
                        ✨ Generate Photo Try-On
                      </button>
                    )}
                    {tryOnUrl && (
                      <button onClick={()=>setTryOnUrl(null)} style={{marginTop:8,width:'100%',background:'#120818',color:'#903080',border:'1px solid #280c26',padding:'8px',borderRadius:8,cursor:'pointer',fontSize:12}}>
                        🔄 Remove try-on overlay
                      </button>
                    )}
                  </div>
                  {/* Quick stats */}
                  <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10,flexWrap:'wrap'}}>
                      <span style={{fontSize:22}}>{(BODY_DATA[result.body_type]||BODY_DATA['Rectangle']).icon}</span>
                      <span style={{color:'#e8c99a',fontWeight:800,fontSize:14}}>{result.body_type}</span>
                      <span style={{background:'#2e1578',color:'#ffd700',padding:'3px 12px',borderRadius:8,fontWeight:800,fontSize:13}}>{result.size}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5}}>
                      {([['Bust',result.bust_cm],['Waist',result.waist_cm],['Hip',result.hip_cm],['Height',result.height_cm]] as [string,any][]).map(([k,v])=>(
                        <div key={k} style={{background:'#06061a',border:'1px solid #101038',borderRadius:7,padding:'6px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{color:'#28285a',fontSize:10,textTransform:'uppercase'}}>{k}</span>
                          <span style={{color:'#c0b8e8',fontWeight:800,fontSize:12}}>{v ? parseFloat(v).toFixed(0) : '—'}<span style={{fontSize:9,color:'#303060',marginLeft:1}}>cm</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TRY-ON TAB ── */}
            {activeTab === 'tryon' && (
              <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center'}}>
                {tryOnUrl ? (
                  <>
                    <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:16,padding:16,maxWidth:600,width:'100%'}}>
                      <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:12}}>✨ Photo Virtual Try-On Result</div>
                      <img src={tryOnUrl} alt="try-on result" style={{width:'100%',borderRadius:12,display:'block'}}/>
                      <div style={{color:'#4a4070',fontSize:12,marginTop:10,textAlign:'center'}}>
                        Dress warped to your body pose · Lighting matched · Feathered edges
                      </div>
                    </div>
                    <div style={{display:'flex',gap:10}}>
                      <button onClick={()=>{setTryOnUrl(null);setActiveTab('avatar')}} style={{background:'#110d30',color:'#6050a0',border:'1px solid #1a1640',padding:'10px 18px',borderRadius:10,cursor:'pointer',fontSize:13}}>
                        Upload Different Dress
                      </button>
                      <a href={tryOnUrl} download="tryon.jpg" style={{background:'linear-gradient(135deg,#1a4020,#2a6030)',color:'#80ff80',border:'none',padding:'10px 18px',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:700,textDecoration:'none',display:'inline-block'}}>
                        ⬇ Download
                      </a>
                    </div>
                  </>
                ) : (
                  <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:16,padding:32,textAlign:'center',maxWidth:500}}>
                    <div style={{fontSize:56,marginBottom:12}}>👗</div>
                    <div style={{color:'#e8c99a',fontWeight:700,fontSize:16,marginBottom:8}}>No Try-On Generated Yet</div>
                    <div style={{color:'#4a4070',fontSize:13,marginBottom:16,lineHeight:1.6}}>
                      Go to the <b style={{color:'#8060c0'}}>3D Avatar</b> tab, upload a dress photo, then click "Generate Photo Try-On".
                    </div>
                    <button onClick={()=>setActiveTab('avatar')} style={{background:'linear-gradient(135deg,#4018a0,#7030c0)',color:'#fff',border:'none',padding:'10px 24px',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:700}}>
                      Go to 3D Avatar
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analysis' && photoUrl && <AnalysisView result={result} photoUrl={photoUrl} />}
            {activeTab === 'colours' && <ColoursTab result={result} />}
            {activeTab === 'shop'    && <ShopTab result={result} category={category} onTryOn={()=>setActiveTab('avatar')} />}
          </div>
        )}
      </div>
    </main>
  )
}
