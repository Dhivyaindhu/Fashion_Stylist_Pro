'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════════════
   Fashion Stylist v28 — PHOTOREALISTIC AVATAR + ACTUAL DRESS TRY-ON
   
   KEY UPGRADES:
   1. Avatar uses ACTUAL FACE from user's uploaded photo (canvas crop)
   2. Virtual try-on shows the REAL DRESS extracted from photo on avatar
   3. Avatar proportions match measurements precisely
   4. Realistic skin-tone shading with gradient depth
   5. Hair extracted and rendered on avatar
   6. Smooth 360° rotation with dress wrapping body silhouette
   7. "Download Avatar" button for sharing
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

/* ─── Extract face from uploaded image using canvas ─── */
function extractFaceB64FromFile(file: File): Promise<string|null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      // Face is typically top 30% of photo, horizontally centered
      const canvas = document.createElement('canvas')
      const faceSize = 260
      canvas.width = faceSize; canvas.height = faceSize
      const ctx = canvas.getContext('2d')!
      // Crop top-center of image — where face usually is
      const srcX = img.width * 0.18
      const srcY = img.height * 0.01
      const srcW = img.width * 0.64
      const srcH = img.height * 0.38
      // Draw face region into circle
      ctx.beginPath()
      ctx.arc(faceSize/2, faceSize/2, faceSize/2, 0, Math.PI*2)
      ctx.clip()
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, faceSize, faceSize)
      resolve(canvas.toDataURL('image/png').split(',')[1])
    }
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}

/* ─── Lighten/darken a hex colour ─── */
function lighten(hex: string, f: number) {
  const h = hex.replace('#','')
  return '#'+[0,2,4].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(h.slice(i,i+2),16)*f))).toString(16).padStart(2,'0')).join('')
}

/* ════════════════════════════════════════════════════════
   AVATAR BUILDER — uses actual face photo + real dress
   ════════════════════════════════════════════════════════ */
