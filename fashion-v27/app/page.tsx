'use client'
import { useState, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════════
   Fashion Stylist v30 — DEFINITIVE ARCHITECTURE
   ─────────────────────────────────────────────────────────────────
   TAB 1 · 3D AVATAR  — SVG body avatar (360° drag/spin) for Try-On
                        DiceBear face  •  body proportions from measurements
                        Dress image extracted & draped over avatar
   TAB 2 · ANALYSIS   — Actual uploaded photo shown as-is
                        Measurement guide lines overlay (Bust/Waist/Hi-Hip/Lo-Hip)
                        Body-type classification card
                        All 8 measurements grid
   TAB 3 · COLOURS    — Personalised palette per skin-tone × body-type
                        Colour swatches with hex + wear-how guide
   TAB 4 · SHOP       — Dress recommendations keyed to body-type + size + skin-tone
                        Amazon & Flipkart links  (permanent, never changes)
   ═══════════════════════════════════════════════════════════════════ */

// ── Colour hex lookup ─────────────────────────────────────────────
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

// ── Skin-tone palettes (expanded) ─────────────────────────────────
const SKIN_PALETTES: Record<string, {
  best: string[], avoid: string[], neutrals: string[],
  hex: string, tip: string
}> = {
  Fair: {
    hex:'#f5d5c8',
    best:["Pastel Pink","Lavender","Mint Green","Sky Blue","Blush Rose","Butter Yellow","Soft Peach","Dusty Rose","Sage"],
    neutrals:["Ivory","Champagne","Camel"],
    avoid:["Pure White","Neon Yellow","Neon Green"],
    tip:"Soft muted tones complement your fair complexion. Avoid stark white — ivory or champagne flatters more."
  },
  Light: {
    hex:'#ebbfa0',
    best:["Warm Coral","Dusty Mauve","Terracotta","Sky Blue","Blush","Peach","Sage","Dusty Rose","Cobalt"],
    neutrals:["Champagne","Camel","Ivory"],
    avoid:["Pale pastels","Washed-out greys"],
    tip:"Warm earth tones and soft corals make your skin glow. Rich blues create beautiful contrast."
  },
  Medium: {
    hex:'#c8956c',
    best:["Royal Blue","Emerald","Mustard","Teal","Burnt Orange","Cobalt","Coral","Forest Green","Plum"],
    neutrals:["Camel","Rust","Burnt Sienna"],
    avoid:["Muddy browns","Orange-browns similar to skin"],
    tip:"Bold jewel tones are your superpower. Vibrant colours create stunning contrast against medium skin."
  },
  Tan: {
    hex:'#a0694a',
    best:["Cobalt","Deep Burgundy","Fuchsia","Crimson","Navy","Electric Teal","Jade","Bright Gold","Forest Green"],
    neutrals:["Rust","Camel","Burnt Sienna"],
    avoid:["Dull khaki","Muddy olive","Washed-out colours"],
    tip:"Rich saturated colours and warm metallics illuminate tan skin beautifully. Avoid dull tones."
  },
  Deep: {
    hex:'#5c2e10',
    best:["Pure White","Bright Gold","Cobalt","Fuchsia","Hot Pink","Emerald","Crimson","Lavender","Mint Green"],
    neutrals:["Camel","Ivory","Champagne"],
    avoid:["Dark navy on dark skin","Black-on-black","Dark muddy tones"],
    tip:"High-contrast bright colours and metallics are stunning. Pure white creates a striking, elegant look."
  },
}

// ── Body-type data (complete) ─────────────────────────────────────
const BODY_DATA: Record<string, {
  icon:string, desc:string, shape:string,
  tips:string[], avoid:string[],
  bestStyles:string[], sareeStyle:string,
  colorFocus:string
}> = {
  "Hourglass":{
    icon:"⌛",shape:"Balanced shoulders & hips · Defined waist",
    desc:"Your proportions are naturally balanced — any silhouette that highlights your waist works.",
    tips:["Wrap dresses","Bodycon silhouettes","Belted kurtas","Fit & Flare","V-necks"],
    avoid:["Shapeless boxy cuts","Oversized tops that hide your waist"],
    bestStyles:["Wrap Dress","Sheath Dress","Belted Anarkali","Saree with narrow pallu"],
    sareeStyle:"Nivi drape — classic pleated pallu over shoulder flatters your shape perfectly.",
    colorFocus:"Any colour works. Bold solids and patterns both look great."
  },
  "Full Hourglass":{
    icon:"💎",shape:"Fuller curvaceous figure · Very defined waist",
    desc:"Curvaceous and feminine. Structured garments that follow your silhouette look stunning.",
    tips:["Structured wrap dresses","V-necklines","High-waist trousers","Empire waist"],
    avoid:["Clingy jersey without structure","Stiff A-lines"],
    bestStyles:["Structured Wrap Dress","V-neck Anarkali","Palazzo with fitted top"],
    sareeStyle:"Pre-stitched or georgette saree — smooth drape highlights curves without bulk.",
    colorFocus:"Solid jewel tones and deep shades. Avoid large all-over patterns."
  },
  "Pear":{
    icon:"🍐",shape:"Hips wider than bust · Smaller upper body",
    desc:"Draw attention upward with bright tops and detailed necklines. Streamline the lower half.",
    tips:["A-line skirts","Empire waist tops","Boat necks","Embellished necklines","Dark bottoms"],
    avoid:["Tight pencil skirts","Bold prints on hips","Skinny bottoms with plain tops"],
    bestStyles:["A-line Kurta","Empire Waist Maxi","Off-shoulder Top + Dark Palazzo","Anarkali"],
    sareeStyle:"Saree with broad border work at hem draws eye down — instead use plain border. Pallu over shoulder adds width at top.",
    colorFocus:"Bright/bold colours on top, dark solids on bottom."
  },
  "Full Pear":{
    icon:"🍐",shape:"Significantly wider hips · Smaller upper body",
    desc:"Statement upper body pieces with streamlined bottoms create beautiful balance.",
    tips:["Off-shoulder tops","Embellished necklines","A-line silhouettes","Bold prints on top only"],
    avoid:["Horizontal stripes on hips","Tight skirts","Hip pockets"],
    bestStyles:["Off-shoulder Kurti","A-line Anarkali","Empire Maxi","Flared Salwar"],
    sareeStyle:"Drape with extra fabric at bust area. Avoid tight-wrap at hips.",
    colorFocus:"Prints and bold colours on top half, plain dark on bottom."
  },
  "Apple":{
    icon:"🍎",shape:"Fuller midsection · Low waist definition",
    desc:"Create the illusion of a waist with empire cuts and vertical lines. V-necks elongate.",
    tips:["Empire waist cuts","V-necklines","Flowy tunics","Vertical stripes","A-line hemlines"],
    avoid:["Belted waists","Clingy fabrics at stomach","Crop tops","Horizontal stripes"],
    bestStyles:["Empire Waist Maxi","Flowy Anarkali","A-line Kurta","Tunic + Palazzo"],
    sareeStyle:"Pre-pleated or Gujarati saree style — blouse hem that falls straight rather than tucking.",
    colorFocus:"Dark monochromatic head-to-toe. Avoid bold prints at mid-section."
  },
  "Oval":{
    icon:"🥚",shape:"Bust larger than hips · Fuller upper body",
    desc:"Elongate with vertical elements. V-necks and minimal bust detail balance proportions.",
    tips:["Empire waist","V-necklines","Vertical stripes","Wrap styles","Long cardigans"],
    avoid:["Ruffles at bust","Boat necks","Halter necks","Horizontal bust details"],
    bestStyles:["V-neck Wrap Dress","Long Tunic","Straight-cut Kurta","Empire Maxi"],
    sareeStyle:"Chiffon or georgette — drape slightly lower at bust to reduce volume.",
    colorFocus:"Dark solid at top, can add interest at bottom. Vertical stripe patterns."
  },
  "Inverted Triangle":{
    icon:"🔻",shape:"Broader shoulders · Narrower hips",
    desc:"Add volume below the waist to create balance. Avoid shoulder details.",
    tips:["A-line skirts","Wide-leg trousers","Peplum tops","Flared hemlines","Low-rise bottoms"],
    avoid:["Shoulder pads","Halter necks","Boat necks","Ruffled sleeves","Cap sleeves"],
    bestStyles:["A-line Skirt Suit","Peplum Kurti","Flared Palazzo","Bell-bottom Salwar"],
    sareeStyle:"Lots of pleats at bottom. Fabric-heavy drape at hip area adds width below waist.",
    colorFocus:"Plain/dark on top, bold prints and bright on bottom."
  },
  "Rectangle":{
    icon:"▭",shape:"Balanced proportions · Minimal waist definition",
    desc:"Create curves with peplums, ruffles, and belts. Almost everything works on you.",
    tips:["Peplum tops","Ruffled hems","Belted dresses","Wrap styles","Layered looks"],
    avoid:["Very straight shift dresses (boring)","One-note monotone head to toe"],
    bestStyles:["Peplum Kurti","Belted Wrap Dress","Fit & Flare","Ruffled Saree Blouse"],
    sareeStyle:"Any drape style works. Experiment with Gujarati, Mumtaz, or Lehenga-style sarees.",
    colorFocus:"You can wear anything! Play with colour-blocking and bold prints."
  },
  "Petite":{
    icon:"🌸",shape:"Smaller overall frame · Shorter stature",
    desc:"Elongate with vertical lines and monochromatic dressing. Avoid overwhelming volume.",
    tips:["Monochromatic outfits","Vertical stripes","Mini lengths","High-waist styles","Fitted cuts"],
    avoid:["Oversized garments","Ankle-length heavy fabrics","Large bold prints"],
    bestStyles:["Fitted Salwar Kameez","Straight-cut Mini Kurta","High-waist Palazzo","Wrap Dress"],
    sareeStyle:"Lightweight saree (chiffon/georgette). Pre-stitched saree avoids bulk.",
    colorFocus:"Monochromatic head-to-toe elongates. Small prints preferred over large."
  },
  "Trapezoid":{
    icon:"🔷",shape:"Broad shoulders tapering to hips (Men)",
    desc:"Classic athletic shape. Fitted clothes showcase your physique.",
    tips:["Slim chinos","Fitted dress shirts","Straight-cut trousers","V-neck tees"],
    avoid:["Boxy oversized tops","Drop-shoulder cuts"],
    bestStyles:["Slim Fit Formal Shirt","Fitted Kurta","Straight Trousers"],
    sareeStyle:"N/A",colorFocus:"Classic neutrals and rich jewel tones work equally well."
  },
  "Triangle":{
    icon:"🔺",shape:"Wider hips than shoulders (Men)",
    desc:"Add volume at the top, streamline the lower half.",
    tips:["Structured blazers","Light-coloured tops","Dark trousers","Wide lapels"],
    avoid:["Tapered trousers","Skinny jeans","Pleated trousers"],
    bestStyles:["Structured Blazer","Wide-lapel Shirt","Straight-cut Kurta"],
    sareeStyle:"N/A",colorFocus:"Light or bright on top, dark on bottom."
  },
  "Circle":{
    icon:"⭕",shape:"Rounder midsection (Men)",
    desc:"Vertical lines and structured shoulders create a leaner silhouette.",
    tips:["Vertical stripes","Longer tops","Dark solids","Structured jackets","V-necks"],
    avoid:["Horizontal stripes","Clingy knits","Tucked-in shirts"],
    bestStyles:["Dark Vertical Stripe Shirt","Structured Blazer","Nehru Collar Kurta"],
    sareeStyle:"N/A",colorFocus:"Dark monochromatic. Avoid bold prints at midsection."
  },
  "Column":{
    icon:"🏛",shape:"Uniform width top to bottom (Men)",
    desc:"Create visual interest with layering and texture.",
    tips:["Layered looks","Textured fabrics","Patterned shirts","Structured jackets"],
    avoid:["Very plain single-layer outfits"],
    bestStyles:["Layered Kurta Jacket","Patterned Shirt","Structured Blazer"],
    sareeStyle:"N/A",colorFocus:"Play with patterns, textures, and colour-blocking."
  },
}

// ── Dress product catalogue (permanent) ──────────────────────────
const PRODUCTS: Record<string, any[]> = {
  Women:[
    {name:"Floral Wrap Dress",        body:["Hourglass","Full Hourglass","Rectangle"],                   colors:["Pastel Pink","Lavender","Blush Rose","Mint Green"],     sizes:["XS","S","M","L","XL","XXL"],       amazon:"https://www.amazon.in/s?k=women+floral+wrap+dress",         flipkart:"https://www.flipkart.com/search?q=women+floral+wrap+dress"},
    {name:"A-Line Ethnic Kurta",       body:["Pear","Full Pear","Rectangle","Petite","Apple"],            colors:["Royal Blue","Mint Green","Butter Yellow","Coral"],       sizes:["XS","S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+a-line+ethnic+kurta",        flipkart:"https://www.flipkart.com/search?q=women+a+line+kurta"},
    {name:"Bodycon Party Dress",       body:["Hourglass","Full Hourglass"],                              colors:["Cobalt","Crimson","Pure White","Jade"],                   sizes:["XS","S","M","L","XL"],             amazon:"https://www.amazon.in/s?k=women+bodycon+party+dress",        flipkart:"https://www.flipkart.com/search?q=women+bodycon+dress"},
    {name:"Empire Waist Maxi",         body:["Apple","Pear","Full Pear","Petite","Oval"],                colors:["Lavender","Soft Peach","Mint Green","Dusty Mauve"],       sizes:["XS","S","M","L","XL","XXL"],       amazon:"https://www.amazon.in/s?k=women+empire+waist+maxi",         flipkart:"https://www.flipkart.com/search?q=women+empire+waist+maxi"},
    {name:"Anarkali Suit",             body:["Apple","Pear","Full Pear","Full Hourglass","Rectangle"],   colors:["Deep Burgundy","Cobalt","Jade","Emerald"],                sizes:["S","M","L","XL","XXL","XXXL"],     amazon:"https://www.amazon.in/s?k=women+anarkali+suit",             flipkart:"https://www.flipkart.com/search?q=women+anarkali"},
    {name:"Printed Saree",             body:["Pear","Hourglass","Apple","Rectangle","Full Hourglass"],   colors:["Royal Blue","Crimson","Mustard","Teal","Bright Gold"],    sizes:["Free Size"],                       amazon:"https://www.amazon.in/s?k=women+printed+saree",             flipkart:"https://www.flipkart.com/search?q=women+printed+saree"},
    {name:"Salwar Kameez",             body:["Pear","Rectangle","Apple","Hourglass","Petite"],           colors:["Terracotta","Mustard","Cobalt","Sage"],                   sizes:["XS","S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+salwar+kameez",             flipkart:"https://www.flipkart.com/search?q=women+salwar+kameez"},
    {name:"Fit & Flare Dress",         body:["Hourglass","Pear","Full Pear","Rectangle"],                colors:["Blush Rose","Sky Blue","Mint Green","Warm Coral"],        sizes:["XS","S","M","L","XL"],             amazon:"https://www.amazon.in/s?k=women+fit+flare+dress",           flipkart:"https://www.flipkart.com/search?q=women+fit+flare"},
    {name:"Peplum Kurti",              body:["Rectangle","Inverted Triangle","Apple"],                   colors:["Cobalt","Deep Burgundy","Emerald","Fuchsia"],             sizes:["XS","S","M","L","XL","XXL"],       amazon:"https://www.amazon.in/s?k=women+peplum+kurti",             flipkart:"https://www.flipkart.com/search?q=women+peplum+kurti"},
    {name:"Off-Shoulder Kurti",        body:["Pear","Full Pear","Petite"],                               colors:["Warm Coral","Mint Green","Lavender","Blush Rose"],        sizes:["XS","S","M","L","XL","XXL"],       amazon:"https://www.amazon.in/s?k=women+off+shoulder+kurti",        flipkart:"https://www.flipkart.com/search?q=women+off+shoulder+top"},
    {name:"Palazzo Set",               body:["Apple","Oval","Inverted Triangle","Rectangle"],            colors:["Navy","Teal","Mustard","Forest Green"],                   sizes:["S","M","L","XL","XXL","XXXL"],     amazon:"https://www.amazon.in/s?k=women+palazzo+set",               flipkart:"https://www.flipkart.com/search?q=women+palazzo+set"},
    {name:"Kaftan Dress",              body:["Apple","Oval","Rectangle"],                                colors:["Teal","Emerald","Mustard","Burnt Orange"],                sizes:["Free Size","L","XL","XXL","XXXL"], amazon:"https://www.amazon.in/s?k=women+kaftan+dress",              flipkart:"https://www.flipkart.com/search?q=women+kaftan"},
    {name:"Lehenga Choli",             body:["Hourglass","Full Hourglass","Pear","Full Pear"],           colors:["Crimson","Bright Gold","Deep Burgundy","Royal Blue"],     sizes:["XS","S","M","L","XL","XXL"],       amazon:"https://www.amazon.in/s?k=women+lehenga+choli",            flipkart:"https://www.flipkart.com/search?q=women+lehenga"},
    {name:"Straight-Cut Kurti",        body:["Rectangle","Petite","Oval","Apple"],                       colors:["Teal","Cobalt","Jade","Sage"],                            sizes:["XS","S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+straight+cut+kurti",        flipkart:"https://www.flipkart.com/search?q=women+straight+kurti"},
  ],
  Men:[
    {name:"Slim Fit Formal Shirt",     body:["Trapezoid","Column","Rectangle"],                          colors:["Royal Blue","Pure White","Cobalt"],                       sizes:["S","M","L","XL","XXL","XXXL"],     amazon:"https://www.amazon.in/s?k=men+slim+fit+formal+shirt",       flipkart:"https://www.flipkart.com/search?q=men+slim+formal+shirt"},
    {name:"Structured Blazer",         body:["Triangle","Circle","Column","Rectangle"],                  colors:["Navy","Deep Burgundy","Teal"],                            sizes:["S","M","L","XL","XXL"],            amazon:"https://www.amazon.in/s?k=men+structured+blazer",           flipkart:"https://www.flipkart.com/search?q=men+blazer"},
    {name:"Polo T-Shirt",              body:["Trapezoid","Column","Rectangle","Triangle"],               colors:["Navy","Cobalt","Emerald","Crimson"],                      sizes:["S","M","L","XL","XXL","XXXL"],     amazon:"https://www.amazon.in/s?k=men+polo+tshirt",                flipkart:"https://www.flipkart.com/search?q=men+polo+tshirt"},
    {name:"Kurta Pyjama",              body:["Rectangle","Column","Trapezoid","Circle"],                 colors:["Pure White","Cobalt","Deep Burgundy"],                    sizes:["S","M","L","XL","XXL","XXXL"],     amazon:"https://www.amazon.in/s?k=men+kurta+pyjama+set",            flipkart:"https://www.flipkart.com/search?q=men+kurta+pyjama"},
    {name:"Nehru Collar Jacket",       body:["Trapezoid","Column","Circle"],                             colors:["Navy","Deep Burgundy","Forest Green"],                    sizes:["S","M","L","XL","XXL"],            amazon:"https://www.amazon.in/s?k=men+nehru+jacket",                flipkart:"https://www.flipkart.com/search?q=men+nehru+jacket"},
  ],
  Kids:[
    {name:"Cotton Frock",              body:["Petite"],colors:["Pastel Pink","Mint Green","Butter Yellow"],sizes:["2Y","3Y","4Y","5Y","6Y"],amazon:"https://www.amazon.in/s?k=kids+cotton+frock",flipkart:"https://www.flipkart.com/search?q=kids+frock"},
    {name:"Party Dress",               body:["Petite"],colors:["Fuchsia","Lavender","Bright Gold"],       sizes:["4Y","5Y","6Y","7Y","8Y+"],amazon:"https://www.amazon.in/s?k=kids+party+dress",flipkart:"https://www.flipkart.com/search?q=kids+party+dress"},
  ],
}

// ── Helpers ───────────────────────────────────────────────────────
function lighten(hex:string, f:number){
  const h=hex.replace('#','')
  return '#'+[0,2,4].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(h.slice(i,i+2),16)*f))).toString(16).padStart(2,'0')).join('')
}

