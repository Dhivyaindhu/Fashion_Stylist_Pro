'use client'
import { useState, useRef } from 'react'

/* ════════════════════════════════════════════════════════════════════
   Fashion Stylist Pro v35 — Professional Photo Try-On
   ── Measurement overlay: BUST / WAIST / HIGH HIP / LOW HIP
   ── Professional photo-realistic try-on
   ── Olivia Paisley style guide
   ════════════════════════════════════════════════════════════════════ */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://indhu321-fashion-stylist-app.hf.space'

// ── DATA ──────────────────────────────────────────────────────────────────────
const COLOR_HEX: Record<string,string> = {
  "Pastel Pink":"#FFD1DC","Lavender":"#E6D0FF","Mint Green":"#AAFFDD","Sky Blue":"#87CEEB",
  "Blush Rose":"#FFB6C1","Butter Yellow":"#FFFACD","Soft Peach":"#FFDAB9","Warm Coral":"#FF7F50",
  "Dusty Mauve":"#C09090","Champagne":"#F7E7CE","Terracotta":"#E07050","Royal Blue":"#4169E1",
  "Emerald":"#50C878","Mustard":"#FFDB58","Teal":"#008080","Cobalt":"#0047AB",
  "Deep Burgundy":"#800020","Fuchsia":"#FF00FF","Crimson":"#DC143C","Navy":"#001F5B",
  "Pure White":"#FFFFFF","Bright Gold":"#FFD700","Hot Pink":"#FF69B4","Coral":"#FF6B6B",
}

const SKIN_PALETTES: Record<string,{best:string[],avoid:string[],hex:string,tip:string}> = {
  Fair:  {hex:'#f5d5c8',best:["Pastel Pink","Lavender","Mint Green","Sky Blue","Blush Rose"],avoid:["Pure White","Neon"],tip:"Soft muted tones complement fair skin beautifully."},
  Light: {hex:'#ebbfa0',best:["Warm Coral","Dusty Mauve","Champagne","Sky Blue","Terracotta"],avoid:["Pale pastels that wash out"],tip:"Warm earth tones make light skin glow."},
  Medium:{hex:'#c8956c',best:["Royal Blue","Emerald","Mustard","Teal","Cobalt","Coral"],avoid:["Muddy browns"],tip:"Bold jewel tones create stunning contrast."},
  Tan:   {hex:'#a0694a',best:["Cobalt","Deep Burgundy","Fuchsia","Crimson","Navy"],avoid:["Dull khaki","Pale yellows"],tip:"Rich saturated colors illuminate tan skin."},
  Deep:  {hex:'#5c2e10',best:["Pure White","Bright Gold","Cobalt","Fuchsia","Hot Pink"],avoid:["Dark muddy tones"],tip:"High-contrast colors are stunning on deep skin."},
}

const BODY_DATA: Record<string,{icon:string,shape:string,desc:string,tips:string[],avoid:string[]}> = {
  "Hourglass":         {icon:"⌛",shape:"Balanced shoulders & hips · Defined waist",desc:"Your proportions are naturally balanced — nearly any style flatters you.",tips:["Wrap dresses","Bodycon","Belted styles","High-waisted bottoms"],avoid:["Shapeless sacks","Drop-waist styles"]},
  "Full Hourglass":    {icon:"💎",shape:"Curvaceous balanced proportions",desc:"Beautifully proportioned curves.",tips:["Wrap dresses","V-neck tops","Fitted dresses"],avoid:["Oversized boxy cuts"]},
  "Pear":              {icon:"🍐",shape:"Hips wider than bust",desc:"Balance by drawing attention upward with bright or bold tops.",tips:["A-line skirts","Empire waist","Boat necks","Dark bottoms"],avoid:["Tight pencil skirts","Hip embellishments"]},
  "Apple":             {icon:"🍎",shape:"Fuller midsection",desc:"Create the illusion of a waist with empire cuts and vertical lines.",tips:["Empire waist","V-necklines","A-line dresses","Vertical stripes"],avoid:["Crop tops","Tight waistbands"]},
  "Rectangle":         {icon:"▭",shape:"Balanced proportions · Minimal waist definition",desc:"Create curves with peplums, ruffles, and belts. Almost everything works on you.",tips:["Peplum tops","Ruffled hems","Belted dresses","Wrap styles","Layered looks"],avoid:["Very straight shift dresses","One-note monotone head to toe"]},
  "Inverted Triangle": {icon:"🔻",shape:"Broader shoulders, narrower hips",desc:"Add volume below the waist to create balance.",tips:["A-line skirts","Wide-leg trousers","Peplum tops","Flared hems"],avoid:["Shoulder pads","Boat necklines","Halter necks"]},
  "Oval":              {icon:"🥚",shape:"Fuller bust and midsection",desc:"Elongate and streamline with strategic styling.",tips:["Empire waist","V-necks","Dark vertical stripes","Wrap tops"],avoid:["Belted waists","Crop tops"]},
}