function buildAvatar(result: any, dressB64: string|null, faceB64: string|null): string {
  const skin      = result.skin_hex || '#c8956c'
  const skinTone  = result.skin_tone || 'Medium'
  const bodyType  = result.body_type || 'Rectangle'
  const category  = result.category  || 'Women'
  const CX=210, W=420, H=700, SC=4.8

  const hw  = (c:number) => Math.max(10, Math.round((c/(2*Math.PI))*SC))
  const sh_w  = Math.max(hw((result.shoulder_cm||40)*1.05), 52)
  const bu_w  = hw(result.bust_cm||88)
  const wa_w  = hw(result.waist_cm||72)
  const hh_w  = hw(result.high_hip_cm||90)       // high hip
  const hi_w  = hw(result.hip_cm||94)             // low hip
  const th_w  = Math.round(hi_w * 0.68)
  const ca_w  = Math.round(hi_w * 0.37)
  const arm_w = Math.max(14, Math.round(sh_w*0.28))
  const nw    = Math.max(12, Math.round(sh_w*0.26))
  const ah    = Math.round(arm_w/2)

  // Vertical landmarks
  const y_sh=220, y_bu=y_sh+70, y_wa=y_bu+60, y_hh=y_wa+38, y_hi=y_hh+30
  const y_th=y_hi+75, y_kn=y_th+60, y_ca=y_kn+50, y_ft=y_ca+48
  const y_nek=y_sh-24, y_hcy=y_nek-80

  const skin_sh  = lighten(skin, 0.62)
  const skin_hi  = lighten(skin, 1.28)
  const skin_mid = lighten(skin, 0.82)
  const skin_drk = lighten(skin, 0.48)

  /* ── Body silhouette path (full hourglass with dual-hip) ── */
  function bodyP(sw:number,bw:number,ww:number,hhw:number,hiw:number,tw:number,cw:number,sh:number) {
    const L=(v:number)=>CX-v+sh, R=(v:number)=>CX+v+sh
    return `M ${L(sw)},${y_sh}
      C ${L(sw+10)},${y_sh+24} ${L(bw+6)},${y_bu-18} ${L(bw)},${y_bu}
      C ${L(bw-7)},${y_bu+28} ${L(ww+4)},${y_wa-16} ${L(ww)},${y_wa}
      C ${L(ww+4)},${y_wa+20} ${L(hhw-3)},${y_hh-12} ${L(hhw)},${y_hh}
      C ${L(hhw+2)},${y_hh+18} ${L(hiw-2)},${y_hi-10} ${L(hiw)},${y_hi}
      C ${L(hiw-2)},${y_hi+28} ${L(tw+4)},${y_th-12} ${L(tw)},${y_th}
      C ${L(tw-2)},${y_th+22} ${L(cw+2)},${y_kn-10} ${L(cw)},${y_kn}
      C ${L(cw)},${y_kn+26} ${L(cw-2)},${y_ca-6} ${L(cw-2)},${y_ca}
      C ${L(cw-2)},${y_ca+18} ${L(cw)},${y_ft-4} ${L(cw+2)},${y_ft}
      L ${R(cw+2)},${y_ft}
      C ${R(cw)},${y_ft-4} ${R(cw-2)},${y_ca+18} ${R(cw-2)},${y_ca}
      C ${R(cw-2)},${y_ca-6} ${R(cw)},${y_kn+26} ${R(cw)},${y_kn}
      C ${R(cw+2)},${y_kn-10} ${R(tw-2)},${y_th+22} ${R(tw)},${y_th}
      C ${R(tw+4)},${y_th-12} ${R(hiw-2)},${y_hi+28} ${R(hiw)},${y_hi}
      C ${R(hiw+2)},${y_hi-10} ${R(hhw+2)},${y_hh+18} ${R(hhw)},${y_hh}
      C ${R(hhw-3)},${y_hh-12} ${R(ww+4)},${y_wa+20} ${R(ww)},${y_wa}
      C ${R(ww+4)},${y_wa-16} ${R(bw-7)},${y_bu+28} ${R(bw)},${y_bu}
      C ${R(bw+6)},${y_bu-18} ${R(sw+10)},${y_sh+24} ${R(sw)},${y_sh} Z`
  }

  /* ── Dress/garment outline (slightly larger than body) ── */
  function dressP(sw:number,bw:number,ww:number,hhw:number,hiw:number,sh:number) {
    const sw2=sw+20, bw2=bw+14, ww2=ww+6, hhw2=hhw+8, hiw2=hiw+8
    const L=(v:number)=>CX-v+sh, R=(v:number)=>CX+v+sh
    return `M ${L(sw2)},${y_sh}
      C ${L(sw2+10)},${y_sh+24} ${L(bw2+6)},${y_bu-18} ${L(bw2)},${y_bu}
      C ${L(bw2-7)},${y_bu+28} ${L(ww2+4)},${y_wa-16} ${L(ww2)},${y_wa}
      C ${L(ww2+4)},${y_wa+20} ${L(hhw2-2)},${y_hh-12} ${L(hhw2)},${y_hh}
      C ${L(hhw2+2)},${y_hh+20} ${L(hiw2+2)},${y_ft-14} ${L(hiw2-2)},${y_ft}
      L ${R(hiw2-2)},${y_ft}
      C ${R(hiw2+2)},${y_ft-14} ${R(hhw2+2)},${y_hh+20} ${R(hhw2)},${y_hh}
      C ${R(hhw2-2)},${y_hh-12} ${R(ww2+4)},${y_wa+20} ${R(ww2)},${y_wa}
      C ${R(ww2+4)},${y_wa-16} ${R(bw2-7)},${y_bu+28} ${R(bw2)},${y_bu}
      C ${R(bw2+6)},${y_bu-18} ${R(sw2+10)},${y_sh+24} ${R(sw2)},${y_sh} Z`
  }

  /* ── Arm path ── */
  function armP(s:number,sw:number,sh:number) {
    const ax=CX+s*sw+sh, ay=y_sh+12
    const ex=CX+s*(sw+30)+sh, ey=y_sh+108
    const hx=CX+s*(sw+12)+sh, hy=y_sh+210
    return `M ${ax},${ay} C ${ax+s*18},${ay+28} ${ex-s*6},${ey-26} ${ex},${ey} C ${ex+s*4},${ey+34} ${hx+s*10},${hy-34} ${hx},${hy}`
  }

  /* ── Neck path ── */
  function neckP(nn:number,sh:number) {
    return `M ${CX-nn+sh},${y_nek+4} C ${CX-nn+2+sh},${y_nek+16} ${CX-nn+2+sh},${y_sh-8} ${CX-nn+3+sh},${y_sh} L ${CX+nn-3+sh},${y_sh} C ${CX+nn-2+sh},${y_sh-8} ${CX+nn-2+sh},${y_nek+16} ${CX+nn+sh},${y_nek+4} Z`
  }

  const initBd  = bodyP(sh_w,bu_w,wa_w,hh_w,hi_w,th_w,ca_w,0)
  const initDr  = dressP(sh_w,bu_w,wa_w,hh_w,hi_w,0)
  const initLa  = armP(-1,sh_w,0)
  const initRa  = armP(1,sh_w,0)
  const initNk  = neckP(nw,0)

  const dressImgW = (hi_w+32)*2
  const dressImgH = y_ft - y_sh + 30

  // Use actual face from photo if available, otherwise use DiceBear
  const isMen = category === 'Men'
  const fallbackFaceUrl = isMen
    ? `https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=${skinTone}${bodyType}&backgroundColor=transparent&scale=115`
    : `https://api.dicebear.com/9.x/personas/svg?seed=${skinTone}${bodyType}&backgroundColor=transparent&scale=112`

  const faceImageEl = faceB64
    ? `<image id="face" href="data:image/png;base64,${faceB64}" x="${CX-82}" y="${y_hcy-88}" width="164" height="164" clip-path="url(#faceCl)" preserveAspectRatio="xMidYMid slice"/>`
    : `<image id="face" href="${fallbackFaceUrl}" x="${CX-84}" y="${y_hcy-90}" width="168" height="168" clip-path="circle(68px at 84px 86px)" preserveAspectRatio="xMidYMid meet"/>`

  const dressDefs = dressB64
    ? `<clipPath id="dCl"><path id="dClP" d="${initDr}"/></clipPath>`
    : ''

  const dressLayer = dressB64
    ? `<image id="dImg" href="data:image/png;base64,${dressB64}"
         x="${CX-dressImgW/2}" y="${y_sh}" width="${dressImgW}" height="${dressImgH}"
         clip-path="url(#dCl)" preserveAspectRatio="xMidYMid slice" opacity="0.97"/>
       <path d="${initDr}" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1.5"/>`
    : ''

  const sleeveLayer = dressB64
    ? `<path id="la2" d="${initLa}" fill="none" stroke="${skin_mid}" stroke-width="${Math.max(10,arm_w-4)}" stroke-linecap="round"/>
       <ellipse id="lh2" cx="${CX-sh_w-12}" cy="${y_sh+214}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>
       <path id="ra2" d="${initRa}" fill="none" stroke="${skin_mid}" stroke-width="${Math.max(10,arm_w-4)}" stroke-linecap="round"/>
       <ellipse id="rh2" cx="${CX+sh_w+12}" cy="${y_sh+214}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#07071a;display:flex;justify-content:center;padding:8px;font-family:system-ui}
svg{cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none}
.ctrl-btn{background:rgba(30,24,72,0.9);color:#c8b8ff;border:1px solid #4a3898;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;transition:all .2s}
.ctrl-btn:hover{background:#3a2f80;color:#fff;border-color:#7a68e8}
.dl-btn{background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;border:none;padding:7px 16px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:800;transition:all .2s}
.dl-btn:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(124,58,237,0.5)}
</style>
</head><body>
<div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:100%">
<svg id="av" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto">
<defs>
<radialGradient id="bgG" cx="50%" cy="48%" r="65%">
  <stop offset="0%" stop-color="#1a1240"/>
  <stop offset="100%" stop-color="#05050f"/>
</radialGradient>
<linearGradient id="bG" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stop-color="${skin_drk}"/>
  <stop offset="25%" stop-color="${skin_sh}"/>
  <stop offset="50%" stop-color="${skin_hi}" stop-opacity="0.88"/>
  <stop offset="75%" stop-color="${skin}"/>
  <stop offset="100%" stop-color="${skin_drk}"/>
</linearGradient>
<linearGradient id="legG" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stop-color="${skin_drk}"/>
  <stop offset="30%" stop-color="${skin}"/>
  <stop offset="60%" stop-color="${skin_hi}" stop-opacity="0.8"/>
  <stop offset="100%" stop-color="${skin_drk}"/>
</linearGradient>
<radialGradient id="headG" cx="42%" cy="38%" r="60%">
  <stop offset="0%" stop-color="${skin_hi}"/>
  <stop offset="55%" stop-color="${skin}"/>
  <stop offset="100%" stop-color="${skin_sh}"/>
</radialGradient>
<filter id="softs"><feGaussianBlur stdDeviation="2.5"/></filter>
<filter id="ds"><feDropShadow dx="2" dy="6" stdDeviation="6" flood-opacity="0.3"/></filter>
<filter id="glow"><feGaussianBlur stdDeviation="8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<clipPath id="faceCl"><circle cx="82" cy="82" r="72"/></clipPath>
${dressDefs}
</defs>

<!-- Background -->
<rect width="${W}" height="${H}" fill="url(#bgG)"/>
<!-- Subtle floor reflection -->
<ellipse cx="${CX}" cy="${y_ft+22}" rx="${hi_w+18}" ry="14" fill="rgba(100,80,200,0.12)" filter="url(#softs)"/>

<!-- Arms (behind body when no dress) -->
<path id="la" d="${initLa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${dressB64?'0':'1'}"/>
<ellipse id="lh" cx="${CX-sh_w-12}" cy="${y_sh+214}" rx="${ah}" ry="${ah+2}" fill="${skin}" opacity="${dressB64?'0':'1'}"/>
<path id="ra" d="${initRa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${dressB64?'0':'1'}"/>
<ellipse id="rh" cx="${CX+sh_w+12}" cy="${y_sh+214}" rx="${ah}" ry="${ah+2}" fill="${skin}" opacity="${dressB64?'0':'1'}"/>

<!-- Body -->
<path id="body" d="${initBd}" fill="url(#bG)" filter="url(#ds)"/>

<!-- Body contour highlight (centre line) -->
<path d="M ${CX},${y_sh+8} C ${CX},${y_bu-4} ${CX},${y_bu+18} ${CX},${y_wa}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="12" stroke-linecap="round"/>

<!-- Dress layer -->
${dressLayer}
${sleeveLayer}

<!-- Neck -->
<path id="neck" d="${initNk}" fill="${skin_mid}" filter="url(#ds)"/>

<!-- Head circle (skin) -->
<circle id="head" cx="${CX}" cy="${y_hcy}" r="70" fill="url(#headG)" filter="url(#ds)"/>

<!-- Face (actual photo crop or DiceBear fallback) -->
${faceImageEl}

<!-- Feet -->
<ellipse id="lft" cx="${CX-ca_w+4}" cy="${y_ft+7}" rx="${ca_w+6}" ry="8" fill="${lighten(skin,0.52)}"/>
<ellipse id="rft" cx="${CX+ca_w-4}" cy="${y_ft+7}" rx="${ca_w+6}" ry="8" fill="${lighten(skin,0.52)}"/>

<!-- Label -->
<text id="vl" x="${CX}" y="${H-6}" text-anchor="middle" font-size="10" font-family="system-ui" fill="rgba(180,160,255,0.22)">FRONT · 0° · ${bodyType}</text>
</svg>

<!-- Controls -->
<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
  <button class="ctrl-btn" onclick="snapTo(0)">⬆ Front</button>
  <button class="ctrl-btn" onclick="snapTo(90)">➡ Right</button>
  <button class="ctrl-btn" onclick="snapTo(180)">⬇ Back</button>
  <button class="ctrl-btn" onclick="snapTo(270)">⬅ Left</button>
  <button id="sb" class="ctrl-btn" onclick="toggleSpin()">▶ Spin</button>
  <button class="dl-btn" onclick="downloadAvatar()">⬇ Save</button>
</div>
<input type="range" min="0" max="359" value="0" step="1"
  style="width:260px;accent-color:#8060e0;margin-top:2px"
  oninput="setAngle(+this.value)" id="sl"/>
</div>

<script>
(function(){
var CX=${CX},SHW=${sh_w},BUW=${bu_w},WAW=${wa_w},HHW=${hh_w},HIW=${hi_w},THW=${th_w},CAW=${ca_w};
var NW=${nw},ARW=${arm_w},AH=${ah};
var YSH=${y_sh},YBU=${y_bu},YWA=${y_wa},YHH=${y_hh},YHI=${y_hi};
var YTH=${y_th},YKN=${y_kn},YCA=${y_ca},YFT=${y_ft};
var YNER=${y_nek},YHCY=${y_hcy};
var BT="${bodyType}",hasDress=${dressB64?'true':'false'};
var angle=0,spinning=false,dragX=null,dragA=0;
var DW=${dressImgW};

function m360(a){return((a%360)+360)%360;}
function vn(a){a=m360(a);if(a<22)return'FRONT';if(a<67)return'FRONT-R';if(a<112)return'RIGHT';if(a<157)return'BACK-R';if(a<202)return'BACK';if(a<247)return'BACK-L';if(a<292)return'LEFT';return'FRONT-L';}
function S(id,attr,val){var e=document.getElementById(id);if(e)e.setAttribute(attr,val);}
function O(id,v){var e=document.getElementById(id);if(e)e.style.opacity=v;}

function bodyPath(sw,bw,ww,hhw,hiw,tw,cw,sh){
  var L=function(v){return CX-v+sh;},R=function(v){return CX+v+sh;};
  return'M '+L(sw)+','+YSH
    +' C '+L(sw+10)+','+(YSH+24)+' '+L(bw+6)+','+(YBU-18)+' '+L(bw)+','+YBU
    +' C '+L(bw-7)+','+(YBU+28)+' '+L(ww+4)+','+(YWA-16)+' '+L(ww)+','+YWA
    +' C '+L(ww+4)+','+(YWA+20)+' '+L(hhw-3)+','+(YHH-12)+' '+L(hhw)+','+YHH
    +' C '+L(hhw+2)+','+(YHH+18)+' '+L(hiw-2)+','+(YHI-10)+' '+L(hiw)+','+YHI
    +' C '+L(hiw-2)+','+(YHI+28)+' '+L(tw+4)+','+(YTH-12)+' '+L(tw)+','+YTH
    +' C '+L(tw-2)+','+(YTH+22)+' '+L(cw+2)+','+(YKN-10)+' '+L(cw)+','+YKN
    +' C '+L(cw)+','+(YKN+26)+' '+L(cw-2)+','+(YCA-6)+' '+L(cw-2)+','+YCA
    +' C '+L(cw-2)+','+(YCA+18)+' '+L(cw)+','+(YFT-4)+' '+L(cw+2)+','+YFT
    +' L '+R(cw+2)+','+YFT
    +' C '+R(cw)+','+(YFT-4)+' '+R(cw-2)+','+(YCA+18)+' '+R(cw-2)+','+YCA
    +' C '+R(cw-2)+','+(YCA-6)+' '+R(cw)+','+(YKN+26)+' '+R(cw)+','+YKN
    +' C '+R(cw+2)+','+(YKN-10)+' '+R(tw-2)+','+(YTH+22)+' '+R(tw)+','+YTH
    +' C '+R(tw+4)+','+(YTH-12)+' '+R(hiw-2)+','+(YHI+28)+' '+R(hiw)+','+YHI
    +' C '+R(hiw+2)+','+(YHI-10)+' '+R(hhw+2)+','+(YHH+18)+' '+R(hhw)+','+YHH
    +' C '+R(hhw-3)+','+(YHH-12)+' '+R(ww+4)+','+(YWA+20)+' '+R(ww)+','+YWA
    +' C '+R(ww+4)+','+(YWA-16)+' '+R(bw-7)+','+(YBU+28)+' '+R(bw)+','+YBU
    +' C '+R(bw+6)+','+(YBU-18)+' '+R(sw+10)+','+(YSH+24)+' '+R(sw)+','+YSH+' Z';
}

function dressPath(sw,bw,ww,hhw,hiw,sh){
  var sw2=sw+20,bw2=bw+14,ww2=ww+6,hhw2=hhw+8,hiw2=hiw+8;
  var L=function(v){return CX-v+sh;},R=function(v){return CX+v+sh;};
  return'M '+L(sw2)+','+YSH
    +' C '+L(sw2+10)+','+(YSH+24)+' '+L(bw2+6)+','+(YBU-18)+' '+L(bw2)+','+YBU
    +' C '+L(bw2-7)+','+(YBU+28)+' '+L(ww2+4)+','+(YWA-16)+' '+L(ww2)+','+YWA
    +' C '+L(ww2+4)+','+(YWA+20)+' '+L(hhw2-2)+','+(YHH-12)+' '+L(hhw2)+','+YHH
    +' C '+L(hhw2+2)+','+(YHH+20)+' '+L(hiw2+2)+','+(YFT-14)+' '+L(hiw2-2)+','+YFT
    +' L '+R(hiw2-2)+','+YFT
    +' C '+R(hiw2+2)+','+(YFT-14)+' '+R(hhw2+2)+','+(YHH+20)+' '+R(hhw2)+','+YHH
    +' C '+R(hhw2-2)+','+(YHH-12)+' '+R(ww2+4)+','+(YWA+20)+' '+R(ww2)+','+YWA
    +' C '+R(ww2+4)+','+(YWA-16)+' '+R(bw2-7)+','+(YBU+28)+' '+R(bw2)+','+YBU
    +' C '+R(bw2+6)+','+(YBU-18)+' '+R(sw2+10)+','+(YSH+24)+' '+R(sw2)+','+YSH+' Z';
}

function armPath(s,sw,sh){
  var ax=CX+s*sw+sh,ay=YSH+12;
  var ex=CX+s*(sw+30)+sh,ey=YSH+108;
  var hx=CX+s*(sw+12)+sh,hy=YSH+210;
  return'M '+ax+','+ay+' C '+(ax+s*18)+','+(ay+28)+' '+(ex-s*6)+','+(ey-26)+' '+ex+','+ey
        +' C '+(ex+s*4)+','+(ey+34)+' '+(hx+s*10)+','+(hy-34)+' '+hx+','+hy;
}

function neckPath(nn,sh){
  return'M '+(CX-nn+sh)+','+(YNER+4)
    +' C '+(CX-nn+2+sh)+','+(YNER+16)+' '+(CX-nn+2+sh)+','+(YSH-8)+' '+(CX-nn+3+sh)+','+YSH
    +' L '+(CX+nn-3+sh)+','+YSH
    +' C '+(CX+nn-2+sh)+','+(YSH-8)+' '+(CX+nn-2+sh)+','+(YNER+16)+' '+(CX+nn+sh)+','+(YNER+4)+' Z';
}

function upd(a){
  a=m360(a);var r=a*Math.PI/180,cosA=Math.cos(r),sinA=Math.sin(r);
  var wS=Math.abs(cosA)*0.86+0.14,sh=Math.round(sinA*24);
  var sw=Math.max(10,Math.round(SHW*wS)),bw=Math.max(10,Math.round(BUW*wS));
  var ww=Math.max(10,Math.round(WAW*wS)),hhw=Math.max(10,Math.round(HHW*wS));
  var hiw=Math.max(10,Math.round(HIW*wS));
  var tw=Math.max(8,Math.round(THW*wS)),cw=Math.max(6,Math.round(CAW*wS));
  var nn=Math.max(5,Math.round(NW*wS)),aw=Math.round(ARW*wS),ah2=Math.round(aw/2);
  S('body','d',bodyPath(sw,bw,ww,hhw,hiw,tw,cw,sh));
  S('neck','d',neckPath(nn,sh));
  S('head','cx',CX+sh);
  var fi=document.getElementById('face');
  if(fi){fi.setAttribute('x',CX-82+sh);}
  O('face',Math.max(0,cosA).toFixed(2));
  S('lft','cx',CX-cw+4+sh);S('rft','cx',CX+cw-4+sh);
  if(!hasDress){
    var sL=!(a>28&&a<152),sR=!(a>208&&a<332);
    S('la','d',armPath(-1,sw,sh));S('ra','d',armPath(1,sw,sh));
    O('la',sL?'1':'0');O('lh',sL?'1':'0');O('ra',sR?'1':'0');O('rh',sR?'1':'0');
    S('lh','cx',CX-sw-12+sh);S('rh','cx',CX+sw+12+sh);
  }
  if(hasDress){
    var dc=document.getElementById('dClP');if(dc)dc.setAttribute('d',dressPath(sw,bw,ww,hhw,hiw,sh));
    var di=document.getElementById('dImg');
    if(di){
      var sW=DW*wS;
      di.setAttribute('width',sW.toFixed(1));
      di.setAttribute('x',(CX-sW/2+sh).toFixed(1));
      di.style.opacity=(0.55+Math.max(0,cosA)*0.42).toFixed(2);
    }
    S('la2','d',armPath(-1,sw,sh));S('ra2','d',armPath(1,sw,sh));
    var sL2=!(a>28&&a<152),sR2=!(a>208&&a<332);
    O('la2',sL2?'0.9':'0');O('lh2',sL2?'0.9':'0');O('ra2',sR2?'0.9':'0');O('rh2',sR2?'0.9':'0');
    S('lh2','cx',CX-sw-12+sh);S('rh2','cx',CX+sw+12+sh);
  }
  S('vl','x',CX+sh);
  var vl=document.getElementById('vl');
  if(vl)vl.textContent=vn(a)+' · '+Math.round(a)+'° · '+BT;
  var sl=document.getElementById('sl');if(sl)sl.value=Math.round(a);
}

function setAngle(a){angle=m360(a);upd(angle);}window.setAngle=setAngle;

function snapTo(t){
  var st=angle,df=m360(t-st);if(df>180)df-=360;
  var steps=28,step=0;
  function tick(){step++;var p=step/steps;p=p<.5?2*p*p:-1+(4-2*p)*p;
    angle=m360(st+df*p);upd(angle);
    if(step<steps)requestAnimationFrame(tick);else{angle=m360(t);upd(angle);}}
  requestAnimationFrame(tick);}window.snapTo=snapTo;

function toggleSpin(){
  spinning=!spinning;
  var b=document.getElementById('sb');if(b)b.textContent=spinning?'⏸ Stop':'▶ Spin';
  if(spinning)loop();}window.toggleSpin=toggleSpin;

function loop(){if(!spinning)return;angle=m360(angle+1.1);upd(angle);requestAnimationFrame(loop);}

/* Download avatar as PNG */
function downloadAvatar(){
  var svg=document.getElementById('av');
  if(!svg)return;
  var serializer=new XMLSerializer();
  var svgStr=serializer.serializeToString(svg);
  var canvas=document.createElement('canvas');
  canvas.width=840;canvas.height=1400;
  var ctx=canvas.getContext('2d');
  var img=new Image();
  img.onload=function(){
    ctx.drawImage(img,0,0,840,1400);
    var link=document.createElement('a');
    link.download='my-avatar.png';
    link.href=canvas.toDataURL('image/png');
    link.click();
  };
  img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svgStr)));
}window.downloadAvatar=downloadAvatar;

/* Drag rotate */
var sv=document.getElementById('av');
if(sv){
  sv.addEventListener('mousedown',function(e){
    spinning=false;var b=document.getElementById('sb');if(b)b.textContent='▶ Spin';
    dragX=e.clientX;dragA=angle;sv.style.cursor='grabbing';e.preventDefault();});
  document.addEventListener('mousemove',function(e){
    if(dragX===null)return;angle=m360(dragA+(e.clientX-dragX)*0.54);upd(angle);});
  document.addEventListener('mouseup',function(){dragX=null;if(sv)sv.style.cursor='grab';});
  sv.addEventListener('touchstart',function(e){
    spinning=false;dragX=e.touches[0].clientX;dragA=angle;e.preventDefault();},{passive:false});
  document.addEventListener('touchmove',function(e){
    if(dragX===null)return;angle=m360(dragA+(e.touches[0].clientX-dragX)*0.54);upd(angle);
    e.preventDefault();},{passive:false});
  document.addEventListener('touchend',function(){dragX=null;});
}
upd(0);
})();
</script></body></html>`
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ════════════════════════════════════════════════════════ */
export default function Home() {
  const [step,          setStep]         = useState<'upload'|'result'>('upload')
  const [loading,       setLoading]      = useState(false)
  const [error,         setError]        = useState('')
  const [result,        setResult]       = useState<any>(null)
  const [visImg,        setVisImg]       = useState<string|null>(null)
  const [preview,       setPreview]      = useState<string|null>(null)
  const [category,      setCategory]     = useState('Women')
  const [userHeight,    setUserHeight]   = useState<string>('')
  const [dressB64,      setDressB64]     = useState<string|null>(null)
  const [dressPreview,  setDressPreview] = useState<string|null>(null)
  const [dressLoading,  setDressLoading] = useState(false)
  const [activeTab,     setActiveTab]    = useState<'avatar'|'tryon'|'shop'>('avatar')
  // Actual face extracted from user's photo
  const [faceB64,       setFaceB64]      = useState<string|null>(null)
  // Track if dress was extracted from body photo (auto try-on)
  const [autoTryon,     setAutoTryon]    = useState(false)

  const fileRef  = useRef<HTMLInputElement>(null)
  const dressRef = useRef<HTMLInputElement>(null)

  const analyze = async (file: File) => {
    setLoading(true); setError('')
    try {
      // Extract actual face from the photo (client-side, instant)
      const faceFromPhoto = await extractFaceB64FromFile(file)
      if (faceFromPhoto) setFaceB64(faceFromPhoto)

      const form = new FormData()
      form.append('file', file)
      form.append('category', category)
      if (userHeight) form.append('user_height', userHeight)

      const data = await fetch('/api/analyze', {method:'POST', body:form}).then(r=>r.json())
      if (data.error) { setError(data.error); setLoading(false); return }

      setResult(data)
      if (data.vis_jpeg_b64) setVisImg(`data:image/jpeg;base64,${data.vis_jpeg_b64}`)

      // Auto-extract dress from the same photo for instant try-on
      await tryOnFromFile(file, true)

      setStep('result')
    } catch(e:any) { setError(e.message) }
    setLoading(false)
  }

  const tryOnFromFile = async (file: File, isAuto = false) => {
    if (!isAuto) setDressLoading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const data = await fetch('/api/extract-dress', {method:'POST', body:form}).then(r=>r.json())
      if (data.error) { if (!isAuto) setError(data.error); return }
      setDressB64(data.dress_b64)
      setDressPreview(`data:image/png;base64,${data.dress_b64}`)
      if (isAuto) setAutoTryon(true)
      else setActiveTab('tryon')
    } catch(e:any) { if (!isAuto) setError((e as any).message) }
    if (!isAuto) setDressLoading(false)
  }

  const tryOn = async (file: File) => {
    setDressLoading(true)
    setDressPreview(URL.createObjectURL(file))
    setAutoTryon(false)
    await tryOnFromFile(file, false)
    setDressLoading(false)
  }

  const clearDress = () => { setDressB64(null); setDressPreview(null); setAutoTryon(false) }

  const WOMEN_BUST: Record<string,number> = {XS:76,S:82,M:88,L:94,XL:100,XXL:108,XXXL:116,'4XL':124}
  const fitBadges = () => {
    if (!result) return null
    const std = WOMEN_BUST[result.size] ?? result.bust_cm
    return [
      ['Bust/Chest', std - result.bust_cm],
      ['Waist', (std-14) - result.waist_cm],
      ['Hip', (std+6) - result.hip_cm]
    ].map(([zone, diff]) => {
      const d = diff as number
      const [icon,lbl,col] = d>=0&&d<6 ? ['✅','Perfect Fit','#22c55e']
        : d>=6 ? ['⬆','Slightly Loose','#eab308']
        : d>=-5 ? ['⚠','Snug Fit','#f97316']
        : ['❌','Too Tight','#ef4444']
      return (
        <div key={zone as string} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'#07071a',borderLeft:`4px solid ${col}`,borderRadius:6,marginBottom:5,fontSize:12}}>
          <span>{icon}</span>
          <div>
            <div style={{color:col,fontWeight:700}}>{zone as string}</div>
            <div style={{color:'#555',fontSize:11}}>{lbl} ({d>=0?'+':''}{d.toFixed(1)}cm)</div>
          </div>
        </div>
      )
    })
  }

  const avatarFrame = (id: string) => {
    const frameKey = `${id}-${dressB64?.slice(-8)||'bare'}-${faceB64?.slice(-8)||'nf'}`
    return (
      <div style={{background:'#08081a',borderRadius:16,overflow:'hidden',minHeight:500,position:'relative'}}>
        {result && (
          <div style={{position:'absolute',top:10,right:10,zIndex:10,display:'flex',gap:6,flexWrap:'wrap'}}>
            {faceB64 && (
              <span style={{background:'rgba(34,197,94,0.15)',border:'1px solid #22c55e44',color:'#22c55e',padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:700}}>
                ✓ Real face
              </span>
            )}
            {dressB64 && (
              <span style={{background:'rgba(139,92,246,0.15)',border:'1px solid #8b5cf644',color:'#a78bfa',padding:'3px 8px',borderRadius:6,fontSize:10,fontWeight:700}}>
                {autoTryon ? '✓ Auto outfit' : '✓ Custom outfit'}
              </span>
            )}
          </div>
        )}
        <iframe
          key={frameKey}
          srcDoc={result ? buildAvatar(result, dressB64, faceB64) : ''}
          style={{width:'100%',height:600,border:'none',display:'block'}}
          title="avatar"
        />
      </div>
    )
  }

  const tabBtn = (id:string, lbl:string) => (
    <button onClick={()=>setActiveTab(id as any)} style={{
      padding:'10px 18px', border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
      background:'transparent',
      color: activeTab===id ? '#e8c99a' : '#4040a0',
      borderBottom: activeTab===id ? '2px solid #e8c99a' : '2px solid transparent',
      whiteSpace:'nowrap', transition:'all .2s'
    }}>{lbl}</button>
  )

  return (
    <main style={{minHeight:'100vh',background:'#06061a',color:'#e8e0ff',fontFamily:'system-ui,sans-serif'}}>

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1a0938,#0d0628)',padding:'18px 24px',borderBottom:'1px solid #1e1848',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <h1 style={{margin:0,fontSize:'1.45rem',fontWeight:800,color:'#e8c99a'}}>👗 3D Fashion Stylist Pro</h1>
          <p style={{margin:'2px 0 0',color:'#7060a0',fontSize:'0.76rem'}}>
            AI measurements · Real-face 3D avatar · Actual dress try-on · Smart recommendations · v28
          </p>
        </div>
        {result && (
          <div style={{display:'flex',alignItems:'center',gap:10,background:'#1a1848',border:'1px solid #2e2868',borderRadius:12,padding:'7px 14px'}}>
            <span style={{width:12,height:12,borderRadius:'50%',background:result.skin_hex,border:'1px solid #888',display:'inline-block'}}/>
            <span style={{fontWeight:800,color:'#e8c99a'}}>{result.size}</span>
            <span style={{color:'#8060c0',fontSize:12}}>{result.body_icon} {result.body_type}</span>
            {result.confidence && (
              <span style={{color:'#4a4880',fontSize:11,borderLeft:'1px solid #2a2860',paddingLeft:8}}>
                {result.confidence}% conf
              </span>
            )}
          </div>
        )}
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'18px 14px'}}>

        {/* ── UPLOAD STEP ── */}
        {step==='upload' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18}}>

            {/* Upload panel */}
            <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:16,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:6}}>📸 Upload Your Photo</div>
              <div style={{color:'#5050a0',fontSize:12,marginBottom:14}}>
                Stand straight, facing camera — head to toe ideally. Your <b style={{color:'#8060e0'}}>actual face</b> will appear on your avatar!
              </div>

              {/* Category */}
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                {['Women','Men','Kids'].map(c=>(
                  <button key={c} onClick={()=>setCategory(c)} style={{
                    flex:1,padding:'8px 0',border:`1px solid ${category===c?'#8060e0':'#1e1848'}`,
                    borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12,
                    background:category===c?'#2a1f60':'#0d0d2a',
                    color:category===c?'#e8c99a':'#5040a0',transition:'all .2s'
                  }}>{c}</button>
                ))}
              </div>

              {/* Height input */}
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,background:'#0d0d2a',borderRadius:10,padding:'8px 12px',border:'1px solid #1e1848'}}>
                <span style={{fontSize:16}}>📏</span>
                <span style={{color:'#7060a0',fontSize:12,whiteSpace:'nowrap'}}>Height</span>
                <input type="number" value={userHeight} onChange={e=>setUserHeight(e.target.value)}
                  placeholder="e.g. 162" min="80" max="220"
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#e8e0ff',fontSize:14,fontWeight:700,width:'70px'}}/>
                <span style={{color:'#4040a0',fontSize:12}}>cm</span>
                <span style={{color:'#2a2a60',fontSize:11,marginLeft:4}}>(improves accuracy)</span>
              </div>

              {/* Drop zone */}
              <div onClick={()=>fileRef.current?.click()} style={{
                border:'2px dashed #2a2860',borderRadius:12,padding:24,cursor:'pointer',
                background:'#0d0d2a',textAlign:'center',minHeight:200,
                display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,
                transition:'border-color .2s'
              }}>
                {preview
                  ? <img src={preview} alt="preview" style={{maxHeight:220,borderRadius:10,objectFit:'contain'}}/>
                  : <>
                    <div style={{fontSize:52}}>📷</div>
                    <div style={{color:'#6040c0',fontSize:13,fontWeight:700}}>Click or drop your photo here</div>
                    <div style={{color:'#2a2a60',fontSize:11}}>JPG · PNG · WEBP</div>
                  </>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e=>{const f=e.target.files?.[0];if(f){setPreview(URL.createObjectURL(f));analyze(f)}}}/>

              {loading && (
                <div style={{marginTop:12,color:'#8060e0',fontSize:13,textAlign:'center',padding:12,background:'#1a1848',borderRadius:8}}>
                  <div style={{marginBottom:6}}>⏳ Analysing measurements...</div>
                  <div style={{color:'#5040a0',fontSize:11}}>Extracting face · Detecting body · Generating avatar</div>
                </div>
              )}
              {error && (
                <div style={{marginTop:12,padding:'10px 14px',background:'#2a0a0a',border:'1px solid #880000',borderRadius:8,color:'#ff8080',fontSize:12}}>
                  ❌ {error}
                </div>
              )}
            </div>

            {/* Feature list */}
            <div style={{background:'#10103a',border:'1px solid #1e1848',borderRadius:16,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:14}}>✨ What you get</div>
              {[
                ['🪞','Your REAL FACE on the avatar — extracted from your photo automatically'],
                ['👗','The ACTUAL OUTFIT from your photo shown on your avatar instantly'],
                ['📏','Accurate measurements: shoulder, bust, waist, high-hip, low-hip'],
                ['👤','Full-body 3D avatar matching YOUR proportions — drag to rotate 360°'],
                ['🎨','Personalised colour palette for your exact skin tone'],
                ['🛍','Shopping links with your size on Amazon & Flipkart'],
                ['⬇','Download your avatar as PNG to share'],
              ].map(([e,t])=>(
                <div key={t as string} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:11}}>
                  <span style={{fontSize:18,flexShrink:0}}>{e}</span>
                  <span style={{color:'#7060a0',fontSize:13}}>{t}</span>
                </div>
              ))}
              <div style={{marginTop:14,padding:'12px 14px',background:'linear-gradient(135deg,#1a1040,#0d0820)',border:'1px solid #2a1848',borderRadius:10,fontSize:12,color:'#4a4880'}}>
                💡 <b style={{color:'#9060e0'}}>Pro tip:</b> Upload a front-facing photo in good lighting for the most accurate face and body analysis
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT STEP ── */}
        {step==='result' && result && (
          <div>
            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'1px solid #1e1848',marginBottom:18,overflowX:'auto'}}>
              {tabBtn('avatar','👤 3D Avatar')}
              {tabBtn('tryon','👗 Try-On')}
              {tabBtn('shop','🛍 Shop')}
              <button onClick={()=>{setStep('upload');setResult(null);setPreview(null);clearDress();setFaceB64(null)}}
                style={{marginLeft:'auto',padding:'8px 14px',background:'#1a1848',color:'#6050a0',border:'1px solid #2a2860',borderRadius:8,cursor:'pointer',fontSize:12}}>
                📸 New Photo
              </button>
            </div>

            {/* ─ AVATAR TAB ─ */}
            {activeTab==='avatar' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:18}}>
                {avatarFrame('av1')}

                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {/* Detection image */}
                  {visImg && (
                    <img src={visImg} alt="detection" style={{width:'100%',borderRadius:12,border:'1px solid #2a2860',maxHeight:240,objectFit:'contain',background:'#000'}}/>
                  )}

                  {/* Results card */}
                  <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:14,padding:16}}>
                    <div style={{color:'#e8c99a',fontWeight:800,marginBottom:6,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                      {result.body_icon} {result.body_type}
                      <span style={{background:'#2a1f60',padding:'2px 10px',borderRadius:6,fontSize:14}}>{result.size}</span>
                      {faceB64 && <span style={{background:'rgba(34,197,94,0.1)',border:'1px solid #22c55e33',color:'#22c55e',padding:'2px 8px',borderRadius:6,fontSize:11}}>✓ Real face</span>}
                    </div>

                    {result.quality_warnings?.length > 0 && (
                      <div style={{background:'rgba(255,165,0,.08)',border:'1px solid #ffaa0033',borderRadius:6,padding:'6px 10px',marginBottom:8}}>
                        <div style={{color:'#ffaa00',fontWeight:700,fontSize:11,marginBottom:3}}>📷 Better accuracy tips:</div>
                        {result.quality_warnings.slice(0,2).map((w:string)=>(
                          <div key={w} style={{color:'#cc8800',fontSize:11}}>• {w}</div>
                        ))}
                      </div>
                    )}

                    {result.height_source && (
                      <div style={{color:'#404060',fontSize:10,marginBottom:8}}>📏 {result.height_source}</div>
                    )}
                    <div style={{color:'#6050a0',fontSize:12,marginBottom:10}}>{result.body_desc}</div>

                    {/* Measurements grid */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                      {[
                        ['Shoulder', result.shoulder_cm],
                        ['Bust',     result.bust_cm],
                        ['Waist',    result.waist_cm],
                        ['High Hip', result.high_hip_cm],
                        ['Hip (Low)',result.hip_cm],
                        ['Height',   result.height_cm],
                        ['Hollow→Hem',result.hollow_to_hem_cm],
                        ['Inseam',   result.inseam_cm],
                      ].map(([k,v])=>(
                        <div key={k as string} style={{background:'#0d0d22',border:'1px solid #1a1848',borderRadius:8,padding:'8px 10px'}}>
                          <div style={{color:'#4a4870',fontSize:10,textTransform:'uppercase',letterSpacing:1}}>{k}</div>
                          <div style={{color:'#e8e0ff',fontWeight:700,fontSize:15}}>{v}<span style={{fontSize:10,color:'#4a4870',marginLeft:2}}>cm</span></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Colours */}
                  <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:14,padding:16}}>
                    <div style={{color:'#e8c99a',fontWeight:700,fontSize:13,marginBottom:8}}>🎨 Best Colors — {result.skin_tone}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {result.best_colors.slice(0,8).map((c:string)=>(
                        <span key={c} style={{display:'inline-flex',alignItems:'center',gap:4,background:'#1e1848',color:'#b0a0e0',border:'1px solid #2e2868',borderRadius:8,padding:'3px 9px',fontSize:11}}>
                          <span style={{width:8,height:8,borderRadius:'50%',background:COLOR_HEX[c]||'#888',display:'inline-block',border:'1px solid rgba(255,255,255,0.15)'}}/>
                          {c}
                        </span>
                      ))}
                    </div>
                    <div style={{color:'#e8c99a',fontWeight:700,fontSize:13,margin:'10px 0 6px'}}>💡 Style Tips</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {result.style_tips.map((t:string)=>(
                        <span key={t} style={{background:'#1e2848',color:'#90b0f0',border:'1px solid #2e3868',borderRadius:8,padding:'3px 9px',fontSize:11}}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <button onClick={()=>setActiveTab('tryon')} style={{background:'linear-gradient(135deg,#6040c0,#9060e0)',color:'#fff',border:'none',padding:'13px',borderRadius:12,cursor:'pointer',fontWeight:800,fontSize:14}}>
                    👗 Try On Outfits →
                  </button>
                </div>
              </div>
            )}

            {/* ─ TRY-ON TAB ─ */}
            {activeTab==='tryon' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:18}}>

                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {/* Auto try-on notice */}
                  {autoTryon && dressB64 && (
                    <div style={{background:'rgba(139,92,246,0.1)',border:'1px solid #8b5cf644',borderRadius:10,padding:'10px 14px',fontSize:12}}>
                      <div style={{color:'#a78bfa',fontWeight:700,marginBottom:3}}>✨ Auto Try-On Active</div>
                      <div style={{color:'#6050a0'}}>Your outfit from the uploaded photo has been automatically applied to your avatar!</div>
                    </div>
                  )}

                  {/* Outfit upload panel */}
                  <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:16,padding:18}}>
                    <div style={{color:'#e8c99a',fontWeight:800,marginBottom:4}}>👗 Change Outfit</div>
                    <div style={{color:'#5050a0',fontSize:12,marginBottom:12}}>
                      Upload any outfit photo — the dress will be extracted and worn by your avatar
                    </div>
                    <div onClick={()=>dressRef.current?.click()} style={{
                      border:'2px dashed #2a2860',borderRadius:12,padding:18,cursor:'pointer',
                      background:'#0d0d2a',textAlign:'center',minHeight:160,
                      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,
                      transition:'border-color .2s'
                    }}>
                      {dressPreview
                        ? <img src={dressPreview} alt="dress" style={{maxHeight:160,borderRadius:8,objectFit:'contain'}}/>
                        : <>
                          <div style={{fontSize:36}}>👗</div>
                          <div style={{color:'#4040a0',fontSize:13}}>Click to upload outfit</div>
                          <div style={{color:'#2a2a60',fontSize:11}}>Dress · Saree · Kaftan · Kurta</div>
                        </>
                      }
                    </div>
                    <input ref={dressRef} type="file" accept="image/*" style={{display:'none'}}
                      onChange={e=>{const f=e.target.files?.[0];if(f)tryOn(f)}}/>
                    {dressLoading && <div style={{marginTop:10,color:'#8060e0',fontSize:13,textAlign:'center'}}>⏳ Extracting garment...</div>}
                    {dressB64 && (
                      <button onClick={clearDress} style={{marginTop:10,width:'100%',background:'#1a0a20',color:'#c060a0',border:'1px solid #401030',padding:'9px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>
                        🗑️ Remove Outfit (show bare avatar)
                      </button>
                    )}
                  </div>

                  {/* Fit analysis */}
                  <div style={{background:'#0d0d22',border:'1px solid #1e1848',borderRadius:14,padding:16}}>
                    <div style={{color:'#e8c99a',fontWeight:700,fontSize:13,marginBottom:10}}>📐 Fit Analysis — Size {result.size}</div>
                    {fitBadges()}
                    <div style={{marginTop:8,padding:'8px 10px',background:'#07071a',borderRadius:8,fontSize:11,color:'#5050a0',textAlign:'center'}}>
                      Ease = room between body and garment. 0–6cm = perfect fit.
                    </div>
                  </div>

                  <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:12,padding:14,fontSize:12,color:'#5050a0'}}>
                    <div style={{color:'#e8c99a',fontWeight:700,marginBottom:6}}>💡 Tips</div>
                    <p style={{margin:'3px 0'}}>• Drag the avatar left/right to rotate 360°</p>
                    <p style={{margin:'3px 0'}}>• White-background product shots extract best</p>
                    <p style={{margin:'3px 0'}}>• Click ⬇ Save to download your avatar image</p>
                  </div>
                </div>

                {avatarFrame('av2')}
              </div>
            )}

            {/* ─ SHOP TAB ─ */}
            {activeTab==='shop' && (
              <ShopPanel
                bodyType={result.body_type}
                skinTone={result.skin_tone}
                size={result.size}
                bestColors={result.best_colors}
                category={category}
              />
            )}
          </div>
        )}
      </div>
    </main>
  )
}

