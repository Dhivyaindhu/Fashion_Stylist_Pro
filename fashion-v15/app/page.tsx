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

// ✅ FIX 1: GENDER-CORRECT AVATAR FACES
function buildAvatar(result: any, dressB64: string|null): string {
  const skin     = result.skin_hex || '#c8956c'
  const skinTone = result.skin_tone || 'Medium'
  const bodyType = result.body_type || 'Rectangle'
  const category = result.category || 'Women'  // ✅ GET CATEGORY FROM API
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

  const SKINS:any = {Fair:{ds:'f8d5c2',h:'b8860b'},Light:{ds:'e8b89a',h:'4a3728'},Medium:{ds:'c68642',h:'2d1b0e'},Tan:{ds:'a0522d',h:'1a0f0a'},Deep:{ds:'4a2912',h:'0a0505'}}
  const pal = SKINS[skinTone]||SKINS.Medium
  
  // ✅ GENDER-SPECIFIC AVATAR STYLES
  let dbUrl
  if (category === 'Men') {
    // Masculine face style
    dbUrl = `https://api.dicebear.com/9.x/micah/svg?seed=${skinTone}${bodyType}&skinColor=${pal.ds}&hairColor=${pal.h}&backgroundColor=transparent&scale=120`
  } else if (category === 'Kids') {
    // Child-friendly style
    dbUrl = `https://api.dicebear.com/9.x/big-smile/svg?seed=${skinTone}${bodyType}&backgroundColor=transparent&scale=120`
  } else {
    // Feminine face style (default)
    dbUrl = `https://api.dicebear.com/9.x/lorelei/svg?seed=${skinTone}${bodyType}&skinColor=${pal.ds}&hairColor=${pal.h}&backgroundColor=transparent&scale=120`
  }

  function bodyP(sw:number,bw:number,ww:number,hw_:number,tw:number,cw:number,sh:number) {
    const L=(v:number)=>CX-v+sh, R=(v:number)=>CX+v+sh
    return `M ${L(sw)},${y_sh} C ${L(sw+8)},${y_sh+22} ${L(bw+5)},${y_bu-16} ${L(bw)},${y_bu} C ${L(bw-6)},${y_bu+26} ${L(ww+4)},${y_wa-14} ${L(ww)},${y_wa} C ${L(ww+5)},${y_wa+20} ${L(hw_-4)},${y_hi-12} ${L(hw_)},${y_hi} C ${L(hw_-2)},${y_hi+28} ${L(tw+4)},${y_th-10} ${L(tw)},${y_th} C ${L(tw-2)},${y_th+20} ${L(cw+2)},${y_kn-8} ${L(cw)},${y_kn} C ${L(cw)},${y_kn+24} ${L(cw-2)},${y_ca-6} ${L(cw-2)},${y_ca} C ${L(cw-2)},${y_ca+16} ${L(cw)},${y_ft-4} ${L(cw+2)},${y_ft} L ${R(cw+2)},${y_ft} C ${R(cw)},${y_ft-4} ${R(cw-2)},${y_ca+16} ${R(cw-2)},${y_ca} C ${R(cw-2)},${y_ca-6} ${R(cw)},${y_kn+24} ${R(cw)},${y_kn} C ${R(cw+2)},${y_kn-8} ${R(tw-2)},${y_th+20} ${R(tw)},${y_th} C ${R(tw+4)},${y_th-10} ${R(hw_-2)},${y_hi+28} ${R(hw_)},${y_hi} C ${R(hw_-4)},${y_hi-12} ${R(ww+5)},${y_wa+20} ${R(ww)},${y_wa} C ${R(ww+4)},${y_wa-14} ${R(bw-6)},${y_bu+26} ${R(bw)},${y_bu} C ${R(bw+5)},${y_bu-16} ${R(sw+8)},${y_sh+22} ${R(sw)},${y_sh} Z`
  }
  
  // ✅ FIX 2A: DRESS COVERS FULL BODY - Updated dressP function
  function dressP(sw:number,bw:number,ww:number,hw_:number,tw:number,cw:number,sh:number) {
    const L=(v:number)=>CX-v+sh, R=(v:number)=>CX+v+sh
    const dressFlare = Math.max(hw_ * 0.18, 10)
    const ft_w = hw_ + dressFlare
    
    return `M ${L(sw)},${y_sh} C ${L(sw+8)},${y_sh+22} ${L(bw+5)},${y_bu-16} ${L(bw)},${y_bu} C ${L(bw-6)},${y_bu+26} ${L(ww+4)},${y_wa-14} ${L(ww)},${y_wa} C ${L(ww+5)},${y_wa+20} ${L(hw_-4)},${y_hi-12} ${L(hw_)},${y_hi} C ${L(hw_+2)},${y_hi+24} ${L(tw+6)},${y_th-8} ${L(tw+8)},${y_th} C ${L(tw+8)},${y_th+18} ${L(ft_w-4)},${y_kn-6} ${L(ft_w-2)},${y_kn} C ${L(ft_w-2)},${y_kn+20} ${L(ft_w)},${y_ca-4} ${L(ft_w)},${y_ca} C ${L(ft_w)},${y_ca+14} ${L(ft_w+2)},${y_ft-8} ${L(ft_w+4)},${y_ft} L ${R(ft_w+4)},${y_ft} C ${R(ft_w+2)},${y_ft-8} ${R(ft_w)},${y_ca+14} ${R(ft_w)},${y_ca} C ${R(ft_w)},${y_ca-4} ${R(ft_w-2)},${y_kn+20} ${R(ft_w-2)},${y_kn} C ${R(ft_w-4)},${y_kn-6} ${R(tw+8)},${y_th+18} ${R(tw+8)},${y_th} C ${R(tw+6)},${y_th-8} ${R(hw_+2)},${y_hi+24} ${R(hw_)},${y_hi} C ${R(hw_-4)},${y_hi-12} ${R(ww+5)},${y_wa+20} ${R(ww)},${y_wa} C ${R(ww+4)},${y_wa-14} ${R(bw-6)},${y_bu+26} ${R(bw)},${y_bu} C ${R(bw+5)},${y_bu-16} ${R(sw+8)},${y_sh+22} ${R(sw)},${y_sh} Z`
  }
  
  function armP(s:number,sw:number,sh:number) {
    const ax=CX+s*sw+sh, ay=y_sh+10, ex=CX+s*(sw+28)+sh, ey=y_sh+102, hx=CX+s*(sw+10)+sh, hy=y_sh+198
    return `M ${ax},${ay} C ${ax+s*16},${ay+26} ${ex-s*5},${ey-24} ${ex},${ey} C ${ex+s*4},${ey+32} ${hx+s*9},${hy-32} ${hx},${hy}`
  }
  function neckP(nn:number,sh:number) {
    return `M ${CX-nn+sh},${y_nek+4} C ${CX-nn+2+sh},${y_nek+14} ${CX-nn+2+sh},${y_sh-8} ${CX-nn+3+sh},${y_sh} L ${CX+nn-3+sh},${y_sh} C ${CX+nn-2+sh},${y_sh-8} ${CX+nn-2+sh},${y_nek+14} ${CX+nn+sh},${y_nek+4} Z`
  }

  const initBd=bodyP(sh_w,bu_w,wa_w,hi_w,th_w,ca_w,0)
  // ✅ FIX 2B: Update initDr call with th_w and ca_w parameters
  const initDr=dressP(sh_w,bu_w,wa_w,hi_w,th_w,ca_w,0)
  const initLa=armP(-1,sh_w,0), initRa=armP(1,sh_w,0)
  const initNk=neckP(nw,0)

  // ✅ FIX 2C & 2D: Improved dress dimensions and rendering
  const dressImgW=(hi_w+20)*2, dressImgH=y_ft-y_sh+60  // ✅ +60 instead of +24

  const dressDefs = dressB64
    ? `<defs>
         <clipPath id="dCl"><path id="dClP" d="${initDr}"/></clipPath>
         <filter id="dressShade">
           <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
           <feOffset dx="0" dy="2" result="offsetblur"/>
           <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
           <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
         </filter>
       </defs>`
    : ''
  const dressLayer = dressB64
    ? `<g filter="url(#dressShade)">
         <image id="dImg" href="data:image/png;base64,${dressB64}" 
                x="${CX-dressImgW/2}" y="${y_sh-15}"  
                width="${dressImgW}" height="${dressImgH+30}" 
                clip-path="url(#dCl)" 
                preserveAspectRatio="xMidYMid slice" 
                opacity="0.97"/>
         <path d="${initDr}" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="1.5"/>
       </g>`
    : ''

  return `
<div style="font-family:system-ui;background:#08081a;border-radius:18px;padding:20px;display:flex;flex-direction:column;align-items:center;gap:12px;">
  <svg id="avSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="cursor:grab;display:block;">
    <defs>
      <radialGradient id="bgG"><stop offset="0%" stop-color="#1a1535"/><stop offset="100%" stop-color="#07071a"/></radialGradient>
      <linearGradient id="bodyG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${skin_sh}"/><stop offset="50%" stop-color="${skin_hi}"/><stop offset="100%" stop-color="${skin_sh}"/></linearGradient>
      <linearGradient id="legG" x1="0%" x2="0%" y1="0%" y2="100%"><stop offset="0%" stop-color="${skin_mid}"/><stop offset="100%" stop-color="${skin_sh}"/></linearGradient>
      <filter id="ds"><feDropShadow dx="2" dy="4" stdDeviation="5" flood-opacity="0.3"/></filter>
      ${dressDefs}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bgG)"/>
    <ellipse id="gndSh" cx="${CX}" cy="${y_ft+14}" rx="${hi_w}" ry="10" fill="rgba(0,0,0,0.18)"/>
    <path id="leftArm" d="${initLa}" fill="none" stroke="${skin}" stroke-width="${arm_w}" stroke-linecap="round"/>
    <ellipse id="leftHand" cx="${CX-sh_w-10}" cy="${y_sh+206}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>
    <path id="rightArm" d="${initRa}" fill="none" stroke="${skin}" stroke-width="${arm_w}" stroke-linecap="round"/>
    <ellipse id="rightHand" cx="${CX+sh_w+10}" cy="${y_sh+206}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>
    <path id="torso" d="${initBd}" fill="url(#bodyG)" filter="url(#ds)"/>
    ${dressLayer}
    <path id="neck" d="${initNk}" fill="${skin}" filter="url(#ds)"/>
    <circle id="headBase" cx="${CX}" cy="${y_hcy}" r="68" fill="${skin}" filter="url(#ds)"/>
    <circle id="hairBack" cx="${CX}" cy="${y_hcy}" r="70" fill="#2d1b0e" opacity="0"/>
    <image id="faceImg" href="${dbUrl}" x="${CX-80}" y="${y_hcy-88}" width="160" height="160" clip-path="circle(68px at 80px 82px)" opacity="1"/>
    <text id="viewLbl" x="${CX}" y="${H-16}" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.3)">FRONT · 0°</text>
  </svg>
  <div style="display:flex;gap:10px;">
    <button onclick="snapTo(0)" style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:7px 16px;border-radius:10px;cursor:pointer;font-size:12px;">⬆ Front</button>
    <button onclick="snapTo(90)" style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:7px 16px;border-radius:10px;cursor:pointer;font-size:12px;">➡ Right</button>
    <button onclick="snapTo(180)" style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:7px 16px;border-radius:10px;cursor:pointer;font-size:12px;">⬇ Back</button>
    <button onclick="snapTo(270)" style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:7px 16px;border-radius:10px;cursor:pointer;font-size:12px;">⬅ Left</button>
  </div>
  <input id="rotSl" type="range" min="0" max="359" value="0" step="1" style="width:100%;max-width:360px;accent-color:#8060e0;" oninput="setAngle(+this.value)"/>
  <div id="angleLbl" style="color:rgba(160,140,220,0.6);font-size:12px;">FRONT · 0°</div>
</div>

<script>
(function(){
var CX=${CX},W=${W},H=${H},SHW=${sh_w},BUW=${bu_w},WAW=${wa_w},HIW=${hi_w},THW=${th_w},CAW=${ca_w};
var YSH=${y_sh},YBU=${y_bu},YWA=${y_wa},YHI=${y_hi},YTH=${y_th},YKN=${y_kn},YCA=${y_ca},YFT=${y_ft},YNER=${y_nek},YHCY=${y_hcy};
var NW=${nw},ARW=${arm_w},AH=${ah};
var DW=${dressImgW},DH=${dressImgH};
var angle=0,dragStartX=null,dragStartAngle=0;

function mod360(a){return((a%360)+360)%360;}
function viewName(a){a=mod360(a);if(a<22)return'FRONT';if(a<112)return'RIGHT SIDE';if(a<202)return'BACK';if(a<292)return'LEFT SIDE';return'FRONT';}

function bodyPath(sw,bw,ww,hw,tw,cw,sh){
  var L=function(v){return CX-v+sh;},R=function(v){return CX+v+sh;};
  return'M '+L(sw)+','+YSH+' C '+L(sw+8)+','+(YSH+22)+' '+L(bw+5)+','+(YBU-16)+' '+L(bw)+','+YBU+' C '+L(bw-6)+','+(YBU+26)+' '+L(ww+4)+','+(YWA-14)+' '+L(ww)+','+YWA+' C '+L(ww+5)+','+(YWA+20)+' '+L(hw-4)+','+(YHI-12)+' '+L(hw)+','+YHI+' C '+L(hw-2)+','+(YHI+28)+' '+L(tw+4)+','+(YTH-10)+' '+L(tw)+','+YTH+' C '+L(tw-2)+','+(YTH+20)+' '+L(cw+2)+','+(YKN-8)+' '+L(cw)+','+YKN+' C '+L(cw)+','+(YKN+24)+' '+L(cw-2)+','+(YCA-6)+' '+L(cw-2)+','+YCA+' C '+L(cw-2)+','+(YCA+16)+' '+L(cw)+','+(YFT-4)+' '+L(cw+2)+','+YFT+' L '+R(cw+2)+','+YFT+' C '+R(cw)+','+(YFT-4)+' '+R(cw-2)+','+(YCA+16)+' '+R(cw-2)+','+YCA+' C '+R(cw-2)+','+(YCA-6)+' '+R(cw)+','+(YKN+24)+' '+R(cw)+','+YKN+' C '+R(cw+2)+','+(YKN-8)+' '+R(tw-2)+','+(YTH+20)+' '+R(tw)+','+YTH+' C '+R(tw+4)+','+(YTH-10)+' '+R(hw-2)+','+(YHI+28)+' '+R(hw)+','+YHI+' C '+R(hw-4)+','+(YHI-12)+' '+R(ww+5)+','+(YWA+20)+' '+R(ww)+','+YWA+' C '+R(ww+4)+','+(YWA-14)+' '+R(bw-6)+','+(YBU+26)+' '+R(bw)+','+YBU+' C '+R(bw+5)+','+(YBU-16)+' '+R(sw+8)+','+(YSH+22)+' '+R(sw)+','+YSH+' Z';
}

// ✅ FIX 3A: Updated dressPath function with full body coverage
function dressPath(sw,bw,ww,hw,tw,cw,sh){
  var L=function(v){return CX-v+sh;},R=function(v){return CX+v+sh;};
  var dressFlare = Math.max(hw * 0.18, 10);
  var ftW = hw + dressFlare;
  
  return 'M '+L(sw)+','+YSH+
         ' C '+L(sw+8)+','+(YSH+22)+' '+L(bw+5)+','+(YBU-16)+' '+L(bw)+','+YBU+
         ' C '+L(bw-6)+','+(YBU+26)+' '+L(ww+4)+','+(YWA-14)+' '+L(ww)+','+YWA+
         ' C '+L(ww+5)+','+(YWA+20)+' '+L(hw-4)+','+(YHI-12)+' '+L(hw)+','+YHI+
         ' C '+L(hw+2)+','+(YHI+24)+' '+L(tw+6)+','+(YTH-8)+' '+L(tw+8)+','+YTH+
         ' C '+L(tw+8)+','+(YTH+18)+' '+L(ftW-4)+','+(YKN-6)+' '+L(ftW-2)+','+YKN+
         ' C '+L(ftW-2)+','+(YKN+20)+' '+L(ftW)+','+(YCA-4)+' '+L(ftW)+','+YCA+
         ' C '+L(ftW)+','+(YCA+14)+' '+L(ftW+2)+','+(YFT-8)+' '+L(ftW+4)+','+YFT+
         ' L '+R(ftW+4)+','+YFT+
         ' C '+R(ftW+2)+','+(YFT-8)+' '+R(ftW)+','+(YCA+14)+' '+R(ftW)+','+YCA+
         ' C '+R(ftW)+','+(YCA-4)+' '+R(ftW-2)+','+(YKN+20)+' '+R(ftW-2)+','+YKN+
         ' C '+R(ftW-4)+','+(YKN-6)+' '+R(tw+8)+','+(YTH+18)+' '+R(tw+8)+','+YTH+
         ' C '+R(tw+6)+','+(YTH-8)+' '+R(hw+2)+','+(YHI+24)+' '+R(hw)+','+YHI+
         ' C '+R(hw-4)+','+(YHI-12)+' '+R(ww+5)+','+(YWA+20)+' '+R(ww)+','+YWA+
         ' C '+R(ww+4)+','+(YWA-14)+' '+R(bw-6)+','+(YBU+26)+' '+R(bw)+','+YBU+
         ' C '+R(bw+5)+','+(YBU-16)+' '+R(sw+8)+','+(YSH+22)+' '+R(sw)+','+YSH+' Z';
}

function armPath(s,sw,sh){
  var ax=CX+s*sw+sh,ay=YSH+10,ex=CX+s*(sw+28)+sh,ey=YSH+102,hx=CX+s*(sw+10)+sh,hy=YSH+198;
  return'M '+ax+','+ay+' C '+(ax+s*16)+','+(ay+26)+' '+(ex-s*5)+','+(ey-24)+' '+ex+','+ey+' C '+(ex+s*4)+','+(ey+32)+' '+(hx+s*9)+','+(hy-32)+' '+hx+','+hy;
}

function neckPath(nn,sh){return'M '+(CX-nn+sh)+','+(YNER+4)+' C '+(CX-nn+2+sh)+','+(YNER+14)+' '+(CX-nn+2+sh)+','+(YSH-8)+' '+(CX-nn+3+sh)+','+YSH+' L '+(CX+nn-3+sh)+','+YSH+' C '+(CX+nn-2+sh)+','+(YSH-8)+' '+(CX+nn-2+sh)+','+(YNER+14)+' '+(CX+nn+sh)+','+(YNER+4)+' Z';}

function update(a){
  a=mod360(a);
  var rad=a*Math.PI/180,cosA=Math.cos(rad),sinA=Math.sin(rad);
  var wS=Math.abs(cosA)*0.82+0.18,sh=Math.round(sinA*18);
  var sw=Math.max(8,Math.round(SHW*wS)),bw=Math.max(8,Math.round(BUW*wS));
  var ww=Math.max(8,Math.round(WAW*wS)),hw=Math.max(8,Math.round(HIW*wS));
  var tw=Math.max(6,Math.round(THW*wS)),cw=Math.max(6,Math.round(CAW*wS));
  var nn=Math.max(6,Math.round(NW*wS)),aw=Math.max(10,Math.round(ARW*wS)),ah=Math.max(6,Math.round(AH*wS));
  
  var showL=!(a>20&&a<160),showR=!(a>200&&a<340);
  var faceOp=Math.max(0,cosA).toFixed(2),backOp=Math.max(0,-cosA).toFixed(2);
  
  function S(id,attr,val){var el=document.getElementById(id);if(el)el.setAttribute(attr,val);}
  function O(id,val){var el=document.getElementById(id);if(el)el.style.opacity=val;}
  
  S('torso','d',bodyPath(sw,bw,ww,hw,tw,cw,sh));
  S('neck','d',neckPath(nn,sh));
  S('gndSh','rx',hw);
  S('leftArm','d',armPath(-1,sw,sh));S('leftArm','stroke-width',aw);S('leftHand','cx',CX-sw-10+sh);S('leftHand','rx',ah);S('leftHand','ry',ah+2);O('leftArm',showL?'1':'0');O('leftHand',showL?'1':'0');
  S('rightArm','d',armPath(1,sw,sh));S('rightArm','stroke-width',aw);S('rightHand','cx',CX+sw+10+sh);S('rightHand','rx',ah);S('rightHand','ry',ah+2);O('rightArm',showR?'1':'0');O('rightHand',showR?'1':'0');
  S('headBase','cx',CX+sh);S('faceImg','x',CX-80+sh);S('hairBack','cx',CX+sh);
  O('faceImg',faceOp);O('headBase',faceOp>0.05?'1':'0');O('hairBack',backOp);
  
  // ✅ FIX 3B: Update dressPath call with all parameters
  var dc=document.getElementById('dClP');if(dc)dc.setAttribute('d',dressPath(sw,bw,ww,hw,tw,cw,sh));
  
  // ✅ FIX 3C: Update dress image scaling with height
  var di=document.getElementById('dImg');
  if(di){
    var sW=DW*wS;
    var sH=Math.round((YFT-YSH+60)*wS);  // ✅ Scale height with rotation
    di.setAttribute('width',sW);
    di.setAttribute('height',sH);
    di.setAttribute('x',CX-sW/2+sh);
    di.setAttribute('y',YSH-15);
  }
  
  var vn=viewName(a);S('viewLbl','x',CX+sh);
  var lbl=document.getElementById('viewLbl');if(lbl)lbl.textContent=vn+' · '+Math.round(a)+'°';
  var al=document.getElementById('angleLbl');if(al)al.textContent=vn+' · '+Math.round(a)+'°';
  var sl=document.getElementById('rotSl');if(sl)sl.value=Math.round(a);
}

function setAngle(a){angle=mod360(a);update(angle);}
window.setAngle=setAngle;

function snapTo(target){
  var start=angle,diff=mod360(target-start);if(diff>180)diff-=360;
  var steps=30,step=0;
  function tick(){step++;var t=step/steps;t=t<0.5?2*t*t:-1+(4-2*t)*t;angle=mod360(start+diff*t);update(angle);if(step<steps)requestAnimationFrame(tick);else{angle=mod360(target);update(angle);}}
  requestAnimationFrame(tick);
}
window.snapTo=snapTo;

var svg=document.getElementById('avSvg');
if(svg){
  svg.addEventListener('mousedown',function(e){dragStartX=e.clientX;dragStartAngle=angle;svg.style.cursor='grabbing';e.preventDefault();});
  document.addEventListener('mousemove',function(e){if(dragStartX===null)return;var deltaX=e.clientX-dragStartX;angle=mod360(dragStartAngle+deltaX*0.6);update(angle);});
  document.addEventListener('mouseup',function(){dragStartX=null;if(svg)svg.style.cursor='grab';});
  svg.addEventListener('touchstart',function(e){dragStartX=e.touches[0].clientX;dragStartAngle=angle;e.preventDefault();},{passive:false});
  document.addEventListener('touchmove',function(e){if(dragStartX===null)return;var deltaX=e.touches[0].clientX-dragStartX;angle=mod360(dragStartAngle+deltaX*0.6);update(angle);},{passive:false});
  document.addEventListener('touchend',function(){dragStartX=null;});
}
update(0);
})();
</script>`
}

