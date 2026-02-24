'use client'
import { useState, useRef } from 'react'

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
    {name:"A-Line Ethnic Kurta",body:["Pear","Rectangle","Petite","Apple"],colors:["Royal Blue","Mint Green","Butter Yellow"],sizes:["XS","S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+a-line+ethnic+kurta",flipkart:"https://www.flipkart.com/search?q=women+a+line+kurta"},
    {name:"Bodycon Party Dress",body:["Hourglass","Full Hourglass"],colors:["Cobalt","Crimson","Pure White"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+bodycon+party+dress",flipkart:"https://www.flipkart.com/search?q=women+bodycon+dress"},
    {name:"Empire Waist Maxi",body:["Apple","Pear","Petite"],colors:["Lavender","Soft Peach","Mint Green"],sizes:["XS","S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+empire+waist+maxi",flipkart:"https://www.flipkart.com/search?q=women+empire+waist+maxi"},
    {name:"Anarkali Suit",body:["Apple","Pear","Full Hourglass","Rectangle"],colors:["Deep Burgundy","Cobalt","Jade"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+anarkali+suit",flipkart:"https://www.flipkart.com/search?q=women+anarkali"},
    {name:"Printed Saree",body:["Pear","Hourglass","Apple","Rectangle","Full Hourglass"],colors:["Royal Blue","Crimson","Mustard","Teal"],sizes:["Free Size"],amazon:"https://www.amazon.in/s?k=women+printed+saree",flipkart:"https://www.flipkart.com/search?q=women+printed+saree"},
    {name:"Salwar Kameez",body:["Pear","Rectangle","Apple","Hourglass"],colors:["Terracotta","Mustard","Cobalt"],sizes:["XS","S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+salwar+kameez",flipkart:"https://www.flipkart.com/search?q=women+salwar+kameez"},
    {name:"Fit & Flare Dress",body:["Hourglass","Pear","Rectangle"],colors:["Blush Rose","Sky Blue","Mint Green"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+fit+flare+dress",flipkart:"https://www.flipkart.com/search?q=women+fit+flare"},
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

function lighten(hex:string, f:number) {
  const h = hex.replace('#','')
  return '#'+[0,2,4].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(h.slice(i,i+2),16)*f))).toString(16).padStart(2,'0')).join('')
}

function buildAvatar(result: any, dressB64: string|null): string {
  const skin     = result.skin_hex || '#c8956c'
  const skinTone = result.skin_tone || 'Medium'
  const bodyType = result.body_type || 'Rectangle'
  const CX=210, W=420, H=680, SC=4.8

  const hw=(c:number)=>Math.max(10,Math.round((c/(2*Math.PI))*SC))
  const sh_w = Math.max(hw((result.shoulder_cm||40)*1.05), 52)
  const bu_w = hw(result.bust_cm||88)
  const wa_w = hw(result.waist_cm||72)
  const hi_w = hw(result.hip_cm||90)
  const th_w = Math.round(hi_w * 0.68)
  const ca_w = Math.round(hi_w * 0.37)
  const arm_w= Math.max(14, Math.round(sh_w*0.28))
  const nw   = Math.max(12, Math.round(sh_w*0.26))
  const ah   = Math.round(arm_w/2)

  const y_sh=210, y_bu=y_sh+68, y_wa=y_bu+58, y_hi=y_wa+40
  const y_th=y_hi+78, y_kn=y_th+58, y_ca=y_kn+52, y_ft=y_ca+46
  const y_nek=y_sh-22, y_hcy=y_nek-76

  const skin_sh=lighten(skin,0.68), skin_hi=lighten(skin,1.32)
  const skin_mid=lighten(skin,0.84)

  const isMen = result.category === 'Men'
  // ── Inline SVG face: soft style, always smiling, no external API ────
  const HC:any={Fair:'#6B4416',Light:'#3C1E0C',Medium:'#200A02',Tan:'#120602',Deep:'#060100'}
  const HS:any={Fair:'#AA7228',Light:'#5A301A',Medium:'#2E0E06',Tan:'#1A0604',Deep:'#0A0302'}
  const hc=HC[skinTone]||HC.Medium, hs_=HS[skinTone]||HS.Medium
  const lp=skinTone==='Fair'?'#E07080':skinTone==='Light'?'#C06060':skinTone==='Deep'?'#924848':'#B85252'
  const ec=skinTone==='Fair'?'#382010':skinTone==='Deep'?'#140600':'#200C02'

  function drawFace(cx:number,cy:number,r:number,xsh:number):string{
    const x=cx+xsh, s=r*0.86
    // hair
    const hTW=`<ellipse cx="${x}" cy="${cy-s*.13}" rx="${s*1.07}" ry="${s*.72}" fill="${hc}"/>`
    const hLW=`<path d="M ${x-s*.92},${cy} C ${x-s*1.22},${cy+s*.45} ${x-s*1.14},${cy+s*.90} ${x-s*.82},${cy+s*1.05} C ${x-s*.70},${cy+s*.75} ${x-s*.72},${cy+s*.34} ${x-s*.88},${cy+s*.05}Z" fill="${hc}"/>`
    const hRW=`<path d="M ${x+s*.92},${cy} C ${x+s*1.22},${cy+s*.45} ${x+s*1.14},${cy+s*.90} ${x+s*.82},${cy+s*1.05} C ${x+s*.70},${cy+s*.75} ${x+s*.72},${cy+s*.34} ${x+s*.88},${cy+s*.05}Z" fill="${hc}"/>`
    const hHi=`<path d="M ${x-s*.50},${cy-s*.82} C ${x-s*.16},${cy-s*.98} ${x+s*.14},${cy-s*.92} ${x-s*.06},${cy-s*.70}" fill="none" stroke="${hs_}" stroke-width="${s*.055}" stroke-linecap="round"/>`
    const hTM=`<ellipse cx="${x}" cy="${cy-s*.60}" rx="${s*1.02}" ry="${s*.53}" fill="${hc}"/>`
    const hair=isMen?(hTM):(hLW+hRW+hTW+hHi)
    // face
    const oval=`<ellipse cx="${x}" cy="${cy}" rx="${s}" ry="${s*1.09}" fill="${skin}"/>`
    // eyes
    const er=s*.174, eLx=x-s*.295, eRx=x+s*.295, ey=cy+s*.04
    const eW=`<ellipse cx="${eLx}" cy="${ey}" rx="${er}" ry="${er*1.09}" fill="white"/><ellipse cx="${eRx}" cy="${ey}" rx="${er}" ry="${er*1.09}" fill="white"/>`
    const eI=`<ellipse cx="${eLx}" cy="${ey+er*.07}" rx="${er*.66}" ry="${er*.79}" fill="${ec}"/><ellipse cx="${eRx}" cy="${ey+er*.07}" rx="${er*.66}" ry="${er*.79}" fill="${ec}"/>`
    const eP=`<ellipse cx="${eLx}" cy="${ey+er*.09}" rx="${er*.34}" ry="${er*.41}" fill="#050106"/><ellipse cx="${eRx}" cy="${ey+er*.09}" rx="${er*.34}" ry="${er*.41}" fill="#050106"/>`
    const eSh=`<ellipse cx="${eLx-er*.18}" cy="${ey-er*.18}" rx="${er*.13}" ry="${er*.13}" fill="rgba(255,255,255,.86)"/><ellipse cx="${eRx-er*.18}" cy="${ey-er*.18}" rx="${er*.13}" ry="${er*.13}" fill="rgba(255,255,255,.86)"/>`
    const lsh=isMen?'':`<path d="M ${eLx-er},${ey-er*.86} Q ${eLx},${ey-er*1.30} ${eLx+er},${ey-er*.86}" fill="${hc}" stroke="${hc}" stroke-width="${er*.15}"/><path d="M ${eRx-er},${ey-er*.86} Q ${eRx},${ey-er*1.30} ${eRx+er},${ey-er*.86}" fill="${hc}" stroke="${hc}" stroke-width="${er*.15}"/>`
    const bW=isMen?er*.30:er*.21
    const bL=`<path d="M ${eLx-er*1.09},${ey-er*1.55} Q ${eLx},${ey-er*1.87} ${eLx+er*.87},${ey-er*1.46}" fill="none" stroke="${hc}" stroke-width="${bW}" stroke-linecap="round"/>`
    const bR=`<path d="M ${eRx-er*.87},${ey-er*1.46} Q ${eRx},${ey-er*1.87} ${eRx+er*1.09},${ey-er*1.55}" fill="none" stroke="${hc}" stroke-width="${bW}" stroke-linecap="round"/>`
    // nose
    const ny=cy+s*.27
    const ns=`<path d="M ${x-s*.065},${ny-s*.04} Q ${x},${ny+s*.05} ${x+s*.065},${ny-s*.04}" fill="none" stroke="${lighten(skin,.70)}" stroke-width="${s*.042}" stroke-linecap="round"/>`
    // mouth — always smiling upward
    const my=cy+s*.46
    const mt=`<path d="M ${x-s*.195},${my} Q ${x},${my+s*.14} ${x+s*.195},${my}" fill="${lp}" stroke="${lp}" stroke-width="${s*.036}" stroke-linecap="round"/>
    <path d="M ${x-s*.195},${my} Q ${x},${my-s*.03} ${x+s*.195},${my}" fill="none" stroke="${lighten(lp,1.28)}" stroke-width="${s*.02}"/>`
    const blush=isMen?'':`<ellipse cx="${x-s*.46}" cy="${cy+s*.27}" rx="${s*.17}" ry="${s*.09}" fill="${lp}" opacity=".17"/><ellipse cx="${x+s*.46}" cy="${cy+s*.27}" rx="${s*.17}" ry="${s*.09}" fill="${lp}" opacity=".17"/>`
    return hair+oval+blush+eW+eI+eP+eSh+lsh+bL+bR+ns+mt
  }

  function bodyP(sw:number,bw:number,ww:number,hw_:number,tw:number,cw:number,sh:number) {
    const L=(v:number)=>CX-v+sh, R=(v:number)=>CX+v+sh
    return `M ${L(sw)},${y_sh} C ${L(sw+8)},${y_sh+22} ${L(bw+5)},${y_bu-16} ${L(bw)},${y_bu} C ${L(bw-6)},${y_bu+26} ${L(ww+4)},${y_wa-14} ${L(ww)},${y_wa} C ${L(ww+5)},${y_wa+20} ${L(hw_-4)},${y_hi-12} ${L(hw_)},${y_hi} C ${L(hw_-2)},${y_hi+28} ${L(tw+4)},${y_th-10} ${L(tw)},${y_th} C ${L(tw-2)},${y_th+20} ${L(cw+2)},${y_kn-8} ${L(cw)},${y_kn} C ${L(cw)},${y_kn+24} ${L(cw-2)},${y_ca-6} ${L(cw-2)},${y_ca} C ${L(cw-2)},${y_ca+16} ${L(cw)},${y_ft-4} ${L(cw+2)},${y_ft} L ${R(cw+2)},${y_ft} C ${R(cw)},${y_ft-4} ${R(cw-2)},${y_ca+16} ${R(cw-2)},${y_ca} C ${R(cw-2)},${y_ca-6} ${R(cw)},${y_kn+24} ${R(cw)},${y_kn} C ${R(cw+2)},${y_kn-8} ${R(tw-2)},${y_th+20} ${R(tw)},${y_th} C ${R(tw+4)},${y_th-10} ${R(hw_-2)},${y_hi+28} ${R(hw_)},${y_hi} C ${R(hw_-4)},${y_hi-12} ${R(ww+5)},${y_wa+20} ${R(ww)},${y_wa} C ${R(ww+4)},${y_wa-14} ${R(bw-6)},${y_bu+26} ${R(bw)},${y_bu} C ${R(bw+5)},${y_bu-16} ${R(sw+8)},${y_sh+22} ${R(sw)},${y_sh} Z`
  }
  function dressP(sw:number,bw:number,ww:number,hw_:number,sh:number) {
    // Add generous padding (+18 shoulder, +12 bust) so shirts/jackets with
    // wide shoulders never show body skin through the sides of the garment.
    const sw2=sw+18, bw2=bw+12, ww2=ww+4, hw2=hw_+6
    const L=(v:number)=>CX-v+sh, R=(v:number)=>CX+v+sh
    return `M ${L(sw2)},${y_sh} C ${L(sw2+8)},${y_sh+22} ${L(bw2+5)},${y_bu-16} ${L(bw2)},${y_bu} C ${L(bw2-6)},${y_bu+26} ${L(ww2+4)},${y_wa-14} ${L(ww2)},${y_wa} C ${L(ww2+5)},${y_wa+20} ${L(hw2-4)},${y_hi-12} ${L(hw2)},${y_hi} C ${L(hw2+2)},${y_hi+30} ${L(hw2+4)},${y_ft-10} ${L(hw2-2)},${y_ft} L ${R(hw2-2)},${y_ft} C ${R(hw2+4)},${y_ft-10} ${R(hw2+2)},${y_hi+30} ${R(hw2)},${y_hi} C ${R(hw2-4)},${y_hi-12} ${R(ww2+5)},${y_wa+20} ${R(ww2)},${y_wa} C ${R(ww2+4)},${y_wa-14} ${R(bw2-6)},${y_bu+26} ${R(bw2)},${y_bu} C ${R(bw2+5)},${y_bu-16} ${R(sw2+8)},${y_sh+22} ${R(sw2)},${y_sh} Z`
  }
  function armP(s:number,sw:number,sh:number) {
    const ax=CX+s*sw+sh, ay=y_sh+10, ex=CX+s*(sw+28)+sh, ey=y_sh+102, hx=CX+s*(sw+10)+sh, hy=y_sh+198
    return `M ${ax},${ay} C ${ax+s*16},${ay+26} ${ex-s*5},${ey-24} ${ex},${ey} C ${ex+s*4},${ey+32} ${hx+s*9},${hy-32} ${hx},${hy}`
  }
  function neckP(nn:number,sh:number) {
    return `M ${CX-nn+sh},${y_nek+4} C ${CX-nn+2+sh},${y_nek+14} ${CX-nn+2+sh},${y_sh-8} ${CX-nn+3+sh},${y_sh} L ${CX+nn-3+sh},${y_sh} C ${CX+nn-2+sh},${y_sh-8} ${CX+nn-2+sh},${y_nek+14} ${CX+nn+sh},${y_nek+4} Z`
  }

  const initBd=bodyP(sh_w,bu_w,wa_w,hi_w,th_w,ca_w,0)
  const initDr=dressP(sh_w,bu_w,wa_w,hi_w,0)
  const initLa=armP(-1,sh_w,0), initRa=armP(1,sh_w,0)
  const initNk=neckP(nw,0)

  const dressImgW=(hi_w+30)*2, dressImgH=y_ft-y_sh+24

  const dressDefs = dressB64
    ? `<clipPath id="dCl"><path id="dClP" d="${initDr}"/></clipPath>`
    : ''
  const dressLayer = dressB64
    ? `<image id="dImg" href="data:image/png;base64,${dressB64}" x="${CX-dressImgW/2}" y="${y_sh}" width="${dressImgW}" height="${dressImgH}" clip-path="url(#dCl)" preserveAspectRatio="xMidYMid slice" opacity="0.96"/>
       <path d="${initDr}" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="1.5"/>`
    : ''
  const sleeveLayer = dressB64
    ? `<path id="la2" d="${initLa}" fill="none" stroke="${skin_mid}" stroke-width="${Math.max(10,arm_w-4)}" stroke-linecap="round"/>
       <ellipse id="lh2" cx="${CX-sh_w-10}" cy="${y_sh+205}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>
       <path id="ra2" d="${initRa}" fill="none" stroke="${skin_mid}" stroke-width="${Math.max(10,arm_w-4)}" stroke-linecap="round"/>
       <ellipse id="rh2" cx="${CX+sh_w+10}" cy="${y_sh+205}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#07071a;display:flex;justify-content:center;padding:8px;font-family:system-ui}svg{cursor:grab;touch-action:none}</style>
</head><body>
<div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%">
<svg id="av" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto">
<defs>
<radialGradient id="bgG" cx="50%" cy="52%" r="62%"><stop offset="0%" stop-color="#16123a"/><stop offset="100%" stop-color="#06061a"/></radialGradient>
<linearGradient id="bG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${skin_sh}"/><stop offset="32%" stop-color="${skin}"/><stop offset="52%" stop-color="${skin_hi}" stop-opacity="0.82"/><stop offset="100%" stop-color="${skin_sh}"/></linearGradient>
<filter id="bl"><feGaussianBlur stdDeviation="3.5"/></filter>
<filter id="ds"><feDropShadow dx="2" dy="5" stdDeviation="5" flood-opacity="0.26"/></filter>
${dressDefs}
</defs>
<rect width="${W}" height="${H}" fill="url(#bgG)"/>
<ellipse cx="${CX}" cy="${y_ft+18}" rx="${hi_w+14}" ry="12" fill="rgba(0,0,0,0.18)" filter="url(#bl)"/>
<path id="la" d="${initLa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${dressB64?'0':'1'}"/>
<ellipse id="lh" cx="${CX-sh_w-10}" cy="${y_sh+205}" rx="${ah}" ry="${ah+2}" fill="${skin}" opacity="${dressB64?'0':'1'}"/>
<path id="ra" d="${initRa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${dressB64?'0':'1'}"/>
<ellipse id="rh" cx="${CX+sh_w+10}" cy="${y_sh+205}" rx="${ah}" ry="${ah+2}" fill="${skin}" opacity="${dressB64?'0':'1'}"/>
<path id="body" d="${initBd}" fill="url(#bG)" filter="url(#ds)"/>
<path d="M ${CX},${y_sh+6} C ${CX},${y_bu-6} ${CX},${y_bu+16} ${CX},${y_wa}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="10" stroke-linecap="round"/>
${dressLayer}
${sleeveLayer}
<path id="neck" d="${initNk}" fill="${skin_mid}" filter="url(#ds)"/>
<g id="faceG" filter="url(#ds)">${drawFace(CX,y_hcy,68,0)}</g>
<ellipse id="lft" cx="${CX-ca_w+4}" cy="${y_ft+6}" rx="${ca_w+5}" ry="7" fill="${lighten(skin,0.55)}"/>
<ellipse id="rft" cx="${CX+ca_w-4}" cy="${y_ft+6}" rx="${ca_w+5}" ry="7" fill="${lighten(skin,0.55)}"/>
<text id="vl" x="${CX}" y="${H-5}" text-anchor="middle" font-size="10" font-family="system-ui" fill="rgba(255,255,255,0.18)">FRONT · 0° · ${bodyType}</text>
</svg>
<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
<button onclick="snapTo(0)"   style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 13px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">⬆ Front</button>
<button onclick="snapTo(90)"  style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 13px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">➡ Right</button>
<button onclick="snapTo(180)" style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 13px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">⬇ Back</button>
<button onclick="snapTo(270)" style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 13px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">⬅ Left</button>
<button id="sb" onclick="toggleSpin()" style="background:#1a1040;color:#8070c0;border:1px solid #2e2060;padding:6px 11px;border-radius:8px;cursor:pointer;font-size:11px">▶ Spin</button>
</div>
<input type="range" min="0" max="359" value="0" step="1" style="width:260px;accent-color:#8060e0" oninput="setAngle(+this.value)" id="sl"/>
</div>
<script>
(function(){
var CX=${CX},SHW=${sh_w},BUW=${bu_w},WAW=${wa_w},HIW=${hi_w},THW=${th_w},CAW=${ca_w};
var NW=${nw},ARW=${arm_w},AH=${ah};
var YSH=${y_sh},YBU=${y_bu},YWA=${y_wa},YHI=${y_hi},YTH=${y_th},YKN=${y_kn},YCA=${y_ca},YFT=${y_ft};
var YNER=${y_nek},YHCY=${y_hcy};
var BT="${bodyType}",hasDress=${dressB64?'true':'false'};
// Always start at FRONT view when dress is loaded
var angle=hasDress?0:0,spinning=false,dragX=null,dragA=0;
var DW=${dressImgW};
var spinning=false,dragX=null,dragA=0;
function m360(a){return((a%360)+360)%360;}
function vn(a){a=m360(a);if(a<22)return'FRONT';if(a<67)return'FRONT-R';if(a<112)return'RIGHT';if(a<157)return'BACK-R';if(a<202)return'BACK';if(a<247)return'BACK-L';if(a<292)return'LEFT';return'FRONT-L';}
function S(id,attr,val){var e=document.getElementById(id);if(e)e.setAttribute(attr,val);}
function O(id,v){var e=document.getElementById(id);if(e)e.style.opacity=v;}
function bodyPath(sw,bw,ww,hw,tw,cw,sh){
  var L=function(v){return CX-v+sh;},R=function(v){return CX+v+sh;};
  return 'M '+L(sw)+','+YSH+' C '+L(sw+8)+','+(YSH+22)+' '+L(bw+5)+','+(YBU-16)+' '+L(bw)+','+YBU+' C '+L(bw-6)+','+(YBU+26)+' '+L(ww+4)+','+(YWA-14)+' '+L(ww)+','+YWA+' C '+L(ww+5)+','+(YWA+20)+' '+L(hw-4)+','+(YHI-12)+' '+L(hw)+','+YHI+' C '+L(hw-2)+','+(YHI+28)+' '+L(tw+4)+','+(YTH-10)+' '+L(tw)+','+YTH+' C '+L(tw-2)+','+(YTH+20)+' '+L(cw+2)+','+(YKN-8)+' '+L(cw)+','+YKN+' C '+L(cw)+','+(YKN+24)+' '+L(cw-2)+','+(YCA-6)+' '+L(cw-2)+','+YCA+' C '+L(cw-2)+','+(YCA+16)+' '+L(cw)+','+(YFT-4)+' '+L(cw+2)+','+YFT+' L '+R(cw+2)+','+YFT+' C '+R(cw)+','+(YFT-4)+' '+R(cw-2)+','+(YCA+16)+' '+R(cw-2)+','+YCA+' C '+R(cw-2)+','+(YCA-6)+' '+R(cw)+','+(YKN+24)+' '+R(cw)+','+YKN+' C '+R(cw+2)+','+(YKN-8)+' '+R(tw-2)+','+(YTH+20)+' '+R(tw)+','+YTH+' C '+R(tw+4)+','+(YTH-10)+' '+R(hw-2)+','+(YHI+28)+' '+R(hw)+','+YHI+' C '+R(hw-4)+','+(YHI-12)+' '+R(ww+5)+','+(YWA+20)+' '+R(ww)+','+YWA+' C '+R(ww+4)+','+(YWA-14)+' '+R(bw-6)+','+(YBU+26)+' '+R(bw)+','+YBU+' C '+R(bw+5)+','+(YBU-16)+' '+R(sw+8)+','+(YSH+22)+' '+R(sw)+','+YSH+' Z';
}
function dressPath(sw,bw,ww,hw,sh){
  // +18 shoulder, +12 bust — same padding as TypeScript dressP
  // ensures shirts/jackets never show body skin through the sides
  var sw2=sw+18,bw2=bw+12,ww2=ww+4,hw2=hw+6;
  var L=function(v){return CX-v+sh;},R=function(v){return CX+v+sh;};
  return 'M '+L(sw2)+','+YSH+' C '+L(sw2+8)+','+(YSH+22)+' '+L(bw2+5)+','+(YBU-16)+' '+L(bw2)+','+YBU+' C '+L(bw2-6)+','+(YBU+26)+' '+L(ww2+4)+','+(YWA-14)+' '+L(ww2)+','+YWA+' C '+L(ww2+5)+','+(YWA+20)+' '+L(hw2-4)+','+(YHI-12)+' '+L(hw2)+','+YHI+' C '+L(hw2+2)+','+(YHI+30)+' '+L(hw2+4)+','+(YFT-10)+' '+L(hw2-2)+','+YFT+' L '+R(hw2-2)+','+YFT+' C '+R(hw2+4)+','+(YFT-10)+' '+R(hw2+2)+','+(YHI+30)+' '+R(hw2)+','+YHI+' C '+R(hw2-4)+','+(YHI-12)+' '+R(ww2+5)+','+(YWA+20)+' '+R(ww2)+','+YWA+' C '+R(ww2+4)+','+(YWA-14)+' '+R(bw2-6)+','+(YBU+26)+' '+R(bw2)+','+YBU+' C '+R(bw2+5)+','+(YBU-16)+' '+R(sw2+8)+','+(YSH+22)+' '+R(sw2)+','+YSH+' Z';
}
function armPath(s,sw,sh){
  var ax=CX+s*sw+sh,ay=YSH+10,ex=CX+s*(sw+28)+sh,ey=YSH+102,hx=CX+s*(sw+10)+sh,hy=YSH+198;
  return 'M '+ax+','+ay+' C '+(ax+s*16)+','+(ay+26)+' '+(ex-s*5)+','+(ey-24)+' '+ex+','+ey+' C '+(ex+s*4)+','+(ey+32)+' '+(hx+s*9)+','+(hy-32)+' '+hx+','+hy;
}
function neckPath(nn,sh){
  return 'M '+(CX-nn+sh)+','+(YNER+4)+' C '+(CX-nn+2+sh)+','+(YNER+14)+' '+(CX-nn+2+sh)+','+(YSH-8)+' '+(CX-nn+3+sh)+','+YSH+' L '+(CX+nn-3+sh)+','+YSH+' C '+(CX+nn-2+sh)+','+(YSH-8)+' '+(CX+nn-2+sh)+','+(YNER+14)+' '+(CX+nn+sh)+','+(YNER+4)+' Z';
}
function upd(a){
  a=m360(a);var r=a*Math.PI/180,cosA=Math.cos(r),sinA=Math.sin(r);
  var wS=Math.abs(cosA)*0.84+0.16,sh=Math.round(sinA*22);
  var sw=Math.max(10,Math.round(SHW*wS)),bw=Math.max(10,Math.round(BUW*wS));
  var ww=Math.max(10,Math.round(WAW*wS)),hw=Math.max(10,Math.round(HIW*wS));
  var tw=Math.max(8,Math.round(THW*wS)),cw=Math.max(6,Math.round(CAW*wS));
  var nn=Math.max(5,Math.round(NW*wS)),aw=Math.round(ARW*wS),ah2=Math.round(aw/2);
  S('body','d',bodyPath(sw,bw,ww,hw,tw,cw,sh));
  S('neck','d',neckPath(nn,sh));
  var fg=document.getElementById('faceG');
  if(fg){fg.setAttribute('transform','translate('+sh+',0)');fg.style.opacity=Math.max(0,cosA).toFixed(2);}
  S('lft','cx',CX-cw+4+sh);S('rft','cx',CX+cw-4+sh);
  if(!hasDress){
    var sL=!(a>28&&a<152),sR=!(a>208&&a<332);
    S('la','d',armPath(-1,sw,sh));S('ra','d',armPath(1,sw,sh));
    O('la',sL?'1':'0');O('lh',sL?'1':'0');O('ra',sR?'1':'0');O('rh',sR?'1':'0');
    S('lh','cx',CX-sw-10+sh);S('rh','cx',CX+sw+10+sh);
  }
  if(hasDress){
    // Clip path rotates WITH body silhouette
    var dc=document.getElementById('dClP');if(dc)dc.setAttribute('d',dressPath(sw,bw,ww,hw,sh));
    // Dress IMAGE stays front-facing (no +sh) — only width scales for perspective
    var di=document.getElementById('dImg');
    if(di){
      var sW=DW*wS;
      di.setAttribute('width',sW.toFixed(1));
      di.setAttribute('x',(CX-sW/2+sh).toFixed(1));  // sh = body horizontal offset during rotation
      // Fade dress when viewed from back
      di.style.opacity=(0.52+Math.max(0,cosA)*0.44).toFixed(2);
    }
    S('la2','d',armPath(-1,sw,sh));S('ra2','d',armPath(1,sw,sh));
    var sL2=!(a>28&&a<152),sR2=!(a>208&&a<332);
    O('la2',sL2?'0.9':'0');O('lh2',sL2?'0.9':'0');O('ra2',sR2?'0.9':'0');O('rh2',sR2?'0.9':'0');
    S('lh2','cx',CX-sw-10+sh);S('rh2','cx',CX+sw+10+sh);
  }
  S('vl','x',CX+sh);
  var vl=document.getElementById('vl');if(vl)vl.textContent=vn(a)+' · '+Math.round(a)+'° · '+BT;
  var sl=document.getElementById('sl');if(sl)sl.value=Math.round(a);
}
function setAngle(a){angle=m360(a);upd(angle);}window.setAngle=setAngle;
function snapTo(t){var st=angle,df=m360(t-st);if(df>180)df-=360;var steps=30,step=0;
  function tick(){step++;var p=step/steps;p=p<.5?2*p*p:-1+(4-2*p)*p;angle=m360(st+df*p);upd(angle);if(step<steps)requestAnimationFrame(tick);else{angle=m360(t);upd(angle);}}
  requestAnimationFrame(tick);}window.snapTo=snapTo;
function toggleSpin(){spinning=!spinning;var b=document.getElementById('sb');if(b)b.textContent=spinning?'⏸ Stop':'▶ Spin';if(spinning)loop();}window.toggleSpin=toggleSpin;
function loop(){if(!spinning)return;angle=m360(angle+1.2);upd(angle);requestAnimationFrame(loop);}
var sv=document.getElementById('av');
if(sv){
  sv.addEventListener('mousedown',function(e){spinning=false;var b=document.getElementById('sb');if(b)b.textContent='▶ Spin';dragX=e.clientX;dragA=angle;sv.style.cursor='grabbing';e.preventDefault();});
  document.addEventListener('mousemove',function(e){if(dragX===null)return;angle=m360(dragA+(e.clientX-dragX)*0.52);upd(angle);});
  document.addEventListener('mouseup',function(){dragX=null;if(sv)sv.style.cursor='grab';});
  sv.addEventListener('touchstart',function(e){spinning=false;dragX=e.touches[0].clientX;dragA=angle;e.preventDefault();},{passive:false});
  document.addEventListener('touchmove',function(e){if(dragX===null)return;angle=m360(dragA+(e.touches[0].clientX-dragX)*0.52);upd(angle);e.preventDefault();},{passive:false});
  document.addEventListener('touchend',function(){dragX=null;});
}
upd(0);
})();
</script></body></html>`
}

export default function Home() {
  const [step,         setStep]        = useState<'upload'|'result'>('upload')
  const [loading,      setLoading]     = useState(false)
  const [error,        setError]       = useState('')
  const [result,       setResult]      = useState<any>(null)
  const [visImg,       setVisImg]      = useState<string|null>(null)
  const [preview,      setPreview]     = useState<string|null>(null)
  const [category,     setCategory]    = useState('Women')
  const [dressB64,     setDressB64]    = useState<string|null>(null)
  const [dressPreview, setDressPreview]= useState<string|null>(null)
  const [dressLoading, setDressLoading]= useState(false)
  const [activeTab,    setActiveTab]   = useState<'avatar'|'tryon'|'shop'>('avatar')
  const fileRef  = useRef<HTMLInputElement>(null)
  const dressRef = useRef<HTMLInputElement>(null)

  const analyze = async (file: File) => {
    setLoading(true); setError('')
    try {
      const form = new FormData(); form.append('file',file); form.append('category',category)
      const data = await fetch('/api/analyze',{method:'POST',body:form}).then(r=>r.json())
      if(data.error){setError(data.error);setLoading(false);return}
      setResult(data); if(data.vis_jpeg_b64)setVisImg(`data:image/jpeg;base64,${data.vis_jpeg_b64}`)
      setStep('result')
    } catch(e:any){setError(e.message)}
    setLoading(false)
  }

  const tryOn = async (file: File) => {
    setDressLoading(true); setDressPreview(URL.createObjectURL(file))
    try {
      const form = new FormData(); form.append('file',file)
      const data = await fetch('/api/extract-dress',{method:'POST',body:form}).then(r=>r.json())
      if(data.error){setError(data.error);setDressLoading(false);return}
      setDressB64(data.dress_b64); setDressPreview(`data:image/png;base64,${data.dress_b64}`)
      setActiveTab('tryon')
    } catch(e:any){setError(e.message)}
    setDressLoading(false)
  }

  const clearDress = () => {setDressB64(null);setDressPreview(null)}

  const WOMEN_BUST: Record<string,number> = {XS:76,S:82,M:88,L:94,XL:100,XXL:108,XXXL:116,'4XL':124}
  const fitBadges = () => {
    if(!result) return null
    const std = WOMEN_BUST[result.size]??result.bust_cm
    return [['Bust/Chest', std-result.bust_cm],['Waist',(std-14)-result.waist_cm],['Hip',(std+6)-result.hip_cm]].map(([zone,diff])=>{
      const d=diff as number
      const [icon,lbl,col]=d>=0&&d<6?['✅','Perfect Fit','#22c55e']:d>=6?['⬆','Slightly Loose','#eab308']:d>=-5?['⚠','Snug Fit','#f97316']:['❌','Too Tight','#ef4444']
      return (<div key={zone as string} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'#07071a',borderLeft:`4px solid ${col}`,borderRadius:6,marginBottom:5,fontSize:12}}>
        <span>{icon}</span><div><div style={{color:col,fontWeight:700}}>{zone as string}</div><div style={{color:'#555',fontSize:11}}>{lbl} ({d>=0?'+':''}{d.toFixed(1)}cm)</div></div>
      </div>)
    })
  }

  const avatarFrame = (id: string) => {
    // Key MUST change when dressB64 changes — otherwise iframe won't re-render
    const frameKey = `${id}-${dressB64 ? dressB64.slice(-12) : 'bare'}`
    return (
      <div style={{background:'#08081a',borderRadius:16,overflow:'hidden',minHeight:480}}>
        <iframe key={frameKey} srcDoc={result ? buildAvatar(result, dressB64) : ''} style={{width:'100%',height:560,border:'none',display:'block'}} title="avatar"/>
      </div>
    )
  }

  const tabBtn=(id:string,lbl:string)=>(
    <button onClick={()=>setActiveTab(id as any)} style={{padding:'10px 18px',border:'none',cursor:'pointer',fontWeight:700,fontSize:13,background:'transparent',color:activeTab===id?'#e8c99a':'#4040a0',borderBottom:activeTab===id?'2px solid #e8c99a':'2px solid transparent',whiteSpace:'nowrap'}}>{lbl}</button>
  )

  return (
    <main style={{minHeight:'100vh',background:'#06061a',color:'#e8e0ff',fontFamily:'system-ui,sans-serif'}}>
      <div style={{background:'linear-gradient(135deg,#1a0938,#0d0628)',padding:'18px 24px',borderBottom:'1px solid #1e1848',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <h1 style={{margin:0,fontSize:'1.45rem',fontWeight:800,color:'#e8c99a'}}>👗 3D Fashion Stylist Pro</h1>
          <p style={{margin:'2px 0 0',color:'#7060a0',fontSize:'0.76rem'}}>AI body analysis · 3D avatar with legs · Virtual try-on · Smart recommendations</p>
        </div>
        {result&&<div style={{display:'flex',alignItems:'center',gap:10,background:'#1a1848',border:'1px solid #2e2868',borderRadius:12,padding:'7px 14px'}}>
          <span style={{width:12,height:12,borderRadius:'50%',background:result.skin_hex,border:'1px solid #888',display:'inline-block'}}/>
          <span style={{fontWeight:800,color:'#e8c99a'}}>{result.size}</span>
          <span style={{color:'#8060c0',fontSize:12}}>{result.body_icon} {result.body_type}</span>
        </div>}
      </div>

      <div style={{maxWidth:1140,margin:'0 auto',padding:'18px 14px'}}>
        {step==='upload'&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:18}}>
            <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:16,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:6}}>📸 Upload Full-Body Photo</div>
              <div style={{color:'#5050a0',fontSize:12,marginBottom:14}}>Stand straight, facing camera, full body visible head to toe</div>
              <div style={{display:'flex',gap:8,marginBottom:14}}>
                {['Women','Men','Kids'].map(c=><button key={c} onClick={()=>setCategory(c)} style={{flex:1,padding:'8px 0',border:`1px solid ${category===c?'#8060e0':'#1e1848'}`,borderRadius:8,cursor:'pointer',fontWeight:700,fontSize:12,background:category===c?'#2a1f60':'#0d0d2a',color:category===c?'#e8c99a':'#5040a0'}}>{c}</button>)}
              </div>
              <div onClick={()=>fileRef.current?.click()} style={{border:'2px dashed #2a2860',borderRadius:12,padding:28,cursor:'pointer',background:'#0d0d2a',textAlign:'center',minHeight:180,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}>
                {preview?<img src={preview} alt="preview" style={{maxHeight:200,borderRadius:8,objectFit:'contain'}}/>:<><div style={{fontSize:48}}>📷</div><div style={{color:'#4040a0',fontSize:13}}>Click or drop photo here</div><div style={{color:'#2a2a60',fontSize:11}}>JPG · PNG · WEBP</div></>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f){setPreview(URL.createObjectURL(f));analyze(f)}}}/>
              {loading&&<div style={{marginTop:12,color:'#8060e0',fontSize:13,textAlign:'center',padding:10,background:'#1a1848',borderRadius:8}}>⏳ Analysing body measurements...</div>}
              {error&&<div style={{marginTop:12,padding:'10px 14px',background:'#2a0a0a',border:'1px solid #880000',borderRadius:8,color:'#ff8080',fontSize:12}}>❌ {error}</div>}
            </div>
            <div style={{background:'#10103a',border:'1px solid #1e1848',borderRadius:16,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:14}}>✨ What you get</div>
              {[['📏','Accurate body measurements (shoulder, bust, waist, hip)'],['👗','Size recommendation — Indian standard chart'],['🎨','Personalised colour palette for your skin tone'],['👤','Full-body 3D avatar (with legs!) — drag to rotate'],['🪄','Virtual try-on — see dresses fitted on YOUR body'],['🛍','Shopping links with your exact size on Amazon & Flipkart']].map(([e,t])=>(
                <div key={t as string} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
                  <span style={{fontSize:18,flexShrink:0}}>{e}</span>
                  <span style={{color:'#7060a0',fontSize:13}}>{t}</span>
                </div>
              ))}
              <div style={{marginTop:14,padding:'12px 14px',background:'#0d0d22',border:'1px solid #1a1848',borderRadius:10,fontSize:12,color:'#4a4880'}}>
                💡 <b style={{color:'#6a6898'}}>Best results:</b> Full body in frame, standing straight, plain background, good lighting
              </div>
            </div>
          </div>
        )}

        {step==='result'&&result&&(
          <div>
            <div style={{display:'flex',borderBottom:'1px solid #1e1848',marginBottom:18,overflowX:'auto'}}>
              {tabBtn('avatar','👤 3D Avatar')}
              {tabBtn('tryon','👗 Try-On')}
              {tabBtn('shop','🛍 Shop')}
              <button onClick={()=>{setStep('upload');setResult(null);setPreview(null);clearDress()}} style={{marginLeft:'auto',padding:'8px 14px',background:'#1a1848',color:'#6050a0',border:'1px solid #2a2860',borderRadius:8,cursor:'pointer',fontSize:12}}>📸 New Photo</button>
            </div>

            {activeTab==='avatar'&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18}}>
                {avatarFrame('av1')}
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {visImg&&<img src={visImg} alt="detection" style={{width:'100%',borderRadius:12,border:'1px solid #2a2860',maxHeight:260,objectFit:'contain',background:'#000'}}/>}
                  <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:14,padding:16}}>
                    <div style={{color:'#e8c99a',fontWeight:800,marginBottom:6}}>{result.body_icon} {result.body_type} <span style={{marginLeft:8,background:'#2a1f60',padding:'2px 10px',borderRadius:6,fontSize:14}}>{result.size}</span></div>
                    {result.clothing_type==='Saree/Draped'&&<div style={{background:'rgba(255,200,0,.13)',border:'1px solid #ffcc0044',borderRadius:6,padding:'3px 10px',fontSize:11,color:'#ffcc00',marginBottom:6,display:'inline-block'}}>🥻 Draped clothing — measurements adjusted</div>}
                    {result.method&&<div style={{color:'#404080',fontSize:10,marginBottom:4}}>{result.method} · {result.confidence}% confidence</div>}
                    <div style={{color:'#6050a0',fontSize:12,marginBottom:12}}>{result.body_desc}</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                      {[['Shoulder',result.shoulder_cm],['Bust',result.bust_cm],['Waist',result.waist_cm],['Hip',result.hip_cm],['Height',result.height_cm],['Inseam',result.inseam_cm]].map(([k,v])=>(
                        <div key={k as string} style={{background:'#0d0d22',border:'1px solid #1a1848',borderRadius:8,padding:'8px 10px'}}>
                          <div style={{color:'#4a4870',fontSize:10,textTransform:'uppercase',letterSpacing:1}}>{k}</div>
                          <div style={{color:'#e8e0ff',fontWeight:700,fontSize:16}}>{v}<span style={{fontSize:10,color:'#4a4870',marginLeft:2}}>cm</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:14,padding:16}}>
                    <div style={{color:'#e8c99a',fontWeight:700,fontSize:13,marginBottom:8}}>🎨 Best Colors — {result.skin_tone}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {result.best_colors.slice(0,8).map((c:string)=><span key={c} style={{display:'inline-flex',alignItems:'center',gap:4,background:'#1e1848',color:'#b0a0e0',border:'1px solid #2e2868',borderRadius:8,padding:'3px 9px',fontSize:11}}><span style={{width:8,height:8,borderRadius:'50%',background:COLOR_HEX[c]||'#888',display:'inline-block',border:'1px solid rgba(255,255,255,0.15)'}}/>{c}</span>)}
                    </div>
                    <div style={{color:'#e8c99a',fontWeight:700,fontSize:13,margin:'10px 0 6px'}}>💡 Style Tips</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {result.style_tips.map((t:string)=><span key={t} style={{background:'#1e2848',color:'#90b0f0',border:'1px solid #2e3868',borderRadius:8,padding:'3px 9px',fontSize:11}}>{t}</span>)}
                    </div>
                  </div>
                  <button onClick={()=>setActiveTab('tryon')} style={{background:'linear-gradient(135deg,#6040c0,#9060e0)',color:'#fff',border:'none',padding:'13px',borderRadius:12,cursor:'pointer',fontWeight:800,fontSize:14}}>👗 Try On Outfits →</button>
                </div>
              </div>
            )}

            {activeTab==='tryon'&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:18}}>
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:16,padding:18}}>
                    <div style={{color:'#e8c99a',fontWeight:800,marginBottom:6}}>👗 Upload Outfit Image</div>
                    <div style={{color:'#5050a0',fontSize:12,marginBottom:12}}>White-background product photos give best results</div>
                    <div onClick={()=>dressRef.current?.click()} style={{border:'2px dashed #2a2860',borderRadius:12,padding:18,cursor:'pointer',background:'#0d0d2a',textAlign:'center',minHeight:150,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8}}>
                      {dressPreview?<img src={dressPreview} alt="dress" style={{maxHeight:150,borderRadius:8,objectFit:'contain'}}/>:<><div style={{fontSize:36}}>👗</div><div style={{color:'#4040a0',fontSize:13}}>Click to upload outfit</div><div style={{color:'#2a2a60',fontSize:11}}>Dress · Saree · Suit · Kurta</div></>}
                    </div>
                    <input ref={dressRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)tryOn(f)}}/>
                    {dressLoading&&<div style={{marginTop:10,color:'#8060e0',fontSize:13,textAlign:'center'}}>⏳ Extracting garment...</div>}
                    {dressB64&&<button onClick={clearDress} style={{marginTop:10,width:'100%',background:'#1a0a20',color:'#c060a0',border:'1px solid #401030',padding:'9px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>🗑️ Remove Outfit</button>}
                  </div>
                  <div style={{background:'#0d0d22',border:'1px solid #1e1848',borderRadius:14,padding:16}}>
                    <div style={{color:'#e8c99a',fontWeight:700,fontSize:13,marginBottom:10}}>📐 Fit Analysis — Size {result.size}</div>
                    {fitBadges()}
                    <div style={{marginTop:8,padding:'8px 10px',background:'#07071a',borderRadius:8,fontSize:11,color:'#5050a0',textAlign:'center'}}>Ease = room between body and garment. 0–6cm = perfect fit.</div>
                  </div>
                  <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:12,padding:14,fontSize:12,color:'#5050a0'}}>
                    <div style={{color:'#e8c99a',fontWeight:700,marginBottom:6}}>💡 Try-On Tips</div>
                    <p style={{margin:'3px 0'}}>• White or plain backgrounds extract best</p>
                    <p style={{margin:'3px 0'}}>• Product flat-lay or mannequin shots work great</p>
                    <p style={{margin:'3px 0'}}>• Drag the avatar to see outfit from all angles</p>
                  </div>
                </div>
                {avatarFrame('av2')}
              </div>
            )}

            {activeTab==='shop'&&<ShopPanel bodyType={result.body_type} skinTone={result.skin_tone} size={result.size} bestColors={result.best_colors} category={category}/>}
          </div>
        )}
      </div>
    </main>
  )
}

