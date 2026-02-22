'use client'

interface Props {
  category:   string
  skinTone:   string
  bodyType:   string
  size:       string
  bestColors: string[]
}

const COLOR_HEX: Record<string,string> = {
  "Pastel Pink":"#FFD1DC","Lavender":"#E6D0FF","Mint Green":"#AAFFDD",
  "Sky Blue":"#87CEEB","Blush Rose":"#FFB6C1","Butter Yellow":"#FFFACD",
  "Soft Peach":"#FFDAB9","Warm Coral":"#FF7F50","Dusty Mauve":"#C09090",
  "Champagne":"#F7E7CE","Terracotta":"#E07050","Royal Blue":"#4169E1",
  "Emerald":"#50C878","Mustard":"#FFDB58","Teal":"#008080",
  "Cobalt":"#0047AB","Deep Burgundy":"#800020","Fuchsia":"#FF00FF",
  "Crimson":"#DC143C","Navy":"#001F5B","Pure White":"#FFFFFF",
  "Bright Gold":"#FFD700","Hot Pink":"#FF69B4","Coral":"#FF6B6B",
  "Blush":"#DE5D83","Jade":"#00A86B","Lime":"#32CD32","Peach":"#FFCBA4",
}

const PRODUCTS = {
  Women:[
    {name:"Floral Wrap Dress",   body:["Hourglass","Full Hourglass","Rectangle"], colors:["Pastel Pink","Lavender","Blush Rose"],  sizes:["XS","S","M","L","XL","XXL"], amazon:"https://www.amazon.in/s?k=women+floral+wrap+dress",    flipkart:"https://www.flipkart.com/search?q=women+floral+wrap+dress"},
    {name:"A-Line Ethnic Kurta", body:["Pear","Rectangle","Petite","Apple"],       colors:["Royal Blue","Mint Green","Butter Yellow"],sizes:["XS","S","M","L","XL","XXL","XXXL"], amazon:"https://www.amazon.in/s?k=women+a-line+ethnic+kurta",  flipkart:"https://www.flipkart.com/search?q=women+a+line+kurta"},
    {name:"Bodycon Party Dress", body:["Hourglass","Full Hourglass"],             colors:["Cobalt","Crimson","Pure White"],          sizes:["XS","S","M","L","XL"], amazon:"https://www.amazon.in/s?k=women+bodycon+party+dress",  flipkart:"https://www.flipkart.com/search?q=women+bodycon+dress"},
    {name:"Peplum Ethnic Set",   body:["Inverted Triangle","Rectangle","Apple"],   colors:["Mustard","Terracotta","Teal"],            sizes:["S","M","L","XL","XXL"], amazon:"https://www.amazon.in/s?k=women+peplum+ethnic+set",    flipkart:"https://www.flipkart.com/search?q=women+peplum+set"},
    {name:"Empire Waist Maxi",   body:["Apple","Pear","Petite"],                  colors:["Lavender","Soft Peach","Mint Green"],     sizes:["XS","S","M","L","XL","XXL"], amazon:"https://www.amazon.in/s?k=women+empire+waist+maxi+dress",flipkart:"https://www.flipkart.com/search?q=women+empire+waist+maxi"},
    {name:"Anarkali Suit",       body:["Apple","Pear","Full Hourglass","Rectangle"],colors:["Deep Burgundy","Cobalt","Jade"],         sizes:["S","M","L","XL","XXL","XXXL"], amazon:"https://www.amazon.in/s?k=women+anarkali+suit",        flipkart:"https://www.flipkart.com/search?q=women+anarkali"},
    {name:"Printed Saree",       body:["Pear","Hourglass","Apple","Rectangle"],    colors:["Royal Blue","Crimson","Mustard","Teal"],  sizes:["Free Size"], amazon:"https://www.amazon.in/s?k=women+printed+saree",        flipkart:"https://www.flipkart.com/search?q=women+printed+saree"},
    {name:"Fit & Flare Dress",   body:["Hourglass","Pear","Rectangle"],           colors:["Blush Rose","Sky Blue","Mint Green"],     sizes:["XS","S","M","L","XL"], amazon:"https://www.amazon.in/s?k=women+fit+flare+dress",      flipkart:"https://www.flipkart.com/search?q=women+fit+flare"},
  ],
  Men:[
    {name:"Slim Fit Formal Shirt",body:["Trapezoid","Column","Rectangle"],         colors:["Royal Blue","Pure White","Cobalt"],       sizes:["S","M","L","XL","XXL","XXXL"], amazon:"https://www.amazon.in/s?k=men+slim+fit+formal+shirt",  flipkart:"https://www.flipkart.com/search?q=men+slim+formal+shirt"},
    {name:"Structured Blazer",   body:["Triangle","Circle","Column","Rectangle"],  colors:["Navy","Deep Burgundy","Teal"],            sizes:["S","M","L","XL","XXL"], amazon:"https://www.amazon.in/s?k=men+structured+blazer",      flipkart:"https://www.flipkart.com/search?q=men+blazer"},
    {name:"Polo T-Shirt",        body:["Trapezoid","Column","Rectangle","Triangle"],colors:["Navy","Cobalt","Emerald","Crimson"],      sizes:["S","M","L","XL","XXL","XXXL"], amazon:"https://www.amazon.in/s?k=men+polo+tshirt",            flipkart:"https://www.flipkart.com/search?q=men+polo+tshirt"},
  ],
  Kids:[
    {name:"Cotton Frock",        body:["Petite"],                                  colors:["Pastel Pink","Mint Green","Butter Yellow"],sizes:["2-4Y","4-6Y","6-8Y","8-10Y"], amazon:"https://www.amazon.in/s?k=kids+girls+cotton+frock",    flipkart:"https://www.flipkart.com/search?q=kids+frock+dress"},
    {name:"Party Dress",         body:["Petite"],                                  colors:["Fuchsia","Lavender","Bright Gold"],        sizes:["2-4Y","4-6Y","6-8Y","8-10Y","10-12Y"], amazon:"https://www.amazon.in/s?k=kids+party+dress",           flipkart:"https://www.flipkart.com/search?q=kids+party+dress"},
  ],
} as const