export default function Page() {
  const [category,setCategory]=useState('Women')
  const [photo,setPhoto]=useState<File|null>(null)
  const [preview,setPreview]=useState<string|null>(null)
  const [loading,setLoading]=useState(false)
  const [result,setResult]=useState<any>(null)
  const [error,setError]=useState<string|null>(null)
  const [dressB64,setDressB64]=useState<string|null>(null)
  const [dressPreview,setDressPreview]=useState<string|null>(null)
  const [dressLoading,setDressLoading]=useState(false)
  const [activeTab,setActiveTab]=useState<'analysis'|'tryon'|'shop'>('analysis')
  const photoRef=useRef<HTMLInputElement>(null)
  const dressRef=useRef<HTMLInputElement>(null)

  const handlePhoto=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]
    if(f){setPhoto(f);setPreview(URL.createObjectURL(f));setResult(null);setError(null);setDressB64(null);setDressPreview(null)}
  }

  const analyze=async()=>{
    if(!photo)return
    setLoading(true);setError(null)
    const fd=new FormData();fd.append('file',photo);fd.append('category',category)
    try{
      const r=await fetch('/api/analyze',{method:'POST',body:fd})
      const d=await r.json()
      if(!r.ok)throw new Error(d.error||'Analysis failed')
      // ✅ Store category in result for avatar gender detection
      d.category = category
      setResult(d);setActiveTab('analysis')
    }catch(err:any){setError(err.message||'Error')}
    finally{setLoading(false)}
  }

  const tryOn=async(f:File)=>{
    if(!result)return
    setDressLoading(true);setDressPreview(URL.createObjectURL(f))
    const fd=new FormData();fd.append('file',f)
    try{
      const r=await fetch('/api/extract-dress',{method:'POST',body:fd})
      const d=await r.json()
      if(!r.ok)throw new Error(d.error||'Extract failed')
      setDressB64(d.dress_b64)
    }catch(err:any){console.error(err)}
    finally{setDressLoading(false)}
  }

  const clearDress=()=>{setDressB64(null);setDressPreview(null)}

  const fitBadges=()=>{
    if(!result)return null
    const ease={Shoulder:0.5,Bust:2.5,Waist:3.0,Hip:2.0}
    const labels=[
      {k:'Shoulder',v:result.shoulder_cm},
      {k:'Bust',v:result.bust_cm},
      {k:'Waist',v:result.waist_cm},
      {k:'Hip',v:result.hip_cm}
    ]
    return <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
      {labels.map(({k,v})=>{
        const e=ease[k as keyof typeof ease]||2.5
        const rating=e<=1.5?'Snug':e<=4.0?'Perfect':'Roomy'
        const col=e<=1.5?'#c08060':e<=4.0?'#60c080':'#6080c0'
        return <div key={k} style={{background:'#0d0d22',border:'1px solid #1e1848',borderRadius:10,padding:'8px 12px'}}>
          <div style={{color:'#6060a0',fontSize:11}}>{k}</div>
          <div style={{color:'#e8d0ff',fontSize:16,fontWeight:700,marginTop:2}}>{v}cm</div>
          <div style={{color:col,fontSize:10,marginTop:3,fontWeight:600}}>{rating} ({e}cm ease)</div>
        </div>
      })}
    </div>
  }

  const avatarFrame=(id:string)=>(
    <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:16,padding:18}}>
      <div style={{color:'#e8c99a',fontWeight:800,marginBottom:8}}>✨ Your 3D Avatar — Drag to Rotate</div>
      {result&&<div id={id} dangerouslySetInnerHTML={{__html:buildAvatar(result,dressB64)}}/>}
    </div>
  )

  return(
    <main style={{background:'#060610',minHeight:'100vh',padding:'20px',fontFamily:'system-ui'}}>
      <div style={{maxWidth:1200,margin:'auto'}}>
        <h1 style={{color:'#e8c99a',textAlign:'center',fontSize:28,marginBottom:6}}>👗 3D Fashion Stylist Pro v16</h1>
        <p style={{color:'#6060a0',textAlign:'center',marginBottom:24,fontSize:13}}>Accurate body analysis · Gender-correct avatars · Full-body dress try-on</p>

        {!result&&(
          <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:18,padding:24,maxWidth:500,margin:'auto'}}>
            <div style={{display:'flex',gap:10,marginBottom:18}}>
              {['Women','Men','Kids'].map(c=><button key={c} onClick={()=>setCategory(c)} style={{flex:1,background:category===c?'linear-gradient(135deg,#6040c0,#9060e0)':'#1a1848',color:category===c?'#fff':'#7070b0',border:category===c?'none':'1px solid #2a2860',padding:'10px',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>{c}</button>)}
            </div>
            <div onClick={()=>photoRef.current?.click()} style={{border:'2px dashed #2a2860',borderRadius:14,padding:24,cursor:'pointer',background:'#0d0d2a',textAlign:'center',minHeight:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}>
              {preview?<img src={preview} alt="preview" style={{maxHeight:200,borderRadius:12,objectFit:'contain'}}/>:<><div style={{fontSize:48}}>📸</div><div style={{color:'#4040a0',fontSize:14}}>Click to upload photo</div><div style={{color:'#2a2a60',fontSize:11}}>Full body · Good lighting · Plain background works best</div></>}
            </div>
            <input ref={photoRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto}/>
            {error&&<div style={{marginTop:12,padding:12,background:'#1a0a10',border:'1px solid #401020',borderRadius:10,color:'#c08080',fontSize:13}}>{error}</div>}
            <button onClick={analyze} disabled={!photo||loading} style={{marginTop:18,width:'100%',background:photo&&!loading?'linear-gradient(135deg,#6040c0,#9060e0)':'#2a2860',color:photo&&!loading?'#fff':'#4040a0',border:'none',padding:'14px',borderRadius:12,cursor:photo&&!loading?'pointer':'not-allowed',fontWeight:800,fontSize:15}}>{loading?'⏳ Analyzing...':'🔬 Analyze Photo'}</button>
          </div>
        )}

        {result&&(
          <div>
            <div style={{display:'flex',gap:12,marginBottom:18,justifyContent:'center',flexWrap:'wrap'}}>
              {[{k:'analysis',l:'📊 Analysis'},{k:'tryon',l:'👗 Try-On'},{k:'shop',l:'🛍️ Shop'}].map(({k,l})=><button key={k} onClick={()=>setActiveTab(k as any)} style={{background:activeTab===k?'linear-gradient(135deg,#6040c0,#9060e0)':'#1a1848',color:activeTab===k?'#fff':'#7070b0',border:activeTab===k?'none':'1px solid #2a2860',padding:'10px 24px',borderRadius:11,cursor:'pointer',fontWeight:700,fontSize:13}}>{l}</button>)}
              <button onClick={()=>{setResult(null);setPhoto(null);setPreview(null);setDressB64(null);setDressPreview(null);setActiveTab('analysis')}} style={{background:'#1a0a20',color:'#c080a0',border:'1px solid #401030',padding:'10px 20px',borderRadius:11,cursor:'pointer',fontWeight:700,fontSize:13}}>↻ New Photo</button>
            </div>

            {activeTab==='analysis'&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(350px,1fr))',gap:18}}>
                {avatarFrame('av1')}
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div style={{background:'#10103a',border:'1px solid #2a2860',borderRadius:16,padding:18}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                      <div>
                        <div style={{color:'#e8c99a',fontSize:18,fontWeight:800}}>{result.body_icon||'👤'} {result.body_type}</div>
                        <div style={{color:'#5050a0',fontSize:12}}>{result.body_desc}</div>
                      </div>
                      <div style={{background:'linear-gradient(135deg,#6040c0,#9060e0)',color:'#fff',padding:'8px 16px',borderRadius:12,fontWeight:800,fontSize:20}}>SIZE {result.size}</div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
                      {[{l:'Height',v:`${result.height_cm}cm`},{l:'Shoulder',v:`${result.shoulder_cm}cm`},{l:'Bust',v:`${result.bust_cm}cm`},{l:'Waist',v:`${result.waist_cm}cm`},{l:'Hip',v:`${result.hip_cm}cm`},{l:'Inseam',v:`${result.inseam_cm}cm`}].map(({l,v})=><div key={l} style={{background:'#0d0d22',border:'1px solid #1e1848',borderRadius:10,padding:'8px 10px'}}><div style={{color:'#6060a0',fontSize:10}}>{l}</div><div style={{color:'#e8d0ff',fontSize:15,fontWeight:700,marginTop:2}}>{v}</div></div>)}
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
