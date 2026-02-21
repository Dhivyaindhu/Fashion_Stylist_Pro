'use client'

interface Product {
  name:     string
  colors:   string[]
  sizes:    string[]
  amazon:   string
  flipkart: string
}

const COLOR_HEX: Record<string,string> = {
  "Pastel Pink":"#FFD1DC","Lavender":"#E6D0FF","Mint Green":"#AAFFDD",
  "Sky Blue":"#87CEEB","Blush Rose":"#FFB6C1","Butter Yellow":"#FFFACD",
  "Soft Peach":"#FFDAB9","Warm Coral":"#FF7F50","Dusty Mauve":"#C09090",
  "Champagne":"#F7E7CE","Terracotta":"#E07050","Royal Blue":"#4169E1",
  "Emerald":"#50C878","Mustard":"#FFDB58","Teal":"#008080",
  "Burnt Orange":"#CC5500","Cobalt":"#0047AB","Deep Burgundy":"#800020",
  "Fuchsia":"#FF00FF","Crimson":"#DC143C","Navy":"#001F5B",
  "Electric Teal":"#00CED1","Jade":"#00A86B","Pure White":"#FFFFFF",
  "Bright Gold":"#FFD700","Hot Pink":"#FF69B4","Lime":"#32CD32",
  "Peach":"#FFCBA4","Blush":"#DE5D83","Coral":"#FF6B6B",
}

