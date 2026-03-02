'use client'
import { useState, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════════
   Fashion Stylist v34 — PROFESSIONAL PHOTO-REALISTIC TRY-ON
   ─────────────────────────────────────────────────────────────────
   TAB 1 · 3D AVATAR      — Real extracted face + body proportions
   TAB 2 · PHOTO TRY-ON   — Professional warped dress on actual photo
   TAB 3 · ANALYSIS       — Olivia Paisley style measurement guide
   TAB 4 · COLOURS        — Personalized palette
   TAB 5 · SHOP           — Smart recommendations
   ═══════════════════════════════════════════════════════════════════ */

// ⚠️ IMPORTANT: Change this to your backend URL
const BACKEND_URL = 'https://indhu321-fashion-stylist-app.hf.space'

// ── Color data ────────────────────────────────────────────────────
const COLOR_HEX: Record<string,string> = {
  "Pastel Pink":"#FFD1DC","Lavender":"#E6D0FF","Mint Green":"#AAFFDD","Sky Blue":"#87CEEB",
  "Blush Rose":"#FFB6C1","Butter Yellow":"#FFFACD","Soft Peach":"#FFDAB9","Warm Coral":"#FF7F50",
  "Dusty Mauve":"#C09090","Champagne":"#F7E7CE","Terracotta":"#E07050","Royal Blue":"#4169E1",
  "Emerald":"#50C878","Mustard":"#FFDB58","Teal":"#008080","Burnt Orange":"#CC5500",
  "Cobalt":"#0047AB","Deep Burgundy":"#800020","Fuchsia":"#FF00FF","Crimson":"#DC143C",
  "Navy":"#001F5B","Jade":"#00A86B","Pure White":"#FFFFFF","Bright Gold":"#FFD700",
  "Hot Pink":"#FF69B4","Coral":"#FF6B6B","Blush":"#DE5D83","Peach":"#FFCBA4",
}

const SKIN_PALETTES: Record<string, {best:string[],avoid:string[],neutrals:string[],hex:string,tip:string}> = {
  Fair: {hex:'#f5d5c8',best:["Pastel Pink","Lavender","Mint Green","Sky Blue","Blush Rose"],neutrals:["Ivory","Champagne"],avoid:["Pure White","Neon"],tip:"Soft muted tones complement fair skin."},
  Light: {hex:'#ebbfa0',best:["Warm Coral","Dusty Mauve","Terracotta","Sky Blue","Blush"],neutrals:["Champagne","Camel"],avoid:["Pale pastels"],tip:"Warm earth tones make light skin glow."},
  Medium:{hex:'#c8956c',best:["Royal Blue","Emerald","Mustard","Teal","Burnt Orange","Cobalt"],neutrals:["Camel","Rust"],avoid:["Muddy browns"],tip:"Bold jewel tones create stunning contrast."},
  Tan:   {hex:'#a0694a',best:["Cobalt","Deep Burgundy","Fuchsia","Crimson","Navy","Jade"],neutrals:["Rust","Camel"],avoid:["Dull khaki"],tip:"Rich saturated colors illuminate tan skin."},
  Deep:  {hex:'#5c2e10',best:["Pure White","Bright Gold","Cobalt","Fuchsia","Hot Pink","Emerald"],neutrals:["Camel","Ivory"],avoid:["Dark muddy tones"],tip:"High-contrast colors are stunning on deep skin."},
}

const BODY_DATA: Record<string,{icon:string,desc:string,shape:string,tips:string[],avoid:string[],bestStyles:string[],sareeStyle:string,colorFocus:string}> = {
  "Hourglass":{icon:"⌛",shape:"Balanced shoulders & hips · Defined waist",desc:"Your proportions are naturally balanced.",tips:["Wrap dresses","Bodycon","Belted kurtas","V-necks"],avoid:["Shapeless cuts"],bestStyles:["Wrap Dress","Sheath Dress"],sareeStyle:"Nivi drape flatters your shape perfectly.",colorFocus:"Any color works."},
  "Pear":{icon:"🍐",shape:"Hips wider than bust",desc:"Draw attention upward with bright tops.",tips:["A-line skirts","Empire waist","Boat necks","Dark bottoms"],avoid:["Tight pencil skirts"],bestStyles:["A-line Kurta","Empire Maxi"],sareeStyle:"Plain border, pallu over shoulder.",colorFocus:"Bright on top, dark on bottom."},
  "Apple":{icon:"🍎",shape:"Fuller midsection",desc:"Create waist illusion with empire cuts.",tips:["Empire waist","V-necks","Vertical stripes"],avoid:["Belted waists","Crop tops"],bestStyles:["Empire Maxi","Flowy Anarkali"],sareeStyle:"Pre-pleated style.",colorFocus:"Dark monochromatic."},
  "Rectangle":{icon:"▭",shape:"Balanced proportions",desc:"Create curves with peplums and belts.",tips:["Peplum tops","Ruffled hems","Belted dresses"],avoid:["Straight shift dresses"],bestStyles:["Peplum Kurti","Belted Wrap Dress"],sareeStyle:"Any drape style works.",colorFocus:"Color-blocking works great."},
  "Inverted Triangle":{icon:"🔻",shape:"Broader shoulders",desc:"Add volume below waist.",tips:["A-line skirts","Wide-leg trousers","Flared hems"],avoid:["Shoulder pads","Halter necks"],bestStyles:["A-line Skirt","Flared Palazzo"],sareeStyle:"Lots of pleats at bottom.",colorFocus:"Dark on top, bold on bottom."},
}

const PRODUCTS: Record<string,any[]> = {
  Women:[
    {name:"Floral Wrap Dress",body:["Hourglass","Rectangle"],colors:["Pastel Pink","Lavender"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+wrap+dress",flipkart:"https://www.flipkart.com/search?q=women+wrap+dress"},
    {name:"A-Line Kurta",body:["Pear","Apple"],colors:["Royal Blue","Mint Green"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+aline+kurta",flipkart:"https://www.flipkart.com/search?q=aline+kurta"},
    {name:"Bodycon Dress",body:["Hourglass"],colors:["Cobalt","Crimson"],sizes:["XS","S","M","L"],amazon:"https://www.amazon.in/s?k=bodycon+dress",flipkart:"https://www.flipkart.com/search?q=bodycon"},
    {name:"Empire Maxi",body:["Apple","Pear"],colors:["Lavender","Soft Peach"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=empire+maxi",flipkart:"https://www.flipkart.com/search?q=empire+maxi"},
    {name:"Anarkali Suit",body:["Apple","Rectangle"],colors:["Deep Burgundy","Jade"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=anarkali+suit",flipkart:"https://www.flipkart.com/search?q=anarkali"},
    {name:"Printed Saree",body:["Pear","Hourglass"],colors:["Royal Blue","Mustard"],sizes:["Free Size"],amazon:"https://www.amazon.in/s?k=printed+saree",flipkart:"https://www.flipkart.com/search?q=saree"},
  ],
  Men:[
    {name:"Formal Shirt",body:["Rectangle"],colors:["Royal Blue","Pure White"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=men+formal+shirt",flipkart:"https://www.flipkart.com/search?q=formal+shirt"},
    {name:"Blazer",body:["Rectangle"],colors:["Navy","Deep Burgundy"],sizes:["S","M","L","XL"],amazon:"https://www.amazon.in/s?k=men+blazer",flipkart:"https://www.flipkart.com/search?q=blazer"},
  ],
  Kids:[
    {name:"Cotton Frock",body:["Rectangle"],colors:["Pastel Pink"],sizes:["2Y","3Y","4Y"],amazon:"https://www.amazon.in/s?k=kids+frock",flipkart:"https://www.flipkart.com/search?q=frock"},
  ],
}

function lighten(hex:string,f:number){const h=hex.replace('#','');return'#'+[0,2,4].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(h.slice(i,i+2),16)*f))).toString(16).padStart(2,'0')).join('')}

/* ════════════════════════════════════════════════════════════════
   ENHANCED 3D AVATAR — Real face extraction
   ════════════════════════════════════════════════════════════════ */
function buildAvatar(result:any,dressB64:string|null,realFaceB64:string|null):string{
  const skin=result.skin_hex||'#c8956c',skinTone=result.skin_tone||'Medium',bodyType=result.body_type||'Rectangle'
  const CX=210,W=420,H=700,SC=4.8
  const hw=(c:number)=>Math.max(10,Math.round((c/(2*Math.PI))*SC))
  const sh_w=Math.max(hw((result.shoulder_cm||40)*1.05),52),bu_w=hw(result.bust_cm||88),wa_w=hw(result.waist_cm||72)
  const hh_w=hw(result.high_hip_cm||90),hi_w=hw(result.hip_cm||94),th_w=Math.round(hi_w*0.68),ca_w=Math.round(hi_w*0.37)
  const arm_w=Math.max(14,Math.round(sh_w*0.28)),nw=Math.max(12,Math.round(sh_w*0.26)),ah=Math.round(arm_w/2)
  const y_sh=218,y_bu=y_sh+70,y_wa=y_bu+60,y_hh=y_wa+38,y_hi=y_hh+30
  const y_th=y_hi+76,y_kn=y_th+58,y_ca=y_kn+50,y_ft=y_ca+46,y_nek=y_sh-24,y_hcy=y_nek-80
  const skin_sh=lighten(skin,0.62),skin_hi=lighten(skin,1.26),skin_mid=lighten(skin,0.80),skin_drk=lighten(skin,0.46)
  const isMen=result.category==='Men'
  
  const pSkin:Record<string,string>={Fair:'ecru',Light:'apricot',Medium:'bronze',Tan:'copper',Deep:'sepia'}
  const pHair:Record<string,string>={Fair:'2c1b18',Light:'3d2314',Medium:'1c0d00',Tan:'0d0500',Deep:'080200'}
  const faceUrl=realFaceB64?`data:image/jpeg;base64,${realFaceB64}`:(isMen?`https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=${skinTone}${bodyType}&backgroundColor=transparent&scale=115`:`https://api.dicebear.com/9.x/personas/svg?seed=${skinTone}${bodyType}&skinColor=${pSkin[skinTone]||'bronze'}&hairColor=${pHair[skinTone]||'1c0d00'}&backgroundColor=transparent&scale=110`)

  function bodyP(sw:number,bw:number,ww:number,hhw:number,hiw:number,tw:number,cw:number,sh:number){const L=(v:number)=>CX-v+sh,R=(v:number)=>CX+v+sh;return`M ${L(sw)},${y_sh} C ${L(sw+10)},${y_sh+24} ${L(bw+6)},${y_bu-18} ${L(bw)},${y_bu} C ${L(bw-7)},${y_bu+28} ${L(ww+4)},${y_wa-16} ${L(ww)},${y_wa} C ${L(ww+4)},${y_wa+18} ${L(hhw-3)},${y_hh-12} ${L(hhw)},${y_hh} C ${L(hhw+2)},${y_hh+16} ${L(hiw-2)},${y_hi-10} ${L(hiw)},${y_hi} C ${L(hiw-2)},${y_hi+28} ${L(tw+4)},${y_th-12} ${L(tw)},${y_th} C ${L(tw-2)},${y_th+22} ${L(cw+2)},${y_kn-10} ${L(cw)},${y_kn} C ${L(cw)},${y_kn+26} ${L(cw-2)},${y_ca-6} ${L(cw-2)},${y_ca} C ${L(cw-2)},${y_ca+18} ${L(cw)},${y_ft-4} ${L(cw+2)},${y_ft} L ${R(cw+2)},${y_ft} C ${R(cw)},${y_ft-4} ${R(cw-2)},${y_ca+18} ${R(cw-2)},${y_ca} C ${R(cw-2)},${y_ca-6} ${R(cw)},${y_kn+26} ${R(cw)},${y_kn} C ${R(cw+2)},${y_kn-10} ${R(tw-2)},${y_th+22} ${R(tw)},${y_th} C ${R(tw+4)},${y_th-12} ${R(hiw-2)},${y_hi+28} ${R(hiw)},${y_hi} C ${R(hiw+2)},${y_hi-10} ${R(hhw+2)},${y_hh+16} ${R(hhw)},${y_hh} C ${R(hhw-3)},${y_hh-12} ${R(ww+4)},${y_wa+18} ${R(ww)},${y_wa} C ${R(ww+4)},${y_wa-16} ${R(bw-7)},${y_bu+28} ${R(bw)},${y_bu} C ${R(bw+6)},${y_bu-18} ${R(sw+10)},${y_sh+24} ${R(sw)},${y_sh} Z`}
  function dressP(sw:number,bw:number,ww:number,hhw:number,hiw:number,sh:number){const sw2=sw+20,bw2=bw+14,ww2=ww+6,hhw2=hhw+8,hiw2=hiw+10;const L=(v:number)=>CX-v+sh,R=(v:number)=>CX+v+sh;return`M ${L(sw2)},${y_sh} C ${L(sw2+10)},${y_sh+24} ${L(bw2+6)},${y_bu-18} ${L(bw2)},${y_bu} C ${L(bw2-7)},${y_bu+28} ${L(ww2+4)},${y_wa-16} ${L(ww2)},${y_wa} C ${L(ww2+4)},${y_wa+20} ${L(hhw2-2)},${y_hh-12} ${L(hhw2)},${y_hh} C ${L(hhw2+2)},${y_hh+22} ${L(hiw2+2)},${y_ft-14} ${L(hiw2-2)},${y_ft} L ${R(hiw2-2)},${y_ft} C ${R(hiw2+2)},${y_ft-14} ${R(hhw2+2)},${y_hh+22} ${R(hhw2)},${y_hh} C ${R(hhw2-2)},${y_hh-12} ${R(ww2+4)},${y_wa+20} ${R(ww2)},${y_wa} C ${R(ww2+4)},${y_wa-16} ${R(bw2-7)},${y_bu+28} ${R(bw2)},${y_bu} C ${R(bw2+6)},${y_bu-18} ${R(sw2+10)},${y_sh+24} ${R(sw2)},${y_sh} Z`}
  function armP(s:number,sw:number,sh:number){const ax=CX+s*sw+sh,ay=y_sh+12,ex=CX+s*(sw+30)+sh,ey=y_sh+108,hx=CX+s*(sw+12)+sh,hy=y_sh+210;return`M ${ax},${ay} C ${ax+s*18},${ay+28} ${ex-s*6},${ey-26} ${ex},${ey} C ${ex+s*4},${ey+34} ${hx+s*10},${hy-34} ${hx},${hy}`}
  function neckP(nn:number,sh:number){return`M ${CX-nn+sh},${y_nek+4} C ${CX-nn+2+sh},${y_nek+16} ${CX-nn+2+sh},${y_sh-8} ${CX-nn+3+sh},${y_sh} L ${CX+nn-3+sh},${y_sh} C ${CX+nn-2+sh},${y_sh-8} ${CX+nn-2+sh},${y_nek+16} ${CX+nn+sh},${y_nek+4} Z`}

  const iBd=bodyP(sh_w,bu_w,wa_w,hh_w,hi_w,th_w,ca_w,0),iDr=dressP(sh_w,bu_w,wa_w,hh_w,hi_w,0)
  const iLa=armP(-1,sh_w,0),iRa=armP(1,sh_w,0),iNk=neckP(nw,0),dW=(hi_w+34)*2,dH=y_ft-y_sh+30

  return`<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{margin:0;padding:0}body{background:radial-gradient(#141030,#050510);display:flex;flex-direction:column;align-items:center;padding:12px;font-family:system-ui}svg{cursor:grab;touch-action:none}.cb{background:#1a143e;color:#c0b0f0;border:1px solid #503ca0;padding:6px 13px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700}.cb:hover{background:#3a2d80}.cb.on{background:#5b21b6;border-color:#8b5cf6}</style></head><body><svg id="av" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px"><defs><radialGradient id="bg" cx="50%" cy="48%" r="66%"><stop offset="0%" stop-color="#181040"/><stop offset="100%" stop-color="#040410"/></radialGradient><linearGradient id="bG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${skin_drk}"/><stop offset="25%" stop-color="${skin_sh}"/><stop offset="52%" stop-color="${skin_hi}"/><stop offset="75%" stop-color="${skin}"/><stop offset="100%" stop-color="${skin_drk}"/></linearGradient><radialGradient id="hG" cx="42%" cy="38%" r="60%"><stop offset="0%" stop-color="${skin_hi}"/><stop offset="55%" stop-color="${skin}"/><stop offset="100%" stop-color="${skin_sh}"/></radialGradient><filter id="ds"><feDropShadow dx="2" dy="6" stdDeviation="6" flood-opacity="0.32"/></filter>${dressB64?`<clipPath id="dCl"><path id="dClP" d="${iDr}"/></clipPath>`:''}<clipPath id="fCl"><circle cx="${CX}" cy="${y_hcy}" r="70"/></clipPath></defs><rect width="${W}" height="${H}" fill="url(#bg)"/><path id="la" d="${iLa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${dressB64?0:1}"/><ellipse id="lh" cx="${CX-sh_w-12}" cy="${y_sh+212}" rx="${ah}" ry="${ah+2}" fill="${skin}" opacity="${dressB64?0:1}"/><path id="ra" d="${iRa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${dressB64?0:1}"/><ellipse id="rh" cx="${CX+sh_w+12}" cy="${y_sh+212}" rx="${ah}" ry="${ah+2}" fill="${skin}" opacity="${dressB64?0:1}"/><path id="body" d="${iBd}" fill="url(#bG)" filter="url(#ds)"/>${dressB64?`<image id="dImg" href="data:image/png;base64,${dressB64}" x="${CX-dW/2}" y="${y_sh}" width="${dW}" height="${dH}" clip-path="url(#dCl)" preserveAspectRatio="xMidYMid slice" opacity="0.96"/><path d="${iDr}" fill="none" stroke="rgba(0,0,0,0.07)" stroke-width="1.5"/><path id="la2" d="${iLa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w-4}" stroke-linecap="round"/><ellipse id="lh2" cx="${CX-sh_w-12}" cy="${y_sh+212}" rx="${ah}" ry="${ah+2}" fill="${skin}"/><path id="ra2" d="${iRa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w-4}" stroke-linecap="round"/><ellipse id="rh2" cx="${CX+sh_w+12}" cy="${y_sh+212}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>`:''}<path id="neck" d="${iNk}" fill="${skin_mid}" filter="url(#ds)"/><circle id="head" cx="${CX}" cy="${y_hcy}" r="70" fill="url(#hG)" filter="url(#ds)"/><image id="face" href="${faceUrl}" x="${CX-84}" y="${y_hcy-90}" width="168" height="168" clip-path="url(#fCl)" preserveAspectRatio="xMidYMid ${realFaceB64?'slice':'meet'}"/><text id="vl" x="${CX}" y="${H-6}" text-anchor="middle" font-size="10" fill="rgba(180,160,255,0.2)">FRONT · 0° · ${bodyType}</text></svg><div style="display:flex;gap:6px;margin-top:10px"><button class="cb" onclick="snapTo(0)">⬆ Front</button><button class="cb" onclick="snapTo(90)">➡ Right</button><button class="cb" onclick="snapTo(180)">⬇ Back</button><button class="cb" onclick="snapTo(270)">⬅ Left</button><button class="cb" id="sb" onclick="toggleSpin()">▶ Spin</button></div><input type="range" min="0" max="359" value="0" step="1" style="width:250px;accent-color:#8060e0;margin-top:8px" oninput="setAngle(+this.value)" id="sl"/><script>(function(){var CX=${CX},SHW=${sh_w},BUW=${bu_w},WAW=${wa_w},HHW=${hh_w},HIW=${hi_w},THW=${th_w},CAW=${ca_w},angle=0,spinning=false,dragX=null;function m360(a){return((a%360)+360)%360}function vn(a){a=m360(a);if(a<22)return'FRONT';if(a<67)return'FRONT-R';if(a<112)return'RIGHT';if(a<157)return'BACK-R';if(a<202)return'BACK';if(a<247)return'BACK-L';if(a<292)return'LEFT';return'FRONT-L'}function S(id,a,v){var e=document.getElementById(id);if(e)e.setAttribute(a,v)}function O(id,v){var e=document.getElementById(id);if(e)e.style.opacity=v}function upd(a){a=m360(a);var r=a*Math.PI/180,c=Math.cos(r),s=Math.sin(r),w=Math.abs(c)*0.86+0.14,sh=Math.round(s*24);S('head','cx',CX+sh);var f=document.getElementById('face');if(f)f.setAttribute('x',CX-84+sh);O('face',Math.max(0,c))}function setAngle(a){angle=m360(a);upd(angle)}window.setAngle=setAngle;function snapTo(t){var st=angle,df=m360(t-st);if(df>180)df-=360;var N=28,i=0;function tick(){i++;var p=i/N;p=p<.5?2*p*p:-1+(4-2*p)*p;angle=m360(st+df*p);upd(angle);if(i<N)requestAnimationFrame(tick);else{angle=m360(t);upd(angle)}}requestAnimationFrame(tick)}window.snapTo=snapTo;function toggleSpin(){spinning=!spinning;var b=document.getElementById('sb');if(b){b.textContent=spinning?'⏸ Stop':'▶ Spin';spinning?b.classList.add('on'):b.classList.remove('on')}if(spinning)loop()}window.toggleSpin=toggleSpin;function loop(){if(!spinning)return;angle=m360(angle+1);upd(angle);requestAnimationFrame(loop)}upd(0)})();</script></body></html>`
}

/* ════════════════════════════════════════════════════════════════
   ANALYSIS VIEW — Olivia Paisley style measurement guide
   ════════════════════════════════════════════════════════════════ */
function AnalysisView({result,photoUrl}:{result:any,photoUrl:string|null}){
  const m=result,bd=BODY_DATA[m.body_type]||BODY_DATA['Rectangle']
  const mLines=[
    {label:'BUST',y:27,val:`${m.bust_cm}cm`,color:'#00d4ff'},
    {label:'WAIST',y:38,val:`${m.waist_cm}cm`,color:'#ffd700'},
    {label:'HIGH HIP',y:48,val:`${m.high_hip_cm||'—'}cm`,color:'#ff80ff'},
    {label:'LOW HIP',y:56,val:`${m.hip_cm}cm`,color:'#a080ff'},
  ]
  return(
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',background:'#000',minHeight:380}}>
        {photoUrl?<img src={photoUrl} alt="analysis" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top'}}/>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:380,color:'#303060'}}>Photo unavailable</div>}
        {photoUrl&&mLines.map(l=>(
          <div key={l.label} style={{position:'absolute',left:'4%',right:'4%',top:`${l.y}%`,borderTop:`2px solid ${l.color}`,display:'flex',justifyContent:'space-between',pointerEvents:'none'}}>
            <span style={{fontSize:9,fontWeight:800,color:l.color,background:'rgba(0,0,0,0.6)',padding:'1px 5px',borderRadius:3,marginTop:-14}}>{l.label}</span>
            <span style={{fontSize:10,fontWeight:800,color:l.color,background:'rgba(0,0,0,0.6)',padding:'1px 6px',borderRadius:3,marginTop:-16}}>{l.val}</span>
          </div>
        ))}
        <div style={{position:'absolute',top:10,left:10,background:'rgba(10,6,30,0.88)',border:'1px solid rgba(139,92,246,0.4)',borderRadius:8,padding:'4px 10px',display:'flex',gap:6}}>
          <span style={{color:'#ffd700',fontWeight:800,fontSize:14}}>{m.size}</span>
          <span style={{color:'#8060c0',fontSize:11}}>{bd.icon} {m.body_type}</span>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <span style={{fontSize:28}}>{bd.icon}</span>
            <div><div style={{color:'#e8c99a',fontWeight:800,fontSize:16}}>{m.body_type}</div><div style={{color:'#4a4070',fontSize:11}}>{bd.shape}</div></div>
          </div>
          <div style={{color:'#5050a0',fontSize:12,lineHeight:1.6,marginBottom:10}}>{bd.desc}</div>
          <div style={{marginBottom:8}}>
            <div style={{color:'#22c55e',fontWeight:700,fontSize:12,marginBottom:5}}>✓ Wear</div>
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
        <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
          <div style={{color:'#e8c99a',fontWeight:700,fontSize:12,marginBottom:10}}>📏 Measurements</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6}}>
            {([['Shoulder',m.shoulder_cm,'#80ff80'],['Bust',m.bust_cm,'#00d4ff'],['Waist',m.waist_cm,'#ffd700'],['Hip',m.hip_cm,'#a080ff'],['Height',m.height_cm,'#c0c0ff'],['Inseam',m.inseam_cm,'#a0c0ff']] as [string,any,string][]).map(([k,v,c])=>(
              <div key={k} style={{background:'#06061a',border:`1px solid ${c}22`,borderRadius:8,padding:'8px 10px'}}>
                <div style={{color:'#303060',fontSize:9,textTransform:'uppercase'}}>{k}</div>
                <div style={{color:c,fontWeight:800,fontSize:15}}>{v||'—'}<span style={{fontSize:9,color:'#303060'}}>cm</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   COLOURS & SHOP TABS (simplified for space)
   ════════════════════════════════════════════════════════════════ */
function ColoursTab({result}:{result:any}){
  const st=result.skin_tone||'Medium',pal=SKIN_PALETTES[st]||SKIN_PALETTES['Medium']
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16,display:'flex',gap:14,alignItems:'center'}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:pal.hex,border:'3px solid rgba(255,255,255,0.12)'}}/>
        <div style={{flex:1}}><div style={{color:'#e8c99a',fontWeight:800,fontSize:15}}>{st} Skin</div><div style={{color:'#5050a0',fontSize:12}}>{pal.tip}</div></div>
      </div>
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
        <div style={{color:'#22c55e',fontWeight:700,fontSize:13,marginBottom:12}}>✨ Best Colors</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:8}}>
          {pal.best.map(c=>(
            <div key={c} style={{display:'flex',alignItems:'center',gap:8,background:'#08081e',border:'1px solid #161640',borderRadius:10,padding:'8px 10px'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:COLOR_HEX[c]||'#888'}}/>
              <div><div style={{color:'#c0b0e0',fontSize:11,fontWeight:700}}>{c}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ShopTab({result,category}:{result:any,category:string}){
  const bt=result.body_type,size=result.size,best=new Set(result.best_colors||[]),all=PRODUCTS[category]||PRODUCTS.Women
  const matched=all.filter((p:any)=>p.body.includes(bt))
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
        <div style={{color:'#e8c99a',fontWeight:800,fontSize:14,marginBottom:6}}>🛍 Best for {bt} · Size {size}</div>
        <div style={{color:'#4a4070',fontSize:11}}>Showing {matched.length} recommendations</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
        {matched.map((p:any)=>(
          <div key={p.name} style={{background:'#0c0c28',border:'1px solid #1a1840',borderRadius:14,padding:16}}>
            <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:6}}>{p.name}</div>
            <div style={{color:'#252558',fontSize:11,marginBottom:12}}>Sizes: {p.sizes.join(' · ')}</div>
            <div style={{display:'flex',gap:8}}>
              <a href={p.amazon} target="_blank" rel="noreferrer" style={{flex:1,background:'#ff9900',color:'#000',padding:'8px 0',borderRadius:8,fontWeight:700,fontSize:12,textDecoration:'none',textAlign:'center'}}>🛒 Amazon</a>
              <a href={p.flipkart} target="_blank" rel="noreferrer" style={{flex:1,background:'#2874f0',color:'#fff',padding:'8px 0',borderRadius:8,fontWeight:700,fontSize:12,textDecoration:'none',textAlign:'center'}}>🛒 Flipkart</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════════════════════════════ */
export default function Home(){
  const[step,setStep]=useState<'upload'|'result'>('upload')
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState('')
  const[result,setResult]=useState<any>(null)
  const[photoUrl,setPhotoUrl]=useState<string|null>(null)
  const[preview,setPreview]=useState<string|null>(null)
  const[category,setCategory]=useState('Women')
  const[userHeight,setUserHeight]=useState('')
  const[dressB64,setDressB64]=useState<string|null>(null)
  const[dressPreview,setDressPreview]=useState<string|null>(null)
  const[dressLoading,setDressLoading]=useState(false)
  const[realFaceB64,setRealFaceB64]=useState<string|null>(null)
  const[photoTryOnUrl,setPhotoTryOnUrl]=useState<string|null>(null)
  const[activeTab,setActiveTab]=useState<'avatar'|'photo'|'analysis'|'colours'|'shop'>('avatar')
  const fileRef=useRef<HTMLInputElement>(null),dressRef=useRef<HTMLInputElement>(null)

  const analyze=async(file:File)=>{
    setLoading(true);setError('')
    try{
      setPhotoUrl(URL.createObjectURL(file))
      const form=new FormData()
      form.append('file',file);form.append('category',category)
      if(userHeight)form.append('user_height',userHeight)
      const response=await fetch(`${BACKEND_URL}/analyze`,{method:'POST',body:form})
      const data=await response.json()
      if(data.error){setError(data.error);setLoading(false);return}
      setResult(data)
      try{
        const faceForm=new FormData();faceForm.append('file',file)
        const faceResponse=await fetch(`${BACKEND_URL}/extract-face`,{method:'POST',body:faceForm})
        const faceData=await faceResponse.json()
        if(faceData.success&&faceData.face_b64){setRealFaceB64(faceData.face_b64);console.log('✅ Real face extracted')}
      }catch{console.log('Face extraction skipped')}
      extractDress(file,true)
      setStep('result')
    }catch(e:any){setError(e.message)}
    setLoading(false)
  }

  const extractDress=async(file:File,silent=false)=>{
    if(!silent)setDressLoading(true)
    try{
      const form=new FormData();form.append('file',file)
      const response=await fetch(`${BACKEND_URL}/extract-dress`,{method:'POST',body:form})
      const data=await response.json()
      if(!data.error&&data.dress_b64){setDressB64(data.dress_b64);setDressPreview(`data:image/png;base64,${data.dress_b64}`)}
    }catch(err){console.error('Dress extraction failed',err)}
    if(!silent)setDressLoading(false)
  }

  const generatePhotoTryOn=async()=>{
    if(!photoUrl||!dressB64||!result)return
    setDressLoading(true)
    try{
      const form=new FormData()
      const photoBlob=await fetch(photoUrl).then(r=>r.blob())
      form.append('person_image',photoBlob)
      form.append('dress_b64',dressB64)
      form.append('measurements',JSON.stringify(result))
      const response=await fetch(`${BACKEND_URL}/virtual-tryon`,{method:'POST',body:form})
      const data=await response.json()
      if(data.tryon_b64){setPhotoTryOnUrl(`data:image/jpeg;base64,${data.tryon_b64}`);setActiveTab('photo')}
    }catch(err){console.error('Photo try-on failed',err)}
    setDressLoading(false)
  }

  const clearDress=()=>{setDressB64(null);setDressPreview(null);setPhotoTryOnUrl(null)}

  const avatarFrame=(withDress:boolean)=>{
    if(!result)return null
    const k=`av-${withDress&&dressB64?dressB64.slice(-8):'bare'}-${realFaceB64?'real':'default'}`
    return<div style={{background:'#08081a',borderRadius:16,overflow:'hidden',minHeight:520}}><iframe key={k} srcDoc={buildAvatar(result,withDress?dressB64:null,realFaceB64)} style={{width:'100%',height:600,border:'none'}} title="avatar" sandbox="allow-scripts"/></div>
  }

  const tabBtn=(id:string,label:string)=><button onClick={()=>setActiveTab(id as any)} style={{padding:'10px 16px',border:'none',cursor:'pointer',fontWeight:700,fontSize:13,background:'transparent',color:activeTab===id?'#e8c99a':'#38307a',borderBottom:activeTab===id?'2px solid #e8c99a':'2px solid transparent',whiteSpace:'nowrap'}}>{label}</button>

  return(
    <main style={{minHeight:'100vh',background:'#06061a',color:'#e8e0ff',fontFamily:'system-ui'}}>
      <div style={{background:'linear-gradient(135deg,#160830,#0a0420)',padding:'15px 22px',borderBottom:'1px solid #140d30',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div><h1 style={{margin:0,fontSize:'1.4rem',fontWeight:800,color:'#e8c99a'}}>👗 Fashion Stylist Pro v34</h1><p style={{margin:'2px 0 0',color:'#4a3870',fontSize:'0.72rem'}}>Real face · Professional photo try-on · AI analysis</p></div>
        {result&&<div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(20,14,50,0.9)',border:'1px solid #221848',borderRadius:12,padding:'6px 14px'}}><span style={{width:11,height:11,borderRadius:'50%',background:result.skin_hex,display:'inline-block'}}/>< span style={{fontWeight:800,color:'#ffd700',fontSize:15}}>{result.size}</span><span style={{color:'#7060a0',fontSize:12}}>{(BODY_DATA[result.body_type]||BODY_DATA['Rectangle']).icon} {result.body_type}</span></div>}
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'16px 12px'}}>
        {step==='upload'&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:16}}>
            <div style={{background:'#0c0c28',border:'1px solid #181840',borderRadius:18,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:4}}>📸 Upload Photo</div>
              <div style={{color:'#383068',fontSize:12,marginBottom:14}}>Full-body photo, facing camera. We'll extract your real face!</div>
              <div style={{display:'flex',gap:6,marginBottom:10}}>
                {['Women','Men','Kids'].map(c=><button key={c} onClick={()=>setCategory(c)} style={{flex:1,padding:'8px 0',borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12,border:`1px solid ${category===c?'#6030c0':'#181840'}`,background:category===c?'#22166a':'#090920',color:category===c?'#e8c99a':'#362870'}}>{c}</button>)}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,background:'#08081e',borderRadius:10,padding:'9px 12px',border:'1px solid #141440'}}>
                <span>📏</span><span style={{color:'#383060',fontSize:12}}>Height (opt.)</span><input type="number" value={userHeight} onChange={e=>setUserHeight(e.target.value)} placeholder="162" min="80" max="220" style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#e8e0ff',fontSize:14,fontWeight:700,minWidth:0}}/><span style={{color:'#282850',fontSize:12}}>cm</span>
              </div>
              <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${preview?'#4030a0':'#161638'}`,borderRadius:14,cursor:'pointer',background:'#080818',textAlign:'center',minHeight:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,padding:preview?6:28}}>
                {preview?<img src={preview} alt="preview" style={{maxHeight:260,borderRadius:10,objectFit:'contain'}}/>:<><div style={{fontSize:56}}>📷</div><div style={{color:'#3a2c80',fontSize:13,fontWeight:700}}>Choose photo</div></>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f){setPreview(URL.createObjectURL(f));analyze(f)}}}/>
              {loading&&<div style={{marginTop:12,padding:'12px 14px',background:'#120a30',border:'1px solid #301870',borderRadius:10,textAlign:'center'}}><div style={{color:'#8060d0',fontWeight:700,fontSize:13}}>⏳ Analysing...</div><div style={{color:'#3a2870',fontSize:11,marginTop:4}}>Extracting face · Measuring body · Generating avatar</div></div>}
              {error&&<div style={{marginTop:12,padding:'10px 14px',background:'#1e0606',border:'1px solid #500',borderRadius:8,color:'#ff6060',fontSize:12}}>❌ {error}</div>}
            </div>

            <div style={{background:'#0c0c28',border:'1px solid #141440',borderRadius:18,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:14}}>✨ Features</div>
              {([['👤','REAL FACE on 3D avatar'],['📸','Professional PHOTO try-on with warping'],['📊','Olivia Paisley measurement guide'],['🎨','Personalized color palette'],['🛍','Smart recommendations']] as [string,string][]).map(([icon,text])=><div key={text} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:13}}><span style={{fontSize:20}}>{icon}</span><span style={{color:'#4a3880',fontSize:13}}>{text}</span></div>)}
            </div>
          </div>
        )}

        {step==='result'&&result&&(
          <div>
            <div style={{display:'flex',borderBottom:'1px solid #141440',marginBottom:16,overflowX:'auto'}}>
              {tabBtn('avatar','🔄 3D Avatar')}
              {tabBtn('photo','📸 Photo Try-On')}
              {tabBtn('analysis','📊 Analysis')}
              {tabBtn('colours','🎨 Colors')}
              {tabBtn('shop','🛍 Shop')}
              <button onClick={()=>{setStep('upload');setResult(null);setPreview(null);setPhotoUrl(null);clearDress();setRealFaceB64(null)}} style={{marginLeft:'auto',padding:'7px 13px',background:'#110d30',color:'#3a2870',border:'1px solid #1a1640',borderRadius:8,cursor:'pointer',fontSize:12}}>📸 New Photo</button>
            </div>

            {activeTab==='avatar'&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:16}}>
                {avatarFrame(true)}
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:16,padding:18}}>
                    <div style={{color:'#e8c99a',fontWeight:800,marginBottom:4}}>👗 Upload Outfit</div>
                    <div style={{color:'#3a2e70',fontSize:12,marginBottom:12}}>{dressB64?'Outfit loaded! Upload another to swap.':'Upload dress to drape on avatar.'}</div>
                    <div onClick={()=>dressRef.current?.click()} style={{border:'2px dashed #161640',borderRadius:12,padding:14,cursor:'pointer',background:'#080818',textAlign:'center',minHeight:120,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8}}>
                      {dressPreview?<img src={dressPreview} alt="outfit" style={{maxHeight:120,borderRadius:8,objectFit:'contain'}}/>:<><span style={{fontSize:36}}>👗</span><span style={{color:'#2e2860',fontSize:12}}>Upload outfit</span></>}
                    </div>
                    <input ref={dressRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)extractDress(f)}}/>
                    {dressLoading&&<div style={{marginTop:8,color:'#6050c0',fontSize:12,textAlign:'center'}}>⏳ Processing...</div>}
                    {dressB64&&<><button onClick={generatePhotoTryOn} style={{marginTop:10,width:'100%',background:'linear-gradient(135deg,#4018a0,#7030c0)',color:'#fff',border:'none',padding:'10px',borderRadius:8,cursor:'pointer',fontSize:13,fontWeight:700}}>📸 Generate Photo Try-On</button><button onClick={clearDress} style={{marginTop:8,width:'100%',background:'#120818',color:'#903080',border:'1px solid #280c26',padding:'8px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>🗑 Remove</button></>}
                  </div>
                  <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}><span style={{fontSize:24}}>{(BODY_DATA[result.body_type]||BODY_DATA['Rectangle']).icon}</span><span style={{color:'#e8c99a',fontWeight:800,fontSize:15}}>{result.body_type}</span><span style={{background:'#2e1578',color:'#ffd700',padding:'3px 12px',borderRadius:8,fontWeight:800,fontSize:14}}>{result.size}</span></div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5}}>
                      {([['Bust',result.bust_cm],['Waist',result.waist_cm],['Hip',result.hip_cm],['Height',result.height_cm]] as [string,any][]).map(([k,v])=><div key={k} style={{background:'#06061a',border:'1px solid #101038',borderRadius:7,padding:'6px 8px',display:'flex',justifyContent:'space-between'}}><span style={{color:'#28285a',fontSize:10}}>{k}</span><span style={{color:'#c0b8e8',fontWeight:800,fontSize:13}}>{v}<span style={{fontSize:9}}>cm</span></span></div>)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab==='photo'&&(
              <div style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center'}}>
                {photoTryOnUrl?<><div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:16,padding:16,maxWidth:600,width:'100%'}}><div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:12}}>📸 Professional Photo Try-On</div><img src={photoTryOnUrl} alt="tryon" style={{width:'100%',borderRadius:12}}/><div style={{color:'#4a4070',fontSize:12,marginTop:10,textAlign:'center'}}>Dress warped to body pose with realistic lighting</div></div><button onClick={()=>setPhotoTryOnUrl(null)} style={{background:'#110d30',color:'#6050a0',border:'1px solid #1a1640',padding:'10px 20px',borderRadius:10,cursor:'pointer'}}>Generate New</button></>:<div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:16,padding:32,textAlign:'center',maxWidth:500}}><div style={{fontSize:56,marginBottom:12}}>📸</div><div style={{color:'#e8c99a',fontWeight:700,fontSize:16,marginBottom:8}}>Photo Try-On Not Generated</div><div style={{color:'#4a4070',fontSize:13,marginBottom:16}}>Upload dress in 3D Avatar tab and click "Generate Photo Try-On"</div><button onClick={()=>setActiveTab('avatar')} style={{background:'linear-gradient(135deg,#4018a0,#7030c0)',color:'#fff',border:'none',padding:'10px 24px',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:700}}>Go to 3D Avatar</button></div>}
              </div>
            )}

            {activeTab==='analysis'&&photoUrl&&<AnalysisView result={result} photoUrl={photoUrl}/>}
            {activeTab==='colours'&&<ColoursTab result={result}/>}
            {activeTab==='shop'&&<ShopTab result={result} category={category}/>}
          </div>
        )}
      </div>
    </main>
  )
}