/* ════════════════════════════════════════════════════════════════
   360° SVG AVATAR — ONLY used for virtual try-on tab
   DiceBear face + body proportions from measurements
   Dress image clamped to body silhouette with clip-path
   ════════════════════════════════════════════════════════════════ */
function buildAvatar(result:any, dressB64:string|null):string{
  const skin    = result.skin_hex||'#c8956c'
  const skinTone= result.skin_tone||'Medium'
  const bodyType= result.body_type||'Rectangle'
  const CX=210,W=420,H=700,SC=4.8
  const hw=(c:number)=>Math.max(10,Math.round((c/(2*Math.PI))*SC))
  const sh_w=Math.max(hw((result.shoulder_cm||40)*1.05),52)
  const bu_w=hw(result.bust_cm||88)
  const wa_w=hw(result.waist_cm||72)
  const hh_w=hw(result.high_hip_cm||90)
  const hi_w=hw(result.hip_cm||94)
  const th_w=Math.round(hi_w*0.68), ca_w=Math.round(hi_w*0.37)
  const arm_w=Math.max(14,Math.round(sh_w*0.28)), nw=Math.max(12,Math.round(sh_w*0.26)), ah=Math.round(arm_w/2)
  const y_sh=218,y_bu=y_sh+70,y_wa=y_bu+60,y_hh=y_wa+38,y_hi=y_hh+30
  const y_th=y_hi+76,y_kn=y_th+58,y_ca=y_kn+50,y_ft=y_ca+46
  const y_nek=y_sh-24,y_hcy=y_nek-80
  const skin_sh=lighten(skin,0.62),skin_hi=lighten(skin,1.26),skin_mid=lighten(skin,0.80),skin_drk=lighten(skin,0.46)

  const pSkin:Record<string,string>={Fair:'ecru',Light:'apricot',Medium:'bronze',Tan:'copper',Deep:'sepia'}
  const pHair:Record<string,string>={Fair:'2c1b18',Light:'3d2314',Medium:'1c0d00',Tan:'0d0500',Deep:'080200'}
  const isMen=result.category==='Men'
  const faceUrl=isMen
    ?`https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=${skinTone}${bodyType}&backgroundColor=transparent&scale=115`
    :`https://api.dicebear.com/9.x/personas/svg?seed=${skinTone}${bodyType}&skinColor=${pSkin[skinTone]||'bronze'}&hairColor=${pHair[skinTone]||'1c0d00'}&backgroundColor=transparent&scale=110`

  function bodyP(sw:number,bw:number,ww:number,hhw:number,hiw:number,tw:number,cw:number,sh:number){
    const L=(v:number)=>CX-v+sh,R=(v:number)=>CX+v+sh
    return`M ${L(sw)},${y_sh} C ${L(sw+10)},${y_sh+24} ${L(bw+6)},${y_bu-18} ${L(bw)},${y_bu} C ${L(bw-7)},${y_bu+28} ${L(ww+4)},${y_wa-16} ${L(ww)},${y_wa} C ${L(ww+4)},${y_wa+18} ${L(hhw-3)},${y_hh-12} ${L(hhw)},${y_hh} C ${L(hhw+2)},${y_hh+16} ${L(hiw-2)},${y_hi-10} ${L(hiw)},${y_hi} C ${L(hiw-2)},${y_hi+28} ${L(tw+4)},${y_th-12} ${L(tw)},${y_th} C ${L(tw-2)},${y_th+22} ${L(cw+2)},${y_kn-10} ${L(cw)},${y_kn} C ${L(cw)},${y_kn+26} ${L(cw-2)},${y_ca-6} ${L(cw-2)},${y_ca} C ${L(cw-2)},${y_ca+18} ${L(cw)},${y_ft-4} ${L(cw+2)},${y_ft} L ${R(cw+2)},${y_ft} C ${R(cw)},${y_ft-4} ${R(cw-2)},${y_ca+18} ${R(cw-2)},${y_ca} C ${R(cw-2)},${y_ca-6} ${R(cw)},${y_kn+26} ${R(cw)},${y_kn} C ${R(cw+2)},${y_kn-10} ${R(tw-2)},${y_th+22} ${R(tw)},${y_th} C ${R(tw+4)},${y_th-12} ${R(hiw-2)},${y_hi+28} ${R(hiw)},${y_hi} C ${R(hiw+2)},${y_hi-10} ${R(hhw+2)},${y_hh+16} ${R(hhw)},${y_hh} C ${R(hhw-3)},${y_hh-12} ${R(ww+4)},${y_wa+18} ${R(ww)},${y_wa} C ${R(ww+4)},${y_wa-16} ${R(bw-7)},${y_bu+28} ${R(bw)},${y_bu} C ${R(bw+6)},${y_bu-18} ${R(sw+10)},${y_sh+24} ${R(sw)},${y_sh} Z`
  }
  function dressP(sw:number,bw:number,ww:number,hhw:number,hiw:number,sh:number){
    const sw2=sw+20,bw2=bw+14,ww2=ww+6,hhw2=hhw+8,hiw2=hiw+10
    const L=(v:number)=>CX-v+sh,R=(v:number)=>CX+v+sh
    return`M ${L(sw2)},${y_sh} C ${L(sw2+10)},${y_sh+24} ${L(bw2+6)},${y_bu-18} ${L(bw2)},${y_bu} C ${L(bw2-7)},${y_bu+28} ${L(ww2+4)},${y_wa-16} ${L(ww2)},${y_wa} C ${L(ww2+4)},${y_wa+20} ${L(hhw2-2)},${y_hh-12} ${L(hhw2)},${y_hh} C ${L(hhw2+2)},${y_hh+22} ${L(hiw2+2)},${y_ft-14} ${L(hiw2-2)},${y_ft} L ${R(hiw2-2)},${y_ft} C ${R(hiw2+2)},${y_ft-14} ${R(hhw2+2)},${y_hh+22} ${R(hhw2)},${y_hh} C ${R(hhw2-2)},${y_hh-12} ${R(ww2+4)},${y_wa+20} ${R(ww2)},${y_wa} C ${R(ww2+4)},${y_wa-16} ${R(bw2-7)},${y_bu+28} ${R(bw2)},${y_bu} C ${R(bw2+6)},${y_bu-18} ${R(sw2+10)},${y_sh+24} ${R(sw2)},${y_sh} Z`
  }
  function armP(s:number,sw:number,sh:number){
    const ax=CX+s*sw+sh,ay=y_sh+12,ex=CX+s*(sw+30)+sh,ey=y_sh+108,hx=CX+s*(sw+12)+sh,hy=y_sh+210
    return`M ${ax},${ay} C ${ax+s*18},${ay+28} ${ex-s*6},${ey-26} ${ex},${ey} C ${ex+s*4},${ey+34} ${hx+s*10},${hy-34} ${hx},${hy}`
  }
  function neckP(nn:number,sh:number){
    return`M ${CX-nn+sh},${y_nek+4} C ${CX-nn+2+sh},${y_nek+16} ${CX-nn+2+sh},${y_sh-8} ${CX-nn+3+sh},${y_sh} L ${CX+nn-3+sh},${y_sh} C ${CX+nn-2+sh},${y_sh-8} ${CX+nn-2+sh},${y_nek+16} ${CX+nn+sh},${y_nek+4} Z`
  }

  const iBd=bodyP(sh_w,bu_w,wa_w,hh_w,hi_w,th_w,ca_w,0)
  const iDr=dressP(sh_w,bu_w,wa_w,hh_w,hi_w,0)
  const iLa=armP(-1,sh_w,0),iRa=armP(1,sh_w,0),iNk=neckP(nw,0)
  const dW=(hi_w+34)*2,dH=y_ft-y_sh+30

  return`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:radial-gradient(ellipse at 50% 48%,#141030 0%,#050510 100%);display:flex;flex-direction:column;align-items:center;padding:12px 6px 8px;font-family:system-ui}svg{cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none}.cb{background:rgba(26,20,62,0.92);color:#c0b0f0;border:1px solid rgba(80,60,160,0.5);padding:6px 13px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;transition:all .15s}.cb:hover{background:#3a2d80;color:#fff}.cb.on{background:#5b21b6;color:#fff;border-color:#8b5cf6}</style>
</head><body>
<svg id="av" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto">
<defs>
<radialGradient id="bg" cx="50%" cy="48%" r="66%"><stop offset="0%" stop-color="#181040"/><stop offset="100%" stop-color="#040410"/></radialGradient>
<linearGradient id="bG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${skin_drk}"/><stop offset="25%" stop-color="${skin_sh}"/><stop offset="52%" stop-color="${skin_hi}" stop-opacity="0.85"/><stop offset="75%" stop-color="${skin}"/><stop offset="100%" stop-color="${skin_drk}"/></linearGradient>
<radialGradient id="hG" cx="42%" cy="38%" r="60%"><stop offset="0%" stop-color="${skin_hi}"/><stop offset="55%" stop-color="${skin}"/><stop offset="100%" stop-color="${skin_sh}"/></radialGradient>
<filter id="bl"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="ds"><feDropShadow dx="2" dy="6" stdDeviation="6" flood-opacity="0.32"/></filter>
${dressB64?`<clipPath id="dCl"><path id="dClP" d="${iDr}"/></clipPath>`:''}
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<ellipse cx="${CX}" cy="${y_ft+22}" rx="${hi_w+16}" ry="13" fill="rgba(80,60,180,0.12)" filter="url(#bl)"/>
<path id="la" d="${iLa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${dressB64?0:1}"/>
<ellipse id="lh" cx="${CX-sh_w-12}" cy="${y_sh+212}" rx="${ah}" ry="${ah+2}" fill="${skin}" opacity="${dressB64?0:1}"/>
<path id="ra" d="${iRa}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${dressB64?0:1}"/>
<ellipse id="rh" cx="${CX+sh_w+12}" cy="${y_sh+212}" rx="${ah}" ry="${ah+2}" fill="${skin}" opacity="${dressB64?0:1}"/>
<path id="body" d="${iBd}" fill="url(#bG)" filter="url(#ds)"/>
${dressB64?`<image id="dImg" href="data:image/png;base64,${dressB64}" x="${CX-dW/2}" y="${y_sh}" width="${dW}" height="${dH}" clip-path="url(#dCl)" preserveAspectRatio="xMidYMid slice" opacity="0.96"/>
<path d="${iDr}" fill="none" stroke="rgba(0,0,0,0.07)" stroke-width="1.5"/>
<path id="la2" d="${iLa}" fill="none" stroke="${skin_mid}" stroke-width="${Math.max(10,arm_w-4)}" stroke-linecap="round"/>
<ellipse id="lh2" cx="${CX-sh_w-12}" cy="${y_sh+212}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>
<path id="ra2" d="${iRa}" fill="none" stroke="${skin_mid}" stroke-width="${Math.max(10,arm_w-4)}" stroke-linecap="round"/>
<ellipse id="rh2" cx="${CX+sh_w+12}" cy="${y_sh+212}" rx="${ah}" ry="${ah+2}" fill="${skin}"/>`:''}
<path id="neck" d="${iNk}" fill="${skin_mid}" filter="url(#ds)"/>
<circle id="head" cx="${CX}" cy="${y_hcy}" r="70" fill="url(#hG)" filter="url(#ds)"/>
<image id="face" href="${faceUrl}" x="${CX-84}" y="${y_hcy-90}" width="168" height="168" clip-path="circle(70px at 84px 86px)" preserveAspectRatio="xMidYMid meet"/>
<ellipse id="lft" cx="${CX-ca_w+4}" cy="${y_ft+7}" rx="${ca_w+6}" ry="8" fill="${lighten(skin,0.50)}"/>
<ellipse id="rft" cx="${CX+ca_w-4}" cy="${y_ft+7}" rx="${ca_w+6}" ry="8" fill="${lighten(skin,0.50)}"/>
<text id="vl" x="${CX}" y="${H-6}" text-anchor="middle" font-size="10" font-family="system-ui" fill="rgba(180,160,255,0.20)">FRONT · 0° · ${bodyType}</text>
</svg>
<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:10px">
<button class="cb" onclick="snapTo(0)">⬆ Front</button>
<button class="cb" onclick="snapTo(90)">➡ Right</button>
<button class="cb" onclick="snapTo(180)">⬇ Back</button>
<button class="cb" onclick="snapTo(270)">⬅ Left</button>
<button class="cb" id="sb" onclick="toggleSpin()">▶ Spin</button>
</div>
<input type="range" min="0" max="359" value="0" step="1" style="width:250px;accent-color:#8060e0;margin-top:8px" oninput="setAngle(+this.value)" id="sl"/>
<script>
(function(){
var CX=${CX},SHW=${sh_w},BUW=${bu_w},WAW=${wa_w},HHW=${hh_w},HIW=${hi_w},THW=${th_w},CAW=${ca_w},NW=${nw},ARW=${arm_w},AH=${ah};
var YSH=${y_sh},YBU=${y_bu},YWA=${y_wa},YHH=${y_hh},YHI=${y_hi},YTH=${y_th},YKN=${y_kn},YCA=${y_ca},YFT=${y_ft},YNER=${y_nek},YHCY=${y_hcy};
var BT="${bodyType}",hasDress=${dressB64?'true':'false'},DW=${dW};
var angle=0,spinning=false,raf=null,dragX=null,dragA=0;
function m360(a){return((a%360)+360)%360;}
function vn(a){a=m360(a);if(a<22)return'FRONT';if(a<67)return'FRONT-R';if(a<112)return'RIGHT';if(a<157)return'BACK-R';if(a<202)return'BACK';if(a<247)return'BACK-L';if(a<292)return'LEFT';return'FRONT-L';}
function S(id,attr,val){var e=document.getElementById(id);if(e)e.setAttribute(attr,val);}
function O(id,v){var e=document.getElementById(id);if(e)e.style.opacity=v;}
function bP(sw,bw,ww,hhw,hiw,tw,cw,sh){
  var L=function(v){return CX-v+sh;},R=function(v){return CX+v+sh;};
  return'M '+L(sw)+','+YSH+' C '+L(sw+10)+','+(YSH+24)+' '+L(bw+6)+','+(YBU-18)+' '+L(bw)+','+YBU+' C '+L(bw-7)+','+(YBU+28)+' '+L(ww+4)+','+(YWA-16)+' '+L(ww)+','+YWA+' C '+L(ww+4)+','+(YWA+18)+' '+L(hhw-3)+','+(YHH-12)+' '+L(hhw)+','+YHH+' C '+L(hhw+2)+','+(YHH+16)+' '+L(hiw-2)+','+(YHI-10)+' '+L(hiw)+','+YHI+' C '+L(hiw-2)+','+(YHI+28)+' '+L(tw+4)+','+(YTH-12)+' '+L(tw)+','+YTH+' C '+L(tw-2)+','+(YTH+22)+' '+L(cw+2)+','+(YKN-10)+' '+L(cw)+','+YKN+' C '+L(cw)+','+(YKN+26)+' '+L(cw-2)+','+(YCA-6)+' '+L(cw-2)+','+YCA+' C '+L(cw-2)+','+(YCA+18)+' '+L(cw)+','+(YFT-4)+' '+L(cw+2)+','+YFT+' L '+R(cw+2)+','+YFT+' C '+R(cw)+','+(YFT-4)+' '+R(cw-2)+','+(YCA+18)+' '+R(cw-2)+','+YCA+' C '+R(cw-2)+','+(YCA-6)+' '+R(cw)+','+(YKN+26)+' '+R(cw)+','+YKN+' C '+R(cw+2)+','+(YKN-10)+' '+R(tw-2)+','+(YTH+22)+' '+R(tw)+','+YTH+' C '+R(tw+4)+','+(YTH-12)+' '+R(hiw-2)+','+(YHI+28)+' '+R(hiw)+','+YHI+' C '+R(hiw+2)+','+(YHI-10)+' '+R(hhw+2)+','+(YHH+16)+' '+R(hhw)+','+YHH+' C '+R(hhw-3)+','+(YHH-12)+' '+R(ww+4)+','+(YWA+18)+' '+R(ww)+','+YWA+' C '+R(ww+4)+','+(YWA-16)+' '+R(bw-7)+','+(YBU+28)+' '+R(bw)+','+YBU+' C '+R(bw+6)+','+(YBU-18)+' '+R(sw+10)+','+(YSH+24)+' '+R(sw)+','+YSH+' Z';
}
function dP(sw,bw,ww,hhw,hiw,sh){
  var sw2=sw+20,bw2=bw+14,ww2=ww+6,hhw2=hhw+8,hiw2=hiw+10;
  var L=function(v){return CX-v+sh;},R=function(v){return CX+v+sh;};
  return'M '+L(sw2)+','+YSH+' C '+L(sw2+10)+','+(YSH+24)+' '+L(bw2+6)+','+(YBU-18)+' '+L(bw2)+','+YBU+' C '+L(bw2-7)+','+(YBU+28)+' '+L(ww2+4)+','+(YWA-16)+' '+L(ww2)+','+YWA+' C '+L(ww2+4)+','+(YWA+20)+' '+L(hhw2-2)+','+(YHH-12)+' '+L(hhw2)+','+YHH+' C '+L(hhw2+2)+','+(YHH+22)+' '+L(hiw2+2)+','+(YFT-14)+' '+L(hiw2-2)+','+YFT+' L '+R(hiw2-2)+','+YFT+' C '+R(hiw2+2)+','+(YFT-14)+' '+R(hhw2+2)+','+(YHH+22)+' '+R(hhw2)+','+YHH+' C '+R(hhw2-2)+','+(YHH-12)+' '+R(ww2+4)+','+(YWA+20)+' '+R(ww2)+','+YWA+' C '+R(ww2+4)+','+(YWA-16)+' '+R(bw2-7)+','+(YBU+28)+' '+R(bw2)+','+YBU+' C '+R(bw2+6)+','+(YBU-18)+' '+R(sw2+10)+','+(YSH+24)+' '+R(sw2)+','+YSH+' Z';
}
function aP(s,sw,sh){var ax=CX+s*sw+sh,ay=YSH+12,ex=CX+s*(sw+30)+sh,ey=YSH+108,hx=CX+s*(sw+12)+sh,hy=YSH+210;return'M '+ax+','+ay+' C '+(ax+s*18)+','+(ay+28)+' '+(ex-s*6)+','+(ey-26)+' '+ex+','+ey+' C '+(ex+s*4)+','+(ey+34)+' '+(hx+s*10)+','+(hy-34)+' '+hx+','+hy;}
function nP(nn,sh){return'M '+(CX-nn+sh)+','+(YNER+4)+' C '+(CX-nn+2+sh)+','+(YNER+16)+' '+(CX-nn+2+sh)+','+(YSH-8)+' '+(CX-nn+3+sh)+','+YSH+' L '+(CX+nn-3+sh)+','+YSH+' C '+(CX+nn-2+sh)+','+(YSH-8)+' '+(CX+nn-2+sh)+','+(YNER+16)+' '+(CX+nn+sh)+','+(YNER+4)+' Z';}
function upd(a){
  a=m360(a);var r=a*Math.PI/180,cosA=Math.cos(r),sinA=Math.sin(r);
  var wS=Math.abs(cosA)*0.86+0.14,sh=Math.round(sinA*24);
  var sw=Math.max(10,Math.round(SHW*wS)),bw=Math.max(10,Math.round(BUW*wS));
  var ww=Math.max(10,Math.round(WAW*wS)),hhw=Math.max(10,Math.round(HHW*wS));
  var hiw=Math.max(10,Math.round(HIW*wS));
  var tw=Math.max(8,Math.round(THW*wS)),cw=Math.max(6,Math.round(CAW*wS));
  var nn=Math.max(5,Math.round(NW*wS)),aw=Math.round(ARW*wS),ah2=Math.round(aw/2);
  S('body','d',bP(sw,bw,ww,hhw,hiw,tw,cw,sh));
  S('neck','d',nP(nn,sh));
  S('head','cx',CX+sh);
  var fi=document.getElementById('face');if(fi)fi.setAttribute('x',CX-84+sh);
  O('face',Math.max(0,cosA).toFixed(2));
  S('lft','cx',CX-cw+4+sh);S('rft','cx',CX+cw-4+sh);
  if(!hasDress){var sL=!(a>28&&a<152),sR=!(a>208&&a<332);S('la','d',aP(-1,sw,sh));S('ra','d',aP(1,sw,sh));O('la',sL?'1':'0');O('lh',sL?'1':'0');O('ra',sR?'1':'0');O('rh',sR?'1':'0');S('lh','cx',CX-sw-12+sh);S('rh','cx',CX+sw+12+sh);}
  if(hasDress){
    var dc=document.getElementById('dClP');if(dc)dc.setAttribute('d',dP(sw,bw,ww,hhw,hiw,sh));
    var di=document.getElementById('dImg');if(di){var sW=DW*wS;di.setAttribute('width',sW.toFixed(1));di.setAttribute('x',(CX-sW/2+sh).toFixed(1));di.style.opacity=(0.55+Math.max(0,cosA)*0.42).toFixed(2);}
    S('la2','d',aP(-1,sw,sh));S('ra2','d',aP(1,sw,sh));
    var sL2=!(a>28&&a<152),sR2=!(a>208&&a<332);O('la2',sL2?'0.9':'0');O('lh2',sL2?'0.9':'0');O('ra2',sR2?'0.9':'0');O('rh2',sR2?'0.9':'0');S('lh2','cx',CX-sw-12+sh);S('rh2','cx',CX+sw+12+sh);
  }
  S('vl','x',CX+sh);var vl=document.getElementById('vl');if(vl)vl.textContent=vn(a)+' · '+Math.round(a)+'° · '+BT;
  var sl=document.getElementById('sl');if(sl)sl.value=Math.round(a);
}
function setAngle(a){angle=m360(a);upd(angle);}window.setAngle=setAngle;
function snapTo(t){var st=angle,df=m360(t-st);if(df>180)df-=360;var N=28,i=0;function tick(){i++;var p=i/N;p=p<.5?2*p*p:-1+(4-2*p)*p;angle=m360(st+df*p);upd(angle);if(i<N)raf=requestAnimationFrame(tick);else{angle=m360(t);upd(angle);}}requestAnimationFrame(tick);}window.snapTo=snapTo;
function toggleSpin(){spinning=!spinning;var b=document.getElementById('sb');if(b){b.textContent=spinning?'⏸ Stop':'▶ Spin';spinning?b.classList.add('on'):b.classList.remove('on');}if(spinning)loop();else if(raf){cancelAnimationFrame(raf);raf=null;}}window.toggleSpin=toggleSpin;
function loop(){if(!spinning)return;angle=m360(angle+1.0);upd(angle);raf=requestAnimationFrame(loop);}
var sv=document.getElementById('av');
if(sv){
  sv.addEventListener('mousedown',function(e){spinning=false;var b=document.getElementById('sb');if(b){b.textContent='▶ Spin';b.classList.remove('on');}if(raf){cancelAnimationFrame(raf);raf=null;}dragX=e.clientX;dragA=angle;sv.style.cursor='grabbing';e.preventDefault();});
  document.addEventListener('mousemove',function(e){if(dragX===null)return;angle=m360(dragA+(e.clientX-dragX)*0.54);upd(angle);});
  document.addEventListener('mouseup',function(){dragX=null;if(sv)sv.style.cursor='grab';});
  sv.addEventListener('touchstart',function(e){spinning=false;if(raf){cancelAnimationFrame(raf);raf=null;}dragX=e.touches[0].clientX;dragA=angle;e.preventDefault();},{passive:false});
  document.addEventListener('touchmove',function(e){if(dragX===null)return;angle=m360(dragA+(e.touches[0].clientX-dragX)*0.54);upd(angle);e.preventDefault();},{passive:false});
  document.addEventListener('touchend',function(){dragX=null;});
}
upd(0);
})();
</script></body></html>`
}