const ALL_PRODUCTS: Record<string, Array<{name:string;body:string[];colors:string[];sizes:string[];amazon:string;flipkart:string}>> = {
  Women:[
    {name:"Floral Wrap Dress",body:["Hourglass","Full Hourglass","Rectangle"],colors:["Pastel Pink","Lavender","Blush Rose"],sizes:["XS","S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+floral+wrap+dress",flipkart:"https://www.flipkart.com/search?q=women+floral+wrap+dress"},
    {name:"A-Line Ethnic Kurta",body:["Pear","Rectangle","Petite","Apple"],colors:["Royal Blue","Mint Green","Butter Yellow"],sizes:["XS","S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+a-line+ethnic+kurta",flipkart:"https://www.flipkart.com/search?q=women+a+line+kurta"},
    {name:"Bodycon Party Dress",body:["Hourglass","Full Hourglass"],colors:["Cobalt","Crimson","Pure White"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+bodycon+party+dress",flipkart:"https://www.flipkart.com/search?q=women+bodycon+dress"},
    {name:"Peplum Ethnic Set",body:["Inverted Triangle","Rectangle","Apple"],colors:["Mustard","Burnt Orange","Teal"],sizes:["S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+peplum+ethnic+set",flipkart:"https://www.flipkart.com/search?q=women+peplum+set"},
    {name:"Empire Waist Maxi",body:["Apple","Pear","Petite"],colors:["Lavender","Soft Peach","Mint Green"],sizes:["XS","S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=women+empire+waist+maxi+dress",flipkart:"https://www.flipkart.com/search?q=women+empire+waist+maxi"},
    {name:"Anarkali Suit",body:["Apple","Pear","Full Hourglass","Rectangle"],colors:["Deep Burgundy","Cobalt","Jade"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+anarkali+suit",flipkart:"https://www.flipkart.com/search?q=women+anarkali"},
    {name:"Printed Saree",body:["Pear","Hourglass","Apple","Rectangle"],colors:["Royal Blue","Crimson","Mustard","Teal"],sizes:["Free Size"],amazon:"https://www.amazon.in/s?k=women+printed+saree",flipkart:"https://www.flipkart.com/search?q=women+printed+saree"},
    {name:"Plus Size Kurti",body:["Apple","Circle","Full Hourglass","Pear"],colors:["Pure White","Bright Gold","Fuchsia"],sizes:["XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=women+plus+size+kurti",flipkart:"https://www.flipkart.com/search?q=women+plus+size+kurti"},
    {name:"Fit & Flare Dress",body:["Hourglass","Pear","Rectangle"],colors:["Blush Rose","Sky Blue","Mint Green"],sizes:["XS","S","M","L","XL"],amazon:"https://www.amazon.in/s?k=women+fit+flare+dress",flipkart:"https://www.flipkart.com/search?q=women+fit+flare"},
  ],
  Men:[
    {name:"Slim Fit Formal Shirt",body:["Trapezoid","Column","Rectangle"],colors:["Royal Blue","Pure White","Cobalt"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=men+slim+fit+formal+shirt",flipkart:"https://www.flipkart.com/search?q=men+slim+formal+shirt"},
    {name:"Structured Blazer",body:["Triangle","Circle","Column","Rectangle"],colors:["Navy","Deep Burgundy","Teal"],sizes:["S","M","L","XL","XXL"],amazon:"https://www.amazon.in/s?k=men+structured+blazer",flipkart:"https://www.flipkart.com/search?q=men+blazer"},
    {name:"Polo T-Shirt",body:["Trapezoid","Column","Rectangle","Triangle"],colors:["Navy","Cobalt","Emerald","Crimson"],sizes:["S","M","L","XL","XXL","XXXL"],amazon:"https://www.amazon.in/s?k=men+polo+tshirt",flipkart:"https://www.flipkart.com/search?q=men+polo+tshirt"},
  ],
  Kids:[
    {name:"Cotton Frock",body:["Petite"],colors:["Pastel Pink","Mint Green","Butter Yellow"],sizes:["2-4Y","4-6Y","6-8Y","8-10Y"],amazon:"https://www.amazon.in/s?k=kids+girls+cotton+frock",flipkart:"https://www.flipkart.com/search?q=kids+frock+dress"},
    {name:"Party Dress",body:["Petite"],colors:["Fuchsia","Lavender","Bright Gold"],sizes:["2-4Y","4-6Y","6-8Y","8-10Y","10-12Y"],amazon:"https://www.amazon.in/s?k=kids+party+dress",flipkart:"https://www.flipkart.com/search?q=kids+party+dress"},
  ],
}

interface RecommendPanelProps {
  category:  string
  bodyType:  string
  skinTone:  string
  size:      string
  bestColors:string[]
}

export default function RecommendPanel({ category, bodyType, skinTone, size, bestColors }: RecommendPanelProps) {
  const all  = ALL_PRODUCTS[category] ?? []
  const best = new Set(bestColors)

  let matched = all.filter(p =>
    p.body.includes(bodyType) &&
    p.colors.some(c => best.has(c)) &&
    p.sizes.includes(size)
  )
  if (!matched.length) matched = all.filter(p => p.body.includes(bodyType))
  if (!matched.length) matched = all

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-yellow-300 font-bold text-sm">
        🛍 {matched.length} Recommendations — {bodyType} · {skinTone} · Size {size}
      </h3>

      {/* Colour palette */}
      <div className="glass rounded-xl p-3">
        <p className="text-xs text-gray-500 mb-2 font-semibold tracking-widest uppercase">
          ✨ Your best colours
        </p>
        <div className="flex flex-wrap gap-2">
          {bestColors.slice(0,8).map(c => (
            <div key={c} title={c}
                 className="flex items-center gap-1.5 bg-[#1e1848] border border-[#2e2868]
                            rounded-full px-2.5 py-1 text-xs text-purple-300">
              <span className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: COLOR_HEX[c] ?? '#888' }} />
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* Product cards */}
      <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-1">
        {matched.map((p, i) => {
          const mc = p.colors.filter(c => best.has(c)).length
                     ? p.colors.filter(c => best.has(c))
                     : p.colors.slice(0,2)
          return (
            <div key={i} className="glass rounded-xl p-4">
              <p className="font-bold text-yellow-200 mb-2">{p.name}</p>

              {/* Colour dots */}
              <div className="flex items-center gap-1.5 mb-2">
                {mc.map(c => (
                  <span key={c} title={c}
                        className="w-4 h-4 rounded-full border border-yellow-800/50"
                        style={{ background: COLOR_HEX[c] ?? '#888' }} />
                ))}
                <span className="text-xs text-gray-600 ml-1">{mc.join(' · ')}</span>
              </div>

              <p className="text-xs text-gray-600 mb-3">Sizes: {p.sizes.join(' · ')}</p>

              <div className="flex gap-2">
                <a href={p.amazon} target="_blank" rel="noreferrer"
                   className="flex-1 text-center py-1.5 rounded-lg text-xs font-bold"
                   style={{ background:'#ff9900', color:'#000' }}>
                  🛒 Amazon
                </a>
                <a href={p.flipkart} target="_blank" rel="noreferrer"
                   className="flex-1 text-center py-1.5 rounded-lg text-xs font-bold text-white"
                   style={{ background:'#2874f0' }}>
                  🛒 Flipkart
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