export default function RecommendPanel({ category, skinTone, bodyType, size, bestColors }: Props) {
  const all = (PRODUCTS as any)[category] ?? PRODUCTS.Women
  const best = new Set(bestColors)

  let matched = all.filter((p:any) => p.body.includes(bodyType) && p.sizes.includes(size) && p.colors.some((c:string)=>best.has(c)))
  if(!matched.length) matched = all.filter((p:any)=>p.body.includes(bodyType))
  if(!matched.length) matched = all

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ color:'#e8c99a', fontWeight:800, fontSize:15 }}>
        🛍️ {matched.length} Recommendations — {bodyType} · {skinTone} · Size {size}
      </div>
      {matched.map((p:any) => {
        const mc = p.colors.filter((c:string)=>best.has(c)).length ? p.colors.filter((c:string)=>best.has(c)) : p.colors.slice(0,2)
        return (
          <div key={p.name} style={{ background:'#10103a', border:'1px solid #1e1848', borderRadius:14, padding:'16px 18px' }}>
            <div style={{ color:'#e8c99a', fontWeight:700, fontSize:15, marginBottom:8 }}>{p.name}</div>
            <div style={{ display:'flex', gap:6, marginBottom:8 }}>
              {mc.map((c:string) => (
                <span key={c} style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#1e1848', color:'#a090d0', border:'1px solid #2e2868', borderRadius:8, padding:'3px 10px', fontSize:11 }}>
                  <span style={{ width:12, height:12, borderRadius:'50%', background:COLOR_HEX[c]??'#888', border:'1px solid #555', display:'inline-block' }}/>
                  {c}
                </span>
              ))}
            </div>
            <div style={{ color:'#3a3070', fontSize:11, marginBottom:12 }}>Sizes: {p.sizes.join(' · ')}</div>
            <div style={{ display:'flex', gap:8 }}>
              <a href={p.amazon} target="_blank" rel="noreferrer"
                 style={{ background:'#ff9900', color:'#000', padding:'7px 16px', borderRadius:8, fontWeight:700, fontSize:12, textDecoration:'none' }}>
                🛒 Amazon
              </a>
              <a href={p.flipkart} target="_blank" rel="noreferrer"
                 style={{ background:'#2874f0', color:'#fff', padding:'7px 16px', borderRadius:8, fontWeight:700, fontSize:12, textDecoration:'none' }}>
                🛒 Flipkart
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}