/* ════════════════════════════════════════════════════════════════
   ANALYSIS VIEW — the ACTUAL photo with measurement guide overlay
   Shows the real photo + 5 horizontal measurement lines at correct
   anatomical positions (matching Olivia Paisley guide image)
   ════════════════════════════════════════════════════════════════ */
function AnalysisView({result, photoUrl}: {result:any, photoUrl:string|null}) {
  const m = result
  const bd = BODY_DATA[m.body_type] || BODY_DATA['Rectangle']

  // Measurement lines: y position as % of photo height
  // These match standard full-body photo proportions (head-to-toe)
  const mLines = [
    { label:'BUST',     y:27, val:`${m.bust_cm}cm`,       color:'#00d4ff' },
    { label:'WAIST',    y:38, val:`${m.waist_cm}cm`,      color:'#ffd700' },
    { label:'HIGH HIP', y:48, val:`${m.high_hip_cm||'—'}cm`, color:'#ff80ff' },
    { label:'LOW HIP',  y:56, val:`${m.hip_cm}cm`,        color:'#a080ff' },
  ]

  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>

      {/* Left: photo with measurement lines */}
      <div style={{position:'relative',borderRadius:16,overflow:'hidden',background:'#000',minHeight:380}}>
        {photoUrl
          ? <img src={photoUrl} alt="analysis" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'top',display:'block'}}/>
          : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:380,color:'#303060',fontSize:14}}>Photo not available</div>
        }
        {/* Measurement guide lines overlay */}
        {photoUrl && mLines.map(l => (
          <div key={l.label} style={{
            position:'absolute',left:'4%',right:'4%',top:`${l.y}%`,
            borderTop:`2px solid ${l.color}`,
            display:'flex',justifyContent:'space-between',alignItems:'flex-end',
            pointerEvents:'none'
          }}>
            <span style={{fontSize:9,fontWeight:800,color:l.color,background:'rgba(0,0,0,0.6)',padding:'1px 5px',borderRadius:3,marginTop:-14,letterSpacing:0.5}}>{l.label}</span>
            <span style={{fontSize:10,fontWeight:800,color:l.color,background:'rgba(0,0,0,0.6)',padding:'1px 6px',borderRadius:3,marginTop:-16}}>{l.val}</span>
          </div>
        ))}
        {/* Size badge on photo */}
        <div style={{position:'absolute',top:10,left:10,background:'rgba(10,6,30,0.88)',border:'1px solid rgba(139,92,246,0.4)',borderRadius:8,padding:'4px 10px',display:'flex',gap:6,alignItems:'center'}}>
          <span style={{color:'#ffd700',fontWeight:800,fontSize:14}}>{m.size}</span>
          <span style={{color:'#8060c0',fontSize:11}}>{m.body_icon} {m.body_type}</span>
        </div>
      </div>

      {/* Right: body type details + all measurements */}
      <div style={{display:'flex',flexDirection:'column',gap:12}}>

        {/* Body type card */}
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
          {bd.sareeStyle!=='N/A' && (
            <div style={{marginTop:10,padding:'8px 10px',background:'rgba(255,215,0,0.06)',border:'1px solid rgba(255,215,0,0.15)',borderRadius:8}}>
              <div style={{color:'#ffd700',fontWeight:700,fontSize:11,marginBottom:2}}>🥻 Saree Style</div>
              <div style={{color:'#8070a0',fontSize:11,lineHeight:1.5}}>{bd.sareeStyle}</div>
            </div>
          )}
        </div>

        {/* Measurements grid — full Olivia Paisley guide */}
        <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
          <div style={{color:'#e8c99a',fontWeight:700,fontSize:12,marginBottom:10}}>📏 Your Measurements</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6}}>
            {([
              ['Shoulder',   m.shoulder_cm,     '#80ff80'],
              ['Bust',       m.bust_cm,          '#00d4ff'],
              ['Waist',      m.waist_cm,          '#ffd700'],
              ['High Hip',   m.high_hip_cm,       '#ff80ff'],
              ['Hip (Low)',  m.hip_cm,            '#a080ff'],
              ['Height',     m.height_cm,         '#c0c0ff'],
              ['Hollow→Hem', m.hollow_to_hem_cm,  '#ffa0a0'],
              ['Inseam',     m.inseam_cm,         '#a0c0ff'],
            ] as [string,any,string][]).map(([k,v,c])=>(
              <div key={k} style={{background:'#06061a',border:`1px solid ${c}22`,borderRadius:8,padding:'8px 10px'}}>
                <div style={{color:'#303060',fontSize:9,textTransform:'uppercase',letterSpacing:0.8,marginBottom:2}}>{k}</div>
                <div style={{color:c,fontWeight:800,fontSize:15}}>{v||'—'}<span style={{fontSize:9,color:'#303060',marginLeft:2}}>cm</span></div>
              </div>
            ))}
          </div>
          {m.height_source && <div style={{color:'#282850',fontSize:10,marginTop:6,textAlign:'center'}}>📐 {m.height_source} · ±3cm accuracy</div>}
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   COLOURS TAB — rich personalised palette
   ════════════════════════════════════════════════════════════════ */