const PRODUCTS: Record<string,any[]> = {
  Women:[
    {name:"Floral Wrap Dress",body:["Hourglass","Full Hourglass","Rectangle"],colors:["Pastel Pink","Lavender"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+wrap+dress",flipkart:"https://www.flipkart.com/search?q=wrap+dress"},
    {name:"A-Line Kurta",      body:["Pear","Apple"],                           colors:["Royal Blue","Mint Green"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=aline+kurta",flipkart:"https://www.flipkart.com/search?q=aline+kurta"},
    {name:"Bodycon Dress",     body:["Hourglass","Full Hourglass"],             colors:["Cobalt","Crimson"],sizes:["XS","S","M","L"],amazon:"https://www.amazon.in/s?k=bodycon+dress",flipkart:"https://www.flipkart.com/search?q=bodycon"},
    {name:"Empire Maxi",       body:["Apple","Pear","Oval"],                    colors:["Lavender","Soft Peach"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=empire+maxi",flipkart:"https://www.flipkart.com/search?q=empire+maxi"},
    {name:"Anarkali Suit",     body:["Apple","Rectangle","Oval"],               colors:["Deep Burgundy","Cobalt"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=anarkali+suit",flipkart:"https://www.flipkart.com/search?q=anarkali"},
    {name:"Printed Saree",     body:["Pear","Hourglass","Full Hourglass"],      colors:["Royal Blue","Mustard"],sizes:["Free Size"],amazon:"https://www.amazon.in/s?k=printed+saree",flipkart:"https://www.flipkart.com/search?q=saree"},
  ],
  Men:[
    {name:"Formal Shirt",body:["Rectangle"],colors:["Royal Blue","Pure White"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=men+formal+shirt",flipkart:"https://www.flipkart.com/search?q=formal+shirt"},
    {name:"Blazer",      body:["Rectangle"],colors:["Navy","Deep Burgundy"],   sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=men+blazer",flipkart:"https://www.flipkart.com/search?q=blazer"},
  ],
  Kids:[
    {name:"Cotton Frock",body:["Rectangle"],colors:["Pastel Pink"],sizes:["2Y","3Y","4Y","5Y"],amazon:"https://www.amazon.in/s?k=kids+frock",flipkart:"https://www.flipkart.com/search?q=frock"},
  ],
}

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface MeasurementLine { label:string; y_frac:number; val:number; color:string }
interface AnalysisResult {
  size:string; body_type:string; skin_tone:string; skin_hex:string;
  method:string; confidence:number; category:string;
  height_cm:number; shoulder_cm:number; bust_cm:number; waist_cm:number;
  high_hip_cm:number; hip_cm:number; inseam_cm:number;
  measurement_lines:MeasurementLine[];
  best_colors:string[]; avoid_colors:string[]; style_tips:string[];
  body_icon:string; body_desc:string; vis_jpeg_b64:string;
  morph?:any;
}

function lighten(hex:string,f:number){
  const h=hex.replace('#','')
  return '#'+[0,2,4].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(h.slice(i,i+2),16)*f))).toString(16).padStart(2,'0')).join('')
}

// ══════════════════════════════════════════════════════════════════════
// ANALYSIS VIEW  —  Olivia Paisley style measurement overlay
// ══════════════════════════════════════════════════════════════════════
function AnalysisView({result,photoUrl}:{result:AnalysisResult,photoUrl:string|null}){
  const bd = BODY_DATA[result.body_type] || BODY_DATA['Rectangle']
  const lines: MeasurementLine[] = result.measurement_lines?.length
    ? result.measurement_lines
    : [
        {label:"BUST",     y_frac:.30,val:result.bust_cm,    color:"#00d4ff"},
        {label:"WAIST",    y_frac:.46,val:result.waist_cm,   color:"#ffd700"},
        {label:"HIGH HIP", y_frac:.55,val:result.high_hip_cm,color:"#ff80ff"},
        {label:"LOW HIP",  y_frac:.63,val:result.hip_cm,     color:"#a080ff"},
      ]

  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
      {/* ── Photo with measurement overlay ── */}
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',background:'#000',minHeight:420}}>
        {photoUrl
          ? <img src={photoUrl} alt="analysis"
              style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top center',display:'block'}}/>
          : <div style={{height:420,display:'flex',alignItems:'center',justifyContent:'center',color:'#303060'}}>Photo unavailable</div>
        }
        {photoUrl && lines.map(l=>(
          <div key={l.label} style={{
            position:'absolute',left:'3%',right:'3%',
            top:`${(l.y_frac*100).toFixed(1)}%`,
            borderTop:`2px solid ${l.color}`,
            display:'flex',justifyContent:'space-between',alignItems:'flex-end',
            pointerEvents:'none',transform:'translateY(-1px)'
          }}>
            <span style={{fontSize:9,fontWeight:800,color:l.color,
              background:'rgba(0,0,0,0.72)',padding:'2px 6px',borderRadius:4,marginTop:-16,letterSpacing:.5}}>
              {l.label}
            </span>
            <span style={{fontSize:10,fontWeight:800,color:l.color,
              background:'rgba(0,0,0,0.72)',padding:'2px 8px',borderRadius:4,marginTop:-16}}>
              {(l.val||0).toFixed(0)}cm
            </span>
          </div>
        ))}
        {/* Size badge */}
        <div style={{position:'absolute',top:10,left:10,background:'rgba(8,4,24,0.90)',
          border:'1px solid rgba(139,92,246,.5)',borderRadius:8,padding:'5px 12px',display:'flex',gap:8,alignItems:'center'}}>
          <span style={{color:'#ffd700',fontWeight:800,fontSize:15}}>{result.size}</span>
          <span style={{color:'#8060c0',fontSize:12}}>{bd.icon} {result.body_type}</span>
        </div>
        {/* Method badge */}
        <div style={{position:'absolute',bottom:10,right:10,background:'rgba(8,4,24,0.80)',
          border:'1px solid #161640',borderRadius:6,padding:'3px 8px'}}>
          <span style={{color:'#4a3870',fontSize:10}}>{result.method}</span>
        </div>
      </div>

      {/* ── Measurements + Style ── */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {/* Body type card */}
        <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
            <span style={{fontSize:30}}>{bd.icon}</span>
            <div>
              <div style={{color:'#e8c99a',fontWeight:800,fontSize:16}}>{result.body_type}</div>
              <div style={{color:'#4a4070',fontSize:11}}>{bd.shape}</div>
            </div>
          </div>
          <p style={{color:'#5050a0',fontSize:12,lineHeight:1.7,marginBottom:12}}>{bd.desc}</p>
          <div style={{marginBottom:10}}>
            <div style={{color:'#22c55e',fontWeight:700,fontSize:12,marginBottom:6}}>✓ Wear this</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {bd.tips.map(t=>(
                <span key={t} style={{background:'rgba(34,197,94,.08)',border:'1px solid rgba(34,197,94,.22)',
                  color:'#22c55e',borderRadius:6,padding:'3px 9px',fontSize:11}}>{t}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={{color:'#ef4444',fontWeight:700,fontSize:12,marginBottom:6}}>✗ Avoid</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {bd.avoid.map(t=>(
                <span key={t} style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',
                  color:'#ef4444',borderRadius:6,padding:'3px 9px',fontSize:11}}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Measurement grid — Olivia Paisley style */}
        <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
          <div style={{color:'#e8c99a',fontWeight:700,fontSize:13,marginBottom:12}}>📏 Your Measurements</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {([
              ['SHOULDER', result.shoulder_cm,  '#80ff80'],
              ['BUST',     result.bust_cm,       '#00d4ff'],
              ['WAIST',    result.waist_cm,      '#ffd700'],
              ['HIGH HIP', result.high_hip_cm,   '#ff80ff'],
              ['LOW HIP',  result.hip_cm,        '#a080ff'],
              ['HEIGHT',   result.height_cm,     '#c0c0ff'],
              ['INSEAM',   result.inseam_cm,     '#a0c0ff'],
            ] as [string,number,string][]).map(([k,v,c])=>(
              <div key={k} style={{background:'#06061a',border:`1px solid ${c}22`,borderRadius:8,padding:'8px 10px'}}>
                <div style={{color:'#303060',fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>{k}</div>
                <div style={{color:c,fontWeight:800,fontSize:16}}>
                  {(v||0).toFixed(0)}<span style={{fontSize:9,color:'#303060',marginLeft:1}}>cm</span>
                </div>
              </div>
            ))}
            <div style={{background:'#06061a',border:'1px solid #ffd70022',borderRadius:8,padding:'8px 10px'}}>
              <div style={{color:'#303060',fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.5}}>SIZE</div>
              <div style={{color:'#ffd700',fontWeight:800,fontSize:22}}>{result.size}</div>
            </div>
          </div>
          <div style={{marginTop:10,padding:'8px 10px',background:'#08081e',borderRadius:8,
            border:'1px solid #161640',color:'#3a2e6a',fontSize:11}}>
            📊 {result.method} · {result.confidence}% confidence
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// 3D AVATAR (SVG-based, real face extracted)
// ══════════════════════════════════════════════════════════════════════
function buildAvatar(result:AnalysisResult,dressB64:string|null,faceB64:string|null):string{
  const skin=result.skin_hex||'#c8956c', skinTone=result.skin_tone||'Medium'
  const CX=210,W=420,H=700,SC=4.6
  const hw=(c:number)=>Math.max(10,Math.round((c/(2*Math.PI))*SC))
  const sh_w=Math.max(hw((result.shoulder_cm||40)*1.05),50)
  const bu_w=hw(result.bust_cm||88),wa_w=hw(result.waist_cm||72)
  const hh_w=hw(result.high_hip_cm||90),hi_w=hw(result.hip_cm||94)
  const th_w=Math.round(hi_w*.68),ca_w=Math.round(hi_w*.37)
  const arm_w=Math.max(13,Math.round(sh_w*.28)),nw=Math.max(12,Math.round(sh_w*.26))
  const y_sh=222,y_bu=y_sh+68,y_wa=y_bu+58,y_hh=y_wa+36,y_hi=y_hh+28
  const y_th=y_hi+76,y_kn=y_th+58,y_ca=y_kn+50,y_ft=y_ca+44
  const y_nek=y_sh-22,y_hcy=y_nek-78,FR=68
  const skin_sh=lighten(skin,.62),skin_hi=lighten(skin,1.26),skin_mid=lighten(skin,.80),skin_drk=lighten(skin,.46)
  const faceUrl=faceB64?`data:image/jpeg;base64,${faceB64}`:`https://api.dicebear.com/9.x/personas/svg?seed=${skinTone}&backgroundColor=transparent&scale=110`

  function bp(sw:number,bw:number,ww:number,hhw:number,hiw:number,tw:number,cw:number,sh:number){
    const L=(v:number)=>CX-v+sh,R=(v:number)=>CX+v+sh
    return`M ${L(sw)},${y_sh} C ${L(sw+10)},${y_sh+22} ${L(bw+6)},${y_bu-18} ${L(bw)},${y_bu} C ${L(bw-7)},${y_bu+26} ${L(ww+4)},${y_wa-14} ${L(ww)},${y_wa} C ${L(ww+4)},${y_wa+16} ${L(hhw-3)},${y_hh-10} ${L(hhw)},${y_hh} C ${L(hhw+2)},${y_hh+14} ${L(hiw-2)},${y_hi-8} ${L(hiw)},${y_hi} C ${L(hiw-2)},${y_hi+26} ${L(tw+4)},${y_th-10} ${L(tw)},${y_th} C ${L(tw-2)},${y_th+20} ${L(cw+2)},${y_kn-8} ${L(cw)},${y_kn} C ${L(cw)},${y_kn+24} ${L(cw-2)},${y_ca-5} ${L(cw-2)},${y_ca} C ${L(cw-2)},${y_ca+16} ${L(cw)},${y_ft-4} ${L(cw+2)},${y_ft} L ${R(cw+2)},${y_ft} C ${R(cw)},${y_ft-4} ${R(cw-2)},${y_ca+16} ${R(cw-2)},${y_ca} C ${R(cw-2)},${y_ca-5} ${R(cw)},${y_kn+24} ${R(cw)},${y_kn} C ${R(cw+2)},${y_kn-8} ${R(tw-2)},${y_th+20} ${R(tw)},${y_th} C ${R(tw+4)},${y_th-10} ${R(hiw-2)},${y_hi+26} ${R(hiw)},${y_hi} C ${R(hiw+2)},${y_hi-8} ${R(hhw+2)},${y_hh+14} ${R(hhw)},${y_hh} C ${R(hhw-3)},${y_hh-10} ${R(ww+4)},${y_wa+16} ${R(ww)},${y_wa} C ${R(ww+4)},${y_wa-14} ${R(bw-7)},${y_bu+26} ${R(bw)},${y_bu} C ${R(bw+6)},${y_bu-18} ${R(sw+10)},${y_sh+22} ${R(sw)},${y_sh} Z`
  }
  function dp(sw:number,bw:number,ww:number,hhw:number,hiw:number,sh:number){
    const sw2=sw+22,bw2=bw+16,ww2=ww+8,hhw2=hhw+10,hiw2=hiw+12
    const L=(v:number)=>CX-v+sh,R=(v:number)=>CX+v+sh
    return`M ${L(sw2)},${y_sh} C ${L(sw2+10)},${y_sh+22} ${L(bw2+6)},${y_bu-18} ${L(bw2)},${y_bu} C ${L(bw2-7)},${y_bu+26} ${L(ww2+4)},${y_wa-14} ${L(ww2)},${y_wa} C ${L(ww2+4)},${y_wa+20} ${L(hhw2-2)},${y_hh-10} ${L(hhw2)},${y_hh} C ${L(hhw2+2)},${y_hh+22} ${L(hiw2+2)},${y_ft-12} ${L(hiw2-2)},${y_ft} L ${R(hiw2-2)},${y_ft} C ${R(hiw2+2)},${y_ft-12} ${R(hhw2+2)},${y_hh+22} ${R(hhw2)},${y_hh} C ${R(hhw2-2)},${y_hh-10} ${R(ww2+4)},${y_wa+20} ${R(ww2)},${y_wa} C ${R(ww2+4)},${y_wa-14} ${R(bw2-7)},${y_bu+26} ${R(bw2)},${y_bu} C ${R(bw2+6)},${y_bu-18} ${R(sw2+10)},${y_sh+22} ${R(sw2)},${y_sh} Z`
  }
  function ap(s:number,sw:number,sh:number){
    const ax=CX+s*sw+sh,ay=y_sh+10,ex=CX+s*(sw+28)+sh,ey=y_sh+106,hx=CX+s*(sw+10)+sh,hy=y_sh+208
    return`M ${ax},${ay} C ${ax+s*16},${ay+26} ${ex-s*6},${ey-24} ${ex},${ey} C ${ex+s*4},${ey+32} ${hx+s*10},${hy-32} ${hx},${hy}`
  }
  function nkP(nn:number,sh:number){
    return`M ${CX-nn+sh},${y_nek+4} C ${CX-nn+2+sh},${y_nek+14} ${CX-nn+2+sh},${y_sh-6} ${CX-nn+3+sh},${y_sh} L ${CX+nn-3+sh},${y_sh} C ${CX+nn-2+sh},${y_sh-6} ${CX+nn-2+sh},${y_nek+14} ${CX+nn+sh},${y_nek+4} Z`
  }

  const iBd=bp(sh_w,bu_w,wa_w,hh_w,hi_w,th_w,ca_w,0)
  const iDr=dp(sh_w,bu_w,wa_w,hh_w,hi_w,0)
  const iLa=ap(-1,sh_w,0),iRa=ap(1,sh_w,0),iNk=nkP(nw,0)
  const dW=(Math.max(sh_w,hi_w)+36)*2,dH=y_ft-y_sh+30
  const ah=Math.round(arm_w/2)

  return`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{margin:0;padding:0}body{background:radial-gradient(#141030,#050510);display:flex;flex-direction:column;align-items:center;padding:10px;font-family:system-ui}svg{cursor:grab;touch-action:none}.cb{background:#1a143e;color:#c0b0f0;border:1px solid #503ca0;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700}.cb:hover{background:#3a2d80}.cb.on{background:#5b21b6;border-color:#8b5cf6}</style></head><body>
<svg id="av" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px">
<defs>
<radialGradient id="bg" cx="50%" cy="48%" r="66%"><stop offset="0%" stop-color="#181040"/><stop offset="100%" stop-color="#040410"/></radialGradient>
<linearGradient id="bG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${skin_drk}"/><stop offset="25%" stop-color="${skin_sh}"/><stop offset="52%" stop-color="${skin_hi}"/><stop offset="75%" stop-color="${skin}"/><stop offset="100%" stop-color="${skin_drk}"/></linearGradient>
<radialGradient id="hG" cx="42%" cy="38%" r="60%"><stop offset="0%" stop-color="${skin_hi}"/><stop offset="55%" stop-color="${skin}"/><stop offset="100%" stop-color="${skin_sh}"/></radialGradient>
<filter id="ds"><feDropShadow dx="2" dy="6" stdDeviation="6" flood-opacity=".30"/></filter>
<radialGradient id="grd" cx="40%" cy="30%" r="65%"><stop offset="0%" stop-color="rgba(255,255,255,0.12)"/><stop offset="100%" stop-color="rgba(0,0,0,0)"/></radialGradient>
${dressB64?`<clipPath id="dCl"><path id="dClP" d="${iDr}"/></clipPath>
<radialGradient id="clothShadow" cx="50%" cy="40%" r="60%"><stop offset="40%" stop-color="transparent"/><stop offset="100%" stop-color="rgba(0,0,0,0.28)"/></radialGradient>
<linearGradient id="clothShine" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="28%" stop-color="rgba(255,255,255,0.05)"/><stop offset="52%" stop-color="rgba(255,255,255,0.13)"/><stop offset="72%" stop-color="rgba(255,255,255,0.05)"/></linearGradient>
<filter id="dBlur"><feGaussianBlur stdDeviation="5"/></filter>`:''}
<clipPath id="fCl"><circle id="fClC" cx="${CX}" cy="${y_hcy}" r="${FR}"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<path id="la" d="${iLa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round"/>
<ellipse id="lh" cx="${CX-sh_w-10}" cy="${y_sh+210}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>
<path id="ra" d="${iRa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round"/>
<ellipse id="rh" cx="${CX+sh_w+10}" cy="${y_sh+210}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>
<path id="body" d="${iBd}" fill="url(#bG)" filter="url(#ds)"/>
<path id="bodyShine" d="${iBd}" fill="url(#grd)" opacity="0.6"/>
${dressB64?`
<path id="dShadow" d="${iDr}" fill="rgba(0,0,0,0.14)" transform="translate(4,8)" filter="url(#dBlur)"/>
<image id="dImg" href="data:image/png;base64,${dressB64}" x="${CX-dW/2}" y="${y_sh-4}" width="${dW}" height="${dH+8}" clip-path="url(#dCl)" preserveAspectRatio="xMidYMin meet" opacity="0.97"/>
<path id="dEdge" d="${iDr}" fill="url(#clothShadow)" opacity="0.55"/>
<path id="dShine" d="${iDr}" fill="url(#clothShine)" opacity="0.40"/>
<path id="dBorder" d="${iDr}" fill="none" stroke="rgba(0,0,0,0.10)" stroke-width="1.5"/>
<path id="la2" d="${iLa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w-4}" stroke-linecap="round"/>
<ellipse id="lh2" cx="${CX-sh_w-10}" cy="${y_sh+210}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>
<path id="ra2" d="${iRa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w-4}" stroke-linecap="round"/>
<ellipse id="rh2" cx="${CX+sh_w+10}" cy="${y_sh+210}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>
`:''}
<path id="neck" d="${iNk}" fill="${skin_mid}" filter="url(#ds)"/>
<circle id="head" cx="${CX}" cy="${y_hcy}" r="${FR+2}" fill="url(#hG)" filter="url(#ds)"/>
<image id="faceImg" href="${faceUrl}" x="${CX-FR-14}" y="${y_hcy-FR-14}" width="${(FR+14)*2}" height="${(FR+14)*2}" clip-path="url(#fCl)" preserveAspectRatio="xMidYMid ${faceB64?'slice':'meet'}"/>
<text id="vl" x="${CX}" y="${H-6}" text-anchor="middle" font-size="9" fill="rgba(140,110,255,0.15)">v35 · FRONT · ${result.body_type}</text>
</svg>
<div style="display:flex;gap:6px;margin-top:10px">
  <button class="cb" onclick="snapTo(0)">⬆ Front</button>
  <button class="cb" onclick="snapTo(90)">➡ Right</button>
  <button class="cb" onclick="snapTo(180)">⬇ Back</button>
  <button class="cb" onclick="snapTo(270)">⬅ Left</button>
  <button class="cb" id="sb" onclick="toggleSpin()">▶ Spin</button>
</div>
<input type="range" min="0" max="359" value="0" style="width:240px;accent-color:#8060e0;margin-top:8px" oninput="setAngle(+this.value)"/>
<script>(function(){
  var CX=${CX},SHW=${sh_w},FR=${FR},angle=0,spinning=false;
  function m360(a){return((a%360)+360)%360}
  function S(id,a,v){var e=document.getElementById(id);if(e)e.setAttribute(a,String(v))}
  function upd(a){
    a=m360(a);
    var r=a*Math.PI/180,c=Math.cos(r),s=Math.sin(r),sh=Math.round(s*22);
    S('head','cx',CX+sh);
    S('fClC','cx',CX+sh);
    var fi=document.getElementById('faceImg');
    if(fi){fi.setAttribute('x',String(CX-FR-14+sh));fi.style.opacity=String(Math.max(0,c).toFixed(2))}
  }
  function setAngle(a){angle=m360(a);upd(angle);}
  window.setAngle=setAngle;
  function snapTo(t){var st=angle,df=m360(t-st);if(df>180)df-=360;var N=28,i=0;
    function tick(){i++;var p=i/N;p=p<.5?2*p*p:-1+(4-2*p)*p;angle=m360(st+df*p);upd(angle);if(i<N)requestAnimationFrame(tick);else{angle=m360(t);upd(angle)}}
    requestAnimationFrame(tick)}
  window.snapTo=snapTo;
  function toggleSpin(){spinning=!spinning;var b=document.getElementById('sb');
    if(b){b.textContent=spinning?'⏸ Stop':'▶ Spin';spinning?b.classList.add('on'):b.classList.remove('on')}
    if(spinning)loop()}
  window.toggleSpin=toggleSpin;
  function loop(){if(!spinning)return;angle=m360(angle+1);upd(angle);requestAnimationFrame(loop)}
  upd(0);
})();</script>
</body></html>`
}

// ══════════════════════════════════════════════════════════════════════
// COLOURS TAB
// ══════════════════════════════════════════════════════════════════════
function ColoursTab({result}:{result:AnalysisResult}){
  const st=result.skin_tone||'Medium'; const pal=SKIN_PALETTES[st]||SKIN_PALETTES['Medium']
  const avoid=result.avoid_colors||pal.avoid
  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16,display:'flex',gap:14,alignItems:'center'}}>
        <div style={{width:54,height:54,borderRadius:'50%',background:pal.hex,border:'3px solid rgba(255,255,255,.12)'}}/>
        <div><div style={{color:'#e8c99a',fontWeight:800,fontSize:15}}>{st} Skin Tone</div><div style={{color:'#5050a0',fontSize:12,marginTop:3}}>{pal.tip}</div></div>
      </div>
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
        <div style={{color:'#22c55e',fontWeight:700,fontSize:13,marginBottom:12}}>✨ Best Colors for You</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8}}>
          {pal.best.map(c=>(
            <div key={c} style={{display:'flex',alignItems:'center',gap:8,background:'#08081e',border:'1px solid #161640',borderRadius:10,padding:'8px 10px'}}>
              <div style={{width:30,height:30,borderRadius:'50%',background:COLOR_HEX[c]||'#888',flexShrink:0,border:'2px solid rgba(255,255,255,.08)'}}/>
              <span style={{color:'#c0b0e0',fontSize:11,fontWeight:700}}>{c}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
        <div style={{color:'#ef4444',fontWeight:700,fontSize:13,marginBottom:10}}>✗ Colors to Avoid</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {avoid.map(c=><span key={c} style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',color:'#ef4444',borderRadius:6,padding:'4px 10px',fontSize:11}}>{c}</span>)}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// SHOP TAB
// ══════════════════════════════════════════════════════════════════════
function ShopTab({result,category}:{result:AnalysisResult,category:string}){
  const bt=result.body_type,size=result.size
  const all=PRODUCTS[category]||PRODUCTS.Women
  const matched=all.filter((p:any)=>p.body.includes(bt))
  return(
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
        <div style={{color:'#e8c99a',fontWeight:800,fontSize:14}}>🛍 Best for {bt} · Size {size}</div>
        <div style={{color:'#4a4070',fontSize:11,marginTop:4}}>{matched.length} curated recommendations</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
        {matched.map((p:any)=>(
          <div key={p.name} style={{background:'#0c0c28',border:'1px solid #1a1840',borderRadius:14,padding:16}}>
            <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:5}}>{p.name}</div>
            <div style={{color:'#252558',fontSize:11,marginBottom:12}}>Sizes: {p.sizes.join(' · ')}</div>
            <div style={{display:'flex',gap:8}}>
              <a href={p.amazon} target="_blank" rel="noreferrer" style={{flex:1,background:'#ff9900',color:'#000',padding:'9px 0',borderRadius:8,fontWeight:700,fontSize:12,textDecoration:'none',textAlign:'center'}}>🛒 Amazon</a>
              <a href={p.flipkart} target="_blank" rel="noreferrer" style={{flex:1,background:'#2874f0',color:'#fff',padding:'9px 0',borderRadius:8,fontWeight:700,fontSize:12,textDecoration:'none',textAlign:'center'}}>🛒 Flipkart</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════
export default function Home(){
  const [step,setStep]=useState<'upload'|'result'>('upload')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [result,setResult]=useState<AnalysisResult|null>(null)
  const [photoUrl,setPhotoUrl]=useState<string|null>(null)
  const [preview,setPreview]=useState<string|null>(null)
  const [category,setCategory]=useState('Women')
  const [userHeight,setUserHeight]=useState('')
  const [dressB64,setDressB64]=useState<string|null>(null)
  const [dressPreview,setDressPreview]=useState<string|null>(null)
  const [dressLoading,setDressLoading]=useState(false)
  const [faceB64,setFaceB64]=useState<string|null>(null)
  const [photoTryOnUrl,setPhotoTryOnUrl]=useState<string|null>(null)
  const [tryOnLoading,setTryOnLoading]=useState(false)
  const [activeTab,setActiveTab]=useState<'avatar'|'photo'|'analysis'|'colours'|'shop'>('analysis')
  const fileRef=useRef<HTMLInputElement>(null)
  const dressRef=useRef<HTMLInputElement>(null)

  // ── Analyze ───────────────────────────────────────────────────────
  const analyze=async(file:File)=>{
    setLoading(true);setError('')
    try{
      setPhotoUrl(URL.createObjectURL(file))
      const form=new FormData()
      form.append('file',file); form.append('category',category)
      if(userHeight) form.append('user_height',userHeight)
      const res=await fetch('/api/analyze',{method:'POST',body:form})
      const data=await res.json()
      if(data.error){setError(data.error);setLoading(false);return}
      setResult(data)

      // Extract face in parallel
      try{
        const ff=new FormData(); ff.append('file',file)
        const fr=await fetch('/api/extract-face',{method:'POST',body:ff})
        const fd=await fr.json()
        if(fd.success&&fd.face_b64) setFaceB64(fd.face_b64)
      }catch{}

      // Auto-extract dress if none loaded
      if(!dressB64) extractDressFromFile(file,true)
      setStep('result')
    }catch(e:any){setError(e.message)}
    setLoading(false)
  }

  // ── Extract dress ─────────────────────────────────────────────────
  const extractDressFromFile=async(file:File,silent=false)=>{
    if(!silent) setDressLoading(true)
    try{
      const form=new FormData(); form.append('file',file)
      const res=await fetch('/api/extract-dress',{method:'POST',body:form})
      const data=await res.json()
      if(!data.error&&data.dress_b64){
        setDressB64(data.dress_b64)
        setDressPreview(`data:image/png;base64,${data.dress_b64}`)
      }
    }catch{}
    if(!silent) setDressLoading(false)
  }

  // ── Photo try-on ──────────────────────────────────────────────────
  const generateTryOn=async()=>{
    if(!photoUrl||!dressB64) return
    setTryOnLoading(true)
    try{
      const form=new FormData()
      const blob=await fetch(photoUrl).then(r=>r.blob())
      form.append('person_image',blob)
      form.append('dress_b64',dressB64)
      if(result) form.append('measurements',JSON.stringify(result))
      const res=await fetch('/api/virtual-tryon',{method:'POST',body:form,signal:AbortSignal.timeout(60000)})
      const data=await res.json()
      if(data.tryon_b64){ setPhotoTryOnUrl(`data:image/jpeg;base64,${data.tryon_b64}`); setActiveTab('photo') }
      else setError(data.error||'Try-on failed')
    }catch(e:any){setError(e.message)}
    setTryOnLoading(false)
  }

  const reset=()=>{setStep('upload');setResult(null);setPreview(null);setPhotoUrl(null);setDressB64(null);setDressPreview(null);setPhotoTryOnUrl(null);setFaceB64(null);setError('')}

  const tabBtn=(id:string,label:string)=>(
    <button onClick={()=>setActiveTab(id as any)} style={{
      padding:'10px 16px',border:'none',cursor:'pointer',fontWeight:700,fontSize:12,
      background:'transparent',color:activeTab===id?'#e8c99a':'#38307a',
      borderBottom:activeTab===id?'2px solid #e8c99a':'2px solid transparent',
      whiteSpace:'nowrap',transition:'color .2s'}}>
      {label}
    </button>
  )

  // ── UPLOAD SCREEN ─────────────────────────────────────────────────
  if(step==='upload') return(
    <main style={{minHeight:'100vh',background:'#06061a',color:'#e8e0ff',fontFamily:'system-ui'}}>
      <div style={{background:'linear-gradient(135deg,#160830,#0a0420)',padding:'14px 20px',borderBottom:'1px solid #140d30'}}>
        <h1 style={{margin:0,fontSize:'1.35rem',fontWeight:800,color:'#e8c99a'}}>👗 Fashion Stylist Pro v35</h1>
        <p style={{margin:'2px 0 0',color:'#4a3870',fontSize:'.72rem'}}>Professional photo try-on · 4-zone measurements · Real face avatar</p>
      </div>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'20px 14px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:16}}>
        {/* Upload panel */}
        <div style={{background:'#0c0c28',border:'1px solid #181840',borderRadius:18,padding:22}}>
          <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:5}}>📸 Upload Full-Body Photo</div>
          <div style={{color:'#383068',fontSize:12,marginBottom:14}}>Stand straight, full body visible. Height input improves accuracy by ~25%.</div>
          {/* Category */}
          <div style={{display:'flex',gap:6,marginBottom:10}}>
            {['Women','Men','Kids'].map(c=>(
              <button key={c} onClick={()=>setCategory(c)} style={{
                flex:1,padding:'9px 0',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12,
                border:`1px solid ${category===c?'#6030c0':'#181840'}`,
                background:category===c?'#22166a':'#090920',color:category===c?'#e8c99a':'#362870'}}>
                {c}
              </button>
            ))}
          </div>
          {/* Height */}
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,background:'#08081e',borderRadius:10,padding:'9px 12px',border:'1px solid #141440'}}>
            <span>📏</span>
            <span style={{color:'#383060',fontSize:12}}>Height</span>
            <input type="number" value={userHeight} onChange={e=>setUserHeight(e.target.value)}
              placeholder="162" min="80" max="220"
              style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#e8e0ff',fontSize:14,fontWeight:700,minWidth:0}}/>
            <span style={{color:'#282850',fontSize:12}}>cm <span style={{color:'#1e1e48'}}>(optional)</span></span>
          </div>
          {/* Drop zone */}
          <div onClick={()=>fileRef.current?.click()} style={{
            border:`2px dashed ${preview?'#4030a0':'#161638'}`,borderRadius:14,cursor:'pointer',
            background:'#080818',textAlign:'center',minHeight:220,
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,
            padding:preview?6:28,transition:'border-color .2s'}}>
            {preview
              ?<img src={preview} alt="preview" style={{maxHeight:280,borderRadius:10,objectFit:'contain'}}/>
              :<><div style={{fontSize:64}}>📷</div><div style={{color:'#3a2c80',fontSize:13,fontWeight:700}}>Click to choose photo</div><div style={{color:'#1a1848',fontSize:11}}>JPG, PNG, WEBP</div></>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
            const f=e.target.files?.[0]; if(!f) return
            setPreview(URL.createObjectURL(f)); analyze(f)
          }}/>
          {loading&&(
            <div style={{marginTop:12,padding:'12px 14px',background:'#120a30',border:'1px solid #301870',borderRadius:10,textAlign:'center'}}>
              <div style={{color:'#8060d0',fontWeight:700,fontSize:13}}>⏳ Analysing…</div>
              <div style={{color:'#3a2870',fontSize:11,marginTop:4}}>Detecting pose · Measuring body · Extracting face</div>
            </div>
          )}
          {error&&<div style={{marginTop:10,padding:'10px 14px',background:'#1e0606',border:'1px solid #500',borderRadius:8,color:'#ff6060',fontSize:12}}>❌ {error}</div>}
        </div>
        {/* Features panel */}
        <div style={{background:'#0c0c28',border:'1px solid #141440',borderRadius:18,padding:22}}>
          <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:14}}>✨ What You Get</div>
          {[
            ['📊','Olivia Paisley style guide — BUST, WAIST, HIGH HIP, LOW HIP on your photo'],
            ['📸','Professional photo try-on — pose-aware warp, not just a paste'],
            ['👤','Real face extracted and placed on 3D rotating avatar'],
            ['🎨','Personalised color palette by skin tone'],
            ['🛍','Smart outfit recommendations with Amazon & Flipkart links'],
          ].map(([icon,text])=>(
            <div key={text as string} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:14}}>
              <span style={{fontSize:22}}>{icon}</span>
              <span style={{color:'#4a3880',fontSize:13,lineHeight:1.5}}>{text as string}</span>
            </div>
          ))}
          <div style={{marginTop:8,background:'#06061a',border:'1px solid #1a1440',borderRadius:10,padding:12}}>
            <div style={{color:'#302858',fontSize:11}}>📐 For best accuracy:</div>
            <div style={{color:'#252246',fontSize:11,marginTop:4,lineHeight:1.6}}>• Stand straight, face camera<br/>• Full body in frame<br/>• Good lighting, plain background<br/>• Enter your height for ±3cm accuracy</div>
          </div>
        </div>
      </div>
    </main>
  )

  if(!result) return null

  // ── RESULT SCREEN ─────────────────────────────────────────────────
  return(
    <main style={{minHeight:'100vh',background:'#06061a',color:'#e8e0ff',fontFamily:'system-ui'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#160830,#0a0420)',padding:'12px 20px',borderBottom:'1px solid #140d30',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <h1 style={{margin:0,fontSize:'1.3rem',fontWeight:800,color:'#e8c99a'}}>👗 Fashion Stylist Pro v35</h1>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(16,10,40,.9)',border:'1px solid #221848',borderRadius:12,padding:'6px 14px'}}>
          <span style={{width:12,height:12,borderRadius:'50%',background:result.skin_hex,display:'inline-block'}}/>
          <span style={{fontWeight:800,color:'#ffd700',fontSize:16}}>{result.size}</span>
          <span style={{color:'#7060a0',fontSize:12}}>{result.body_icon} {result.body_type}</span>
          <span style={{color:'#302860',fontSize:11}}>· {result.height_cm}cm</span>
        </div>
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'14px 12px'}}>
        {/* Tab bar */}
        <div style={{display:'flex',borderBottom:'1px solid #141440',marginBottom:16,overflowX:'auto',gap:0}}>
          {tabBtn('analysis','📊 Analysis')}
          {tabBtn('avatar','🔄 3D Avatar')}
          {tabBtn('photo','📸 Photo Try-On')}
          {tabBtn('colours','🎨 Colours')}
          {tabBtn('shop','🛍 Shop')}
          <button onClick={reset} style={{marginLeft:'auto',padding:'8px 14px',background:'#110d30',color:'#3a2870',border:'1px solid #1a1640',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>📸 New Photo</button>
        </div>

        {/* ── ANALYSIS TAB ── */}
        {activeTab==='analysis'&&<AnalysisView result={result} photoUrl={photoUrl}/>}

        {/* ── AVATAR TAB ── */}
        {activeTab==='avatar'&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:16}}>
            <div style={{background:'#08081a',borderRadius:16,overflow:'hidden',minHeight:520}}>
              <iframe
                key={`av-${dressB64?dressB64.slice(-8):'bare'}-${faceB64?'real':'default'}`}
                srcDoc={buildAvatar(result,dressB64,faceB64)}
                style={{width:'100%',height:620,border:'none'}} title="avatar"
                sandbox="allow-scripts"/>
            </div>
            {/* Outfit panel */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:16,padding:18}}>
                <div style={{color:'#e8c99a',fontWeight:800,marginBottom:4}}>👗 Upload Outfit for Try-On</div>
                <div style={{color:'#3a2e70',fontSize:12,marginBottom:12}}>
                  {dressB64?'Outfit loaded! Click "Generate Photo Try-On" below.':'Upload a dress or outfit image.'}
                </div>
                <div onClick={()=>dressRef.current?.click()} style={{
                  border:'2px dashed #161640',borderRadius:12,padding:14,cursor:'pointer',
                  background:'#080818',textAlign:'center',minHeight:130,
                  display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8}}>
                  {dressPreview
                    ?<img src={dressPreview} alt="outfit" style={{maxHeight:130,borderRadius:8,objectFit:'contain'}}/>
                    :<><span style={{fontSize:40}}>👗</span><span style={{color:'#2e2860',fontSize:12}}>Click to upload outfit</span></>
                  }
                </div>
                <input ref={dressRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{
                  const f=e.target.files?.[0]; if(f) extractDressFromFile(f)
                }}/>
                {dressLoading&&<div style={{marginTop:8,color:'#6050c0',fontSize:12,textAlign:'center'}}>⏳ Extracting garment…</div>}
                {dressB64&&(
                  <button onClick={generateTryOn} disabled={tryOnLoading} style={{
                    marginTop:12,width:'100%',background:'linear-gradient(135deg,#4018a0,#7030c0)',
                    color:'#fff',border:'none',padding:'12px',borderRadius:10,cursor:'pointer',
                    fontSize:13,fontWeight:700,opacity:tryOnLoading?.6:1}}>
                    {tryOnLoading?'⏳ Generating…':'📸 Generate Photo Try-On'}
                  </button>
                )}
              </div>
              {/* Quick measurements */}
              <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
                <div style={{color:'#e8c99a',fontWeight:700,fontSize:12,marginBottom:10}}>📏 Quick Measurements</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  {([['Bust',result.bust_cm,'#00d4ff'],['Waist',result.waist_cm,'#ffd700'],['High Hip',result.high_hip_cm,'#ff80ff'],['Low Hip',result.hip_cm,'#a080ff']] as [string,number,string][]).map(([k,v,c])=>(
                    <div key={k} style={{background:'#06061a',border:`1px solid ${c}22`,borderRadius:7,padding:'6px 8px'}}>
                      <div style={{color:'#28285a',fontSize:9,textTransform:'uppercase'}}>{k}</div>
                      <div style={{color:c,fontWeight:800,fontSize:14}}>{(v||0).toFixed(0)}<span style={{fontSize:9}}>cm</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PHOTO TRY-ON TAB ── */}
        {activeTab==='photo'&&(
          <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center'}}>
            {photoTryOnUrl?(
              <>
                <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:16,padding:16,maxWidth:600,width:'100%'}}>
                  <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:12}}>📸 Professional Photo Try-On</div>
                  <img src={photoTryOnUrl} alt="tryon" style={{width:'100%',borderRadius:12,display:'block'}}/>
                  <div style={{color:'#4a4070',fontSize:12,marginTop:10,textAlign:'center'}}>
                    Pose-aware warp · Lighting matched · Feathered blend
                  </div>
                </div>
                <div style={{display:'flex',gap:10}}>
                  <button onClick={()=>setPhotoTryOnUrl(null)} style={{background:'#110d30',color:'#6050a0',border:'1px solid #1a1640',padding:'10px 20px',borderRadius:10,cursor:'pointer',fontSize:12}}>
                    ↺ Try Different Outfit
                  </button>
                  <a href={photoTryOnUrl} download="tryon.jpg" style={{background:'linear-gradient(135deg,#4018a0,#7030c0)',color:'#fff',padding:'10px 20px',borderRadius:10,fontSize:12,textDecoration:'none',fontWeight:700}}>
                    ⬇ Download
                  </a>
                </div>
              </>
            ):(
              <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:16,padding:36,textAlign:'center',maxWidth:500}}>
                <div style={{fontSize:64,marginBottom:14}}>📸</div>
                <div style={{color:'#e8c99a',fontWeight:700,fontSize:16,marginBottom:8}}>No Try-On Yet</div>
                <div style={{color:'#4a4070',fontSize:13,marginBottom:16}}>
                  Go to the 3D Avatar tab, upload an outfit, and click "Generate Photo Try-On".
                </div>
                <button onClick={()=>setActiveTab('avatar')} style={{background:'linear-gradient(135deg,#4018a0,#7030c0)',color:'#fff',border:'none',padding:'11px 24px',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:700}}>
                  Go to 3D Avatar →
                </button>
              </div>
            )}
            {error&&<div style={{padding:'10px 16px',background:'#1e0606',border:'1px solid #500',borderRadius:8,color:'#ff6060',fontSize:12}}>❌ {error}</div>}
          </div>
        )}

        {activeTab==='colours'&&<ColoursTab result={result}/>}
        {activeTab==='shop'&&<ShopTab result={result} category={category}/>}
      </div>
    </main>
  )
}