function ShopPanel({bodyType,skinTone,size,bestColors,category}:any){
  const all=PRODUCTS[category]||PRODUCTS.Women, best=new Set(bestColors)
  let matched=all.filter((p:any)=>p.body.includes(bodyType)&&p.sizes.includes(size)&&p.colors.some((c:string)=>best.has(c)))
  if(!matched.length)matched=all.filter((p:any)=>p.body.includes(bodyType))
  if(!matched.length)matched=all
  return(
    <div>
      <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:14}}>🛍 {matched.length} Recommendations — {bodyType} · {skinTone} · Size {size}</div>
      <div style={{background:'#10103a',border:'1px solid #1e1848',borderRadius:12,padding:14,marginBottom:14}}>
        <div style={{color:'#8070b0',fontSize:12,marginBottom:8,fontWeight:700}}>✨ Your Best Colours</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {bestColors.slice(0,8).map((c:string)=><span key={c} style={{display:'inline-flex',alignItems:'center',gap:3,background:'#1e1848',color:'#a090d0',border:'1px solid #2e2868',borderRadius:8,padding:'2px 8px',fontSize:11}}><span style={{width:8,height:8,borderRadius:'50%',background:COLOR_HEX[c]||'#888',display:'inline-block'}}/>{c}</span>)}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:12}}>
        {matched.map((p:any)=>{
          const mc=p.colors.filter((c:string)=>best.has(c)).length?p.colors.filter((c:string)=>best.has(c)):p.colors.slice(0,2)
          return(<div key={p.name} style={{background:'#10103a',border:'1px solid #1e1848',borderRadius:14,padding:16}}>
            <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:8}}>{p.name}</div>
            <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
              {mc.map((c:string)=><span key={c} style={{display:'inline-flex',alignItems:'center',gap:3,background:'#1e1848',color:'#a090d0',border:'1px solid #2e2868',borderRadius:8,padding:'2px 7px',fontSize:11}}><span style={{width:7,height:7,borderRadius:'50%',background:COLOR_HEX[c]||'#888',display:'inline-block'}}/>{c}</span>)}
            </div>
            <div style={{color:'#3a3070',fontSize:11,marginBottom:12}}>Sizes: {p.sizes.join(' · ')}</div>
            <div style={{display:'flex',gap:8}}>
              <a href={p.amazon}   target="_blank" rel="noreferrer" style={{background:'#ff9900',color:'#000',padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textDecoration:'none',flex:1,textAlign:'center'}}>🛒 Amazon</a>
              <a href={p.flipkart} target="_blank" rel="noreferrer" style={{background:'#2874f0',color:'#fff',padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textDecoration:'none',flex:1,textAlign:'center'}}>🛒 Flipkart</a>
            </div>
          </div>)
        })}
      </div>
    </div>
  )
}