function ColoursTab({result}:{result:any}) {
  const st   = result.skin_tone || 'Medium'
  const bt   = result.body_type || 'Rectangle'
  const pal  = SKIN_PALETTES[st] || SKIN_PALETTES['Medium']
  const bd   = BODY_DATA[bt]    || BODY_DATA['Rectangle']

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Skin tone header */}
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16,display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:pal.hex,border:'3px solid rgba(255,255,255,0.12)',flexShrink:0,boxShadow:`0 4px 16px ${pal.hex}55`}}/>
        <div style={{flex:1}}>
          <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:2}}>{st} Skin Tone</div>
          <div style={{color:'#5050a0',fontSize:12,lineHeight:1.6}}>{pal.tip}</div>
        </div>
      </div>

      {/* Best colours */}
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

      {/* Neutrals */}
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

      {/* Avoid */}
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
        <div style={{color:'#ef4444',fontWeight:700,fontSize:12,marginBottom:8}}>✗ Best to Avoid</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {pal.avoid.map(a=><span key={a} style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',color:'#ef4444',borderRadius:6,padding:'3px 10px',fontSize:11}}>{a}</span>)}
        </div>
      </div>

      {/* Body-type colour focus */}
      <div style={{background:'#0c0c28',border:'1px solid #252565',borderRadius:14,padding:14}}>
        <div style={{color:'#e8c99a',fontWeight:700,fontSize:12,marginBottom:6}}>💡 Colour Strategy for {bt}</div>
        <div style={{color:'#5050a0',fontSize:12,lineHeight:1.6}}>{bd.colorFocus}</div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   SHOP TAB — permanent dress recommendations
   ════════════════════════════════════════════════════════════════ */
function ShopTab({result,category}:{result:any,category:string}) {
  const bt   = result.body_type
  const size = result.size
  const best = new Set(result.best_colors||[])
  const all  = PRODUCTS[category]||PRODUCTS.Women

  // Tier 1: perfect match (body + size + colour)
  let t1 = all.filter((p:any)=>p.body.includes(bt)&&p.sizes.includes(size)&&p.colors.some((c:string)=>best.has(c)))
  // Tier 2: body + size
  let t2 = all.filter((p:any)=>p.body.includes(bt)&&p.sizes.includes(size)&&!t1.includes(p))
  // Tier 3: body type only
  let t3 = all.filter((p:any)=>p.body.includes(bt)&&!t1.includes(p)&&!t2.includes(p))
  const matched = [...t1,...t2,...t3].length ? [...t1,...t2,...t3] : all

  const bd = BODY_DATA[bt]||BODY_DATA['Rectangle']

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* Header with best styles for this body type */}
      <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:16}}>
        <div style={{color:'#e8c99a',fontWeight:800,fontSize:14,marginBottom:6}}>
          🛍 Best Styles for {bt} · Size {size}
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
          {bd.bestStyles.map(s=><span key={s} style={{background:'rgba(139,92,246,0.12)',border:'1px solid rgba(139,92,246,0.25)',color:'#a78bfa',borderRadius:8,padding:'3px 10px',fontSize:12}}>{s}</span>)}
        </div>
        <div style={{color:'#4a4070',fontSize:11}}>Showing {matched.length} recommendations matched to your body type, size, and colour palette</div>
      </div>

      {/* Product cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
        {matched.map((p:any,i:number)=>{
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
  const [step,         setStep]        = useState<'upload'|'result'>('upload')
  const [loading,      setLoading]     = useState(false)
  const [error,        setError]       = useState('')
  const [result,       setResult]      = useState<any>(null)
  const [photoUrl,     setPhotoUrl]    = useState<string|null>(null)   // for analysis view
  const [preview,      setPreview]     = useState<string|null>(null)   // upload preview
  const [category,     setCategory]    = useState('Women')
  const [userHeight,   setUserHeight]  = useState('')
  const [dressB64,     setDressB64]    = useState<string|null>(null)
  const [dressPreview, setDressPreview]= useState<string|null>(null)
  const [dressLoading, setDressLoading]= useState(false)
  const [activeTab,    setActiveTab]   = useState<'avatar'|'analysis'|'colours'|'shop'>('avatar')

  const fileRef  = useRef<HTMLInputElement>(null)
  const dressRef = useRef<HTMLInputElement>(null)

  const analyze = async (file: File) => {
    setLoading(true); setError('')
    try {
      setPhotoUrl(URL.createObjectURL(file))
      const form = new FormData()
      form.append('file', file); form.append('category', category)
      if (userHeight) form.append('user_height', userHeight)
      const data = await fetch('/api/analyze',{method:'POST',body:form}).then(r=>r.json())
      if (data.error) { setError(data.error); setLoading(false); return }
      setResult(data)
      // Auto-extract dress from uploaded photo
      extractDress(file, true)
      setStep('result')
    } catch(e:any) { setError(e.message) }
    setLoading(false)
  }

  const extractDress = async (file: File, silent=false) => {
    if (!silent) setDressLoading(true)
    try {
      const form = new FormData(); form.append('file', file)
      const data = await fetch('/api/extract-dress',{method:'POST',body:form}).then(r=>r.json())
      if (!data.error) {
        setDressB64(data.dress_b64)
        setDressPreview(`data:image/png;base64,${data.dress_b64}`)
      }
    } catch {}
    if (!silent) setDressLoading(false)
  }

  const clearDress = () => { setDressB64(null); setDressPreview(null) }

  // Avatar iframe — key forces re-render when dress changes
  const avatarFrame = (withDress: boolean) => {
    if (!result) return null
    const k = `av-${withDress&&dressB64?dressB64.slice(-8):'bare'}`
    return (
      <div style={{background:'#08081a',borderRadius:16,overflow:'hidden',minHeight:520}}>
        <iframe key={k} srcDoc={buildAvatar(result, withDress?dressB64:null)}
          style={{width:'100%',height:600,border:'none',display:'block'}} title="avatar" sandbox="allow-scripts"/>
      </div>
    )
  }

  const tabBtn = (id:string, label:string) => (
    <button onClick={()=>setActiveTab(id as any)} style={{
      padding:'10px 16px',border:'none',cursor:'pointer',fontWeight:700,fontSize:13,
      background:'transparent',
      color:activeTab===id?'#e8c99a':'#38307a',
      borderBottom:activeTab===id?'2px solid #e8c99a':'2px solid transparent',
      whiteSpace:'nowrap',transition:'color .15s'
    }}>{label}</button>
  )

  return (
    <main style={{minHeight:'100vh',background:'#06061a',color:'#e8e0ff',fontFamily:'system-ui,sans-serif'}}>

      {/* ── HEADER ── */}
      <div style={{background:'linear-gradient(135deg,#160830,#0a0420)',padding:'15px 22px',borderBottom:'1px solid #140d30',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
        <div>
          <h1 style={{margin:0,fontSize:'1.4rem',fontWeight:800,color:'#e8c99a'}}>👗 3D Fashion Stylist Pro</h1>
          <p style={{margin:'2px 0 0',color:'#4a3870',fontSize:'0.72rem'}}>
            AI body analysis · 360° avatar try-on · Colour science · Style recommendations
          </p>
        </div>
        {result && (
          <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(20,14,50,0.9)',border:'1px solid #221848',borderRadius:12,padding:'6px 14px'}}>
            <span style={{width:11,height:11,borderRadius:'50%',background:result.skin_hex,border:'1px solid #666',display:'inline-block'}}/>
            <span style={{fontWeight:800,color:'#ffd700',fontSize:15}}>{result.size}</span>
            <span style={{color:'#7060a0',fontSize:12}}>{result.body_icon} {result.body_type}</span>
          </div>
        )}
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'16px 12px'}}>

        {/* ══ UPLOAD ══ */}
        {step==='upload' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:16}}>

            <div style={{background:'#0c0c28',border:'1px solid #181840',borderRadius:18,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:800,fontSize:15,marginBottom:4}}>📸 Upload Your Photo</div>
              <div style={{color:'#383068',fontSize:12,marginBottom:14,lineHeight:1.5}}>
                Full-body photo, facing camera, head to toe. Your photo is used for measurement analysis only.
              </div>
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
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,background:'#08081e',borderRadius:10,padding:'9px 12px',border:'1px solid #141440'}}>
                <span>📏</span>
                <span style={{color:'#383060',fontSize:12}}>Height (optional)</span>
                <input type="number" value={userHeight} onChange={e=>setUserHeight(e.target.value)}
                  placeholder="162" min="80" max="220"
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#e8e0ff',fontSize:14,fontWeight:700,minWidth:0}}/>
                <span style={{color:'#282850',fontSize:12}}>cm</span>
              </div>
              <div onClick={()=>fileRef.current?.click()} style={{
                border:`2px dashed ${preview?'#4030a0':'#161638'}`,
                borderRadius:14,cursor:'pointer',background:'#080818',textAlign:'center',
                minHeight:200,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,
                padding:preview?6:28,transition:'all .2s'
              }}>
                {preview
                  ? <img src={preview} alt="preview" style={{maxHeight:260,borderRadius:10,objectFit:'contain'}}/>
                  : <><div style={{fontSize:56}}>📷</div><div style={{color:'#3a2c80',fontSize:13,fontWeight:700}}>Tap to choose photo</div><div style={{color:'#1e1c40',fontSize:11}}>JPG · PNG · WEBP</div></>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
                onChange={e=>{const f=e.target.files?.[0];if(f){setPreview(URL.createObjectURL(f));analyze(f)}}}/>
              {loading && (
                <div style={{marginTop:12,padding:'12px 14px',background:'#120a30',border:'1px solid #301870',borderRadius:10,textAlign:'center'}}>
                  <div style={{color:'#8060d0',fontWeight:700,fontSize:13}}>⏳ Analysing your body...</div>
                  <div style={{color:'#3a2870',fontSize:11,marginTop:4}}>Measuring · Classifying · Generating avatar</div>
                </div>
              )}
              {error && <div style={{marginTop:12,padding:'10px 14px',background:'#1e0606',border:'1px solid #500',borderRadius:8,color:'#ff6060',fontSize:12}}>❌ {error}</div>}
            </div>

            <div style={{background:'#0c0c28',border:'1px solid #141440',borderRadius:18,padding:22}}>
              <div style={{color:'#e8c99a',fontWeight:700,fontSize:14,marginBottom:14}}>✨ What you get</div>
              {([
                ['🔄','360° spinning avatar — DiceBear face · body proportions match YOUR measurements'],
                ['👗','Virtual try-on — drag any dress onto your avatar and rotate it'],
                ['📸','Analysis view — your photo with 5-point measurement guide (Bust/Waist/Hi-Hip/Lo-Hip)'],
                ['🎨','Colour science — personalised palette per skin tone + body type strategy'],
                ['🛍','Permanent dress catalogue — best styles for YOUR shape, size and colours'],
                ['💡','Saree drape guide, style tips & what-to-avoid for your body type'],
              ] as [string,string][]).map(([icon,text])=>(
                <div key={text} style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:13}}>
                  <span style={{fontSize:20,flexShrink:0}}>{icon}</span>
                  <span style={{color:'#4a3880',fontSize:13,lineHeight:1.5}}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ RESULT ══ */}
        {step==='result' && result && (
          <div>
            {/* Tab bar */}
            <div style={{display:'flex',borderBottom:'1px solid #141440',marginBottom:16,overflowX:'auto',gap:0}}>
              {tabBtn('avatar',  '🔄 3D Try-On')}
              {tabBtn('analysis','📊 Analysis')}
              {tabBtn('colours', '🎨 Colours')}
              {tabBtn('shop',    '🛍 Shop')}
              <button onClick={()=>{setStep('upload');setResult(null);setPreview(null);setPhotoUrl(null);clearDress()}}
                style={{marginLeft:'auto',padding:'7px 13px',background:'#110d30',color:'#3a2870',border:'1px solid #1a1640',borderRadius:8,cursor:'pointer',fontSize:12,flexShrink:0}}>
                📸 New Photo
              </button>
            </div>

            {/* ── TAB: 3D TRY-ON ── */}
            {activeTab==='avatar' && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:16}}>
                {avatarFrame(true)}
                <div style={{display:'flex',flexDirection:'column',gap:14}}>

                  {/* Upload outfit */}
                  <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:16,padding:18}}>
                    <div style={{color:'#e8c99a',fontWeight:800,marginBottom:4}}>👗 Upload Outfit for Try-On</div>
                    <div style={{color:'#3a2e70',fontSize:12,marginBottom:12,lineHeight:1.5}}>
                      {dressB64 ? 'Outfit is on your avatar ✓  Upload another to swap.' : 'Drag any dress image — it extracts and drapes on your avatar.'}
                    </div>
                    <div onClick={()=>dressRef.current?.click()} style={{
                      border:'2px dashed #161640',borderRadius:12,padding:14,cursor:'pointer',
                      background:'#080818',textAlign:'center',minHeight:120,
                      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,transition:'all .2s'
                    }}>
                      {dressPreview
                        ? <img src={dressPreview} alt="outfit" style={{maxHeight:120,borderRadius:8,objectFit:'contain'}}/>
                        : <><span style={{fontSize:36}}>👗</span><span style={{color:'#2e2860',fontSize:12}}>Upload outfit photo</span><span style={{color:'#1a1640',fontSize:11}}>Saree · Dress · Suit · Kurta</span></>
                      }
                    </div>
                    <input ref={dressRef} type="file" accept="image/*" style={{display:'none'}}
                      onChange={e=>{const f=e.target.files?.[0];if(f)extractDress(f)}}/>
                    {dressLoading && <div style={{marginTop:8,color:'#6050c0',fontSize:12,textAlign:'center'}}>⏳ Extracting outfit...</div>}
                    {dressB64 && (
                      <button onClick={clearDress} style={{marginTop:10,width:'100%',background:'#120818',color:'#903080',border:'1px solid #280c26',padding:'8px',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700}}>
                        🗑 Remove outfit
                      </button>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div style={{background:'#0c0c28',border:'1px solid #1a1848',borderRadius:14,padding:14}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10,flexWrap:'wrap'}}>
                      <span style={{fontSize:24}}>{(BODY_DATA[result.body_type]||BODY_DATA['Rectangle']).icon}</span>
                      <span style={{color:'#e8c99a',fontWeight:800,fontSize:15}}>{result.body_type}</span>
                      <span style={{background:'#2e1578',color:'#ffd700',padding:'3px 12px',borderRadius:8,fontWeight:800,fontSize:14}}>{result.size}</span>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5}}>
                      {([['Bust',result.bust_cm],['Waist',result.waist_cm],['Hip',result.hip_cm],['Height',result.height_cm]] as [string,any][]).map(([k,v])=>(
                        <div key={k} style={{background:'#06061a',border:'1px solid #101038',borderRadius:7,padding:'6px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <span style={{color:'#28285a',fontSize:10,textTransform:'uppercase'}}>{k}</span>
                          <span style={{color:'#c0b8e8',fontWeight:800,fontSize:13}}>{v}<span style={{fontSize:9,color:'#303060',marginLeft:1}}>cm</span></span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setActiveTab('analysis')} style={{flex:1,background:'#0e0e30',color:'#7060a0',border:'1px solid #1a1848',padding:'10px',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:12}}>
                      📊 Analysis
                    </button>
                    <button onClick={()=>setActiveTab('colours')} style={{flex:1,background:'linear-gradient(135deg,#4018a0,#7030c0)',color:'#fff',border:'none',padding:'10px',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:12}}>
                      🎨 Colours →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: ANALYSIS ── */}
            {activeTab==='analysis' && photoUrl && (
              <AnalysisView result={result} photoUrl={photoUrl}/>
            )}

            {/* ── TAB: COLOURS ── */}
            {activeTab==='colours' && (
              <ColoursTab result={result}/>
            )}

            {/* ── TAB: SHOP ── */}
            {activeTab==='shop' && (
              <ShopTab result={result} category={category}/>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