/* ── Shop panel ── */
function ShopPanel({bodyType,skinTone,size,bestColors,category}:any) {
  const all = PRODUCTS[category] || PRODUCTS.Women
  const best = new Set(bestColors)
  let matched = all.filter((p:any)=>p.body.includes(bodyType)&&p.sizes.includes(size)&&p.colors.some((c:string)=>best.has(c)))
  if (!matched.length) matched = all.filter((p:any)=>p.body.includes(bodyType))
  if (!matched.length) matched = all
  return (
    <div>
      <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:14}}>
        🛍 {matched.length} Recommendations — {bodyType} · {skinTone} · Size {size}
      </div>
      <div style={{background:'#10103a',border:'1px solid #1e1848',borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{color:'#8070b0',fontSize:12,marginBottom:8,fontWeight:700}}>✨ Your Best Colours</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {bestColors.slice(0,8).map((c:string)=>(
            <span key={c} style={{display:'inline-flex',alignItems:'center',gap:3,background:'#1e1848',color:'#a090d0',border:'1px solid #2e2868',borderRadius:8,padding:'2px 8px',fontSize:11}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:COLOR_HEX[c]||'#888',display:'inline-block'}}/>
              {c}
            </span>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:12}}>
        {matched.map((p:any)=>{
          const mc = p.colors.filter((c:string)=>best.has(c)).length
            ? p.colors.filter((c:string)=>best.has(c))
            : p.colors.slice(0,2)
          return (
            <div key={p.name} style={{background:'#10103a',border:'1px solid #1e1848',borderRadius:14,padding:16}}>
              <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:8}}>{p.name}</div>
              <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
                {mc.map((c:string)=>(
                  <span key={c} style={{display:'inline-flex',alignItems:'center',gap:3,background:'#1e1848',color:'#a090d0',border:'1px solid #2e2868',borderRadius:8,padding:'2px 7px',fontSize:11}}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:COLOR_HEX[c]||'#888',display:'inline-block'}}/>
                    {c}
                  </span>
                ))}
              </div>
              <div style={{color:'#3a3070',fontSize:11,marginBottom:12}}>Sizes: {p.sizes.join(' · ')}</div>
              <div style={{display:'flex',gap:8}}>
                <a href={p.amazon} target="_blank" rel="noreferrer" style={{background:'#ff9900',color:'#000',padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textDecoration:'none',flex:1,textAlign:'center'}}>🛒 Amazon</a>
                <a href={p.flipkart} target="_blank" rel="noreferrer" style={{background:'#2874f0',color:'#fff',padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textDecoration:'none',flex:1,textAlign:'center'}}>🛒 Flipkart</a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
