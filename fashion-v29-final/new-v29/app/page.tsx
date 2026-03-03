'use client'
import { useState, useRef } from 'react'

// ─── COLOR DATA ───────────────────────────────────────────────
const COLOR_HEX: Record<string, string> = {
  "Ivory White": "#FFFFF0", "Blush Pink": "#FFB6C1", "Lavender": "#E6D0FF",
  "Mint Green": "#AAFFDD", "Sky Blue": "#87CEEB", "Butter Yellow": "#FFFACD",
  "Soft Peach": "#FFDAB9", "Warm Coral": "#FF7F50", "Dusty Rose": "#C09090",
  "Champagne": "#F7E7CE", "Terracotta": "#E07050", "Royal Blue": "#4169E1",
  "Emerald": "#50C878", "Mustard": "#FFDB58", "Teal": "#008080", "Sage Green": "#B2C8A2",
  "Burnt Orange": "#CC5500", "Cobalt": "#0047AB", "Deep Burgundy": "#800020",
  "Fuchsia": "#FF69B4", "Crimson": "#DC143C", "Navy": "#001F5B", "Jade": "#00A86B",
  "Pure White": "#FFFFFF", "Bright Gold": "#FFD700", "Coral Red": "#FF4040",
  "Slate Blue": "#6A8DB0", "Warm Brown": "#8B5E3C", "Olive": "#808000",
  "Rust": "#B7410E", "Camel": "#C19A6B", "Nude Beige": "#E8C9A0",
  "Plum": "#8E4585", "Marigold": "#FCA928", "Forest Green": "#228B22",
  "Charcoal": "#36454F", "Cream": "#FFFDD0", "Rose Gold": "#B76E79",
}

const BODY_TYPES: Record<string, { icon: string; desc: string; tips: string[] }> = {
  "Hourglass":        { icon: "⌛", desc: "Balanced bust & hips, defined waist", tips: ["Fitted silhouettes", "Wrap dresses", "Belted styles", "Bodycon fits"] },
  "Full Hourglass":   { icon: "⌛", desc: "Fuller curves with defined waist ratio", tips: ["A-line skirts", "Wrap blouses", "Structured jackets", "Midi dresses"] },
  "Pear (Triangle)":  { icon: "🍐", desc: "Hips wider than shoulders", tips: ["A-line dresses", "Off-shoulder tops", "Dark bottoms", "Flared skirts"] },
  "Inverted Triangle":{ icon: "🔻", desc: "Shoulders wider than hips", tips: ["Peplum tops", "Wide-leg pants", "Full skirts", "Belt at waist"] },
  "Rectangle":        { icon: "▭", desc: "Similar shoulder, waist & hip width", tips: ["Peplum tops", "Ruffled skirts", "Wrap dresses", "Statement belts"] },
  "Apple (Round)":    { icon: "🍎", desc: "Fuller midsection, slimmer legs", tips: ["Empire waist", "A-line dresses", "V-necks", "Flowy tunics"] },
  "Petite":           { icon: "🌸", desc: "Proportionally smaller frame (<160cm)", tips: ["Vertical stripes", "High waist styles", "Monochrome looks", "Cropped jackets"] },
  "Tall":             { icon: "📏", desc: "Proportionally taller frame (>175cm)", tips: ["Maxi dresses", "Bold prints", "Wide-leg trousers", "Layered looks"] },
  "Athletic":         { icon: "💪", desc: "Muscular build, narrow waist", tips: ["Soft fabrics", "Ruffle details", "Flowy skirts", "Off-shoulder styles"] },
  "Lean Column":      { icon: "🏛", desc: "Slim and straight, minimal curves", tips: ["Layering", "Textured fabrics", "Ruffles & frills", "Belt accessories"] },
  "Oval":             { icon: "⭕", desc: "Midsection carries most weight", tips: ["Empire waist", "Structured blazers", "Straight-leg pants", "V-necklines"] },
  "Diamond":          { icon: "◆", desc: "Wider hips & shoulders, narrower waist", tips: ["A-line silhouettes", "Dark solid colors", "Structured tops", "Bootcut jeans"] },
  "Trapezoid":        { icon: "⬡", desc: "Shoulders wider than hips, minimal waist curve", tips: ["Slim trousers", "Tailored coats", "V-necks", "Darker bottoms"] },
  "Spoon":            { icon: "🥄", desc: "Hip shelf with defined waist", tips: ["High-rise bottoms", "Fit-and-flare", "Peplum blouses", "Wrap styles"] },
  "Lollipop":         { icon: "🍭", desc: "Full bust on slim frame", tips: ["V-necks", "Dark tops", "Wide-leg pants", "Wrap blouses"] },
  "Skittle":          { icon: "🎳", desc: "Narrow shoulders, full hips & thighs", tips: ["Boat necklines", "Structured shoulders", "Dark bottoms", "A-line skirts"] },
}

const SKIN_RECS: Record<string, { best: string[]; avoid: string[]; hex: string; label: string }> = {
  "Fair":   { hex: "#F8D5C0", label: "Fair",   best: ["Blush Pink","Lavender","Mint Green","Sky Blue","Butter Yellow","Ivory White","Champagne","Soft Peach","Sage Green","Rose Gold"], avoid: ["Pure White","Warm Brown","Camel","Nude Beige","Olive"] },
  "Light":  { hex: "#E8B89A", label: "Light",  best: ["Warm Coral","Terracotta","Dusty Rose","Royal Blue","Cobalt","Teal","Sage Green","Cream","Marigold","Blush Pink"],              avoid: ["Pure White","Pale Yellow","Light Beige"] },
  "Medium": { hex: "#C88642", label: "Medium", best: ["Emerald","Royal Blue","Mustard","Burnt Orange","Cobalt","Jade","Forest Green","Rust","Camel","Deep Burgundy"],                  avoid: ["Nude Beige","Dusty Rose","Light Lavender"] },
  "Tan":    { hex: "#A0522D", label: "Tan",    best: ["Cobalt","Crimson","Fuchsia","Bright Gold","Teal","Emerald","Rust","Coral Red","Marigold","Plum"],                              avoid: ["Dusty Rose","Nude Beige","Light Beige","Pale Cream"] },
  "Deep":   { hex: "#4A2912", label: "Deep",   best: ["Bright Gold","Crimson","Fuchsia","Cobalt","Royal Blue","Deep Burgundy","Plum","Forest Green","Coral Red","Charcoal"],          avoid: ["Olive","Warm Brown","Dark Navy","Black Brown"] },
  "Olive":  { hex: "#8B7355", label: "Olive",  best: ["Terracotta","Burnt Orange","Coral Red","Mustard","Forest Green","Teal","Rust","Jade","Warm Brown","Camel"],                    avoid: ["Mint Green","Soft Peach","Pale Pink"] },
}

const PRODUCTS: Record<string, any[]> = {
  Women: [
    { name: "Floral Wrap Dress",     bodies: ["Hourglass","Full Hourglass","Rectangle","Lean Column"],            tones: ["Fair","Light"],          colors: ["Blush Pink","Lavender","Mint Green"],    amazon: "https://www.amazon.in/s?k=women+floral+wrap+dress",     flipkart: "https://www.flipkart.com/search?q=women+floral+wrap+dress",    myntra: "https://www.myntra.com/dresses?rawQuery=floral+wrap+dress" },
    { name: "A-Line Ethnic Kurta",   bodies: ["Pear (Triangle)","Apple (Round)","Petite","Oval"],                 tones: ["Medium","Tan","Olive"],  colors: ["Royal Blue","Mint Green","Mustard"],    amazon: "https://www.amazon.in/s?k=women+a-line+ethnic+kurta",  flipkart: "https://www.flipkart.com/search?q=women+a-line+kurta",          myntra: "https://www.myntra.com/kurtas?rawQuery=a-line+kurta" },
    { name: "Bodycon Party Dress",   bodies: ["Hourglass","Full Hourglass","Athletic"],                           tones: ["Tan","Deep"],            colors: ["Cobalt","Crimson","Fuchsia"],           amazon: "https://www.amazon.in/s?k=women+bodycon+party+dress",  flipkart: "https://www.flipkart.com/search?q=women+bodycon+dress",         myntra: "https://www.myntra.com/dresses?rawQuery=bodycon+dress" },
    { name: "Anarkali Suit",         bodies: ["Apple (Round)","Pear (Triangle)","Full Hourglass","Diamond"],      tones: ["Deep","Medium","Olive"], colors: ["Deep Burgundy","Cobalt","Jade"],        amazon: "https://www.amazon.in/s?k=women+anarkali+suit",        flipkart: "https://www.flipkart.com/search?q=women+anarkali",             myntra: "https://www.myntra.com/salwar-kameez?rawQuery=anarkali" },
    { name: "Fit & Flare Midi Dress",bodies: ["Hourglass","Pear (Triangle)","Rectangle","Spoon"],                 tones: ["Fair","Light","Medium"], colors: ["Blush Pink","Sky Blue","Mint Green"],   amazon: "https://www.amazon.in/s?k=women+fit+flare+midi+dress", flipkart: "https://www.flipkart.com/search?q=women+fit+flare+dress",       myntra: "https://www.myntra.com/dresses?rawQuery=fit+and+flare" },
    { name: "Printed Saree",         bodies: ["Pear (Triangle)","Hourglass","Apple (Round)","Full Hourglass","Spoon"], tones: ["all"], colors: ["Royal Blue","Crimson","Mustard","Teal"], amazon: "https://www.amazon.in/s?k=women+printed+saree", flipkart: "https://www.flipkart.com/search?q=printed+saree", myntra: "https://www.myntra.com/sarees?rawQuery=printed+saree" },
    { name: "Empire Waist Maxi",     bodies: ["Apple (Round)","Oval","Petite","Lollipop"],                        tones: ["Fair","Light"],          colors: ["Lavender","Soft Peach","Mint Green"],   amazon: "https://www.amazon.in/s?k=women+empire+waist+maxi",   flipkart: "https://www.flipkart.com/search?q=women+empire+waist+maxi",    myntra: "https://www.myntra.com/dresses?rawQuery=empire+waist+maxi" },
    { name: "Peplum Top + Pants",    bodies: ["Inverted Triangle","Diamond","Trapezoid","Rectangle"],             tones: ["Medium","Tan"],          colors: ["Cobalt","Emerald","Terracotta"],        amazon: "https://www.amazon.in/s?k=women+peplum+top",          flipkart: "https://www.flipkart.com/search?q=women+peplum+top",           myntra: "https://www.myntra.com/tops?rawQuery=peplum+top" },
    { name: "Salwar Kameez",         bodies: ["Rectangle","Pear (Triangle)","Apple (Round)","Hourglass"],         tones: ["all"],                  colors: ["Terracotta","Mustard","Cobalt"],        amazon: "https://www.amazon.in/s?k=women+salwar+kameez",       flipkart: "https://www.flipkart.com/search?q=salwar+kameez",              myntra: "https://www.myntra.com/salwar-kameez?rawQuery=salwar+kameez" },
    { name: "Palazzo + Crop Top",    bodies: ["Tall","Athletic","Lean Column","Inverted Triangle"],               tones: ["Tan","Deep","Olive"],    colors: ["Bright Gold","Fuchsia","Coral Red"],    amazon: "https://www.amazon.in/s?k=palazzo+pants+with+crop+top", flipkart: "https://www.flipkart.com/search?q=palazzo+crop+top", myntra: "https://www.myntra.com/palazzos?rawQuery=palazzo+crop+top" },
  ],
  Men: [
    { name: "Slim Fit Formal Shirt", bodies: ["Trapezoid","Lean Column","Rectangle","Athletic"],                  tones: ["Fair","Light"],          colors: ["Royal Blue","Pure White","Sky Blue"],   amazon: "https://www.amazon.in/s?k=men+slim+fit+formal+shirt", flipkart: "https://www.flipkart.com/search?q=men+slim+formal+shirt",      myntra: "https://www.myntra.com/shirts?rawQuery=slim+fit+formal" },
    { name: "Structured Blazer",     bodies: ["Triangle (Pear)","Oval","Lean Column","Rectangle"],               tones: ["all"],                  colors: ["Navy","Deep Burgundy","Charcoal"],      amazon: "https://www.amazon.in/s?k=men+structured+blazer",    flipkart: "https://www.flipkart.com/search?q=men+blazer",                 myntra: "https://www.myntra.com/blazers?rawQuery=men+blazer" },
    { name: "Polo T-Shirt",          bodies: ["Trapezoid","Athletic","Rectangle","Lean Column"],                  tones: ["Medium","Tan","Olive"],  colors: ["Navy","Cobalt","Emerald","Crimson"],    amazon: "https://www.amazon.in/s?k=men+polo+tshirt",          flipkart: "https://www.flipkart.com/search?q=men+polo+tshirt",            myntra: "https://www.myntra.com/polos?rawQuery=men+polo" },
    { name: "Kurta Pyjama Set",      bodies: ["Rectangle","Lean Column","Oval","Athletic"],                       tones: ["all"],                  colors: ["Pure White","Cobalt","Deep Burgundy"],  amazon: "https://www.amazon.in/s?k=men+kurta+pyjama+set",     flipkart: "https://www.flipkart.com/search?q=men+kurta+pyjama",           myntra: "https://www.myntra.com/kurtas?rawQuery=men+kurta+pyjama" },
    { name: "Chino Trousers",        bodies: ["Trapezoid","Athletic","Inverted Triangle","Lean Column"],          tones: ["Medium","Tan","Deep"],   colors: ["Camel","Olive","Navy"],                 amazon: "https://www.amazon.in/s?k=men+chino+trousers",       flipkart: "https://www.flipkart.com/search?q=men+chinos",                 myntra: "https://www.myntra.com/trousers?rawQuery=men+chino" },
  ],
  Kids: [
    { name: "Cotton Frock",  bodies: ["Petite"], tones: ["all"], colors: ["Blush Pink","Mint Green","Butter Yellow"], amazon: "https://www.amazon.in/s?k=kids+cotton+frock",  flipkart: "https://www.flipkart.com/search?q=kids+frock",       myntra: "https://www.myntra.com/kids-dresses?rawQuery=cotton+frock" },
    { name: "Dungaree Set",  bodies: ["Petite"], tones: ["all"], colors: ["Sky Blue","Lavender","Mint Green"],        amazon: "https://www.amazon.in/s?k=kids+dungaree",      flipkart: "https://www.flipkart.com/search?q=kids+dungaree",    myntra: "https://www.myntra.com/kids-dungarees?rawQuery=kids+dungaree" },
    { name: "Ethnic Wear",   bodies: ["Petite"], tones: ["all"], colors: ["Fuchsia","Marigold","Cobalt"],             amazon: "https://www.amazon.in/s?k=kids+ethnic+wear",   flipkart: "https://www.flipkart.com/search?q=kids+ethnic+wear", myntra: "https://www.myntra.com/kids-ethnic-wear?rawQuery=kids+ethnic" },
  ],
}

const STEPS = ["Upload Photo", "Measurements", "Body Type", "Skin & Colors", "Dress Picks", "Virtual Try-On"]

// ─── CANVAS RECOLOR: applies target color over garment image ──
async function recolorGarment(objectUrl: string, hexColor: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const r = parseInt(hexColor.slice(1, 3), 16)
      const g = parseInt(hexColor.slice(3, 5), 16)
      const b = parseInt(hexColor.slice(5, 7), 16)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const d = imageData.data

      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 10) continue
        const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255
        const blend = Math.min(1, lum * 2)
        const hi = Math.max(0, (lum - 0.5) * 2)
        d[i]     = Math.round(r * blend * (1 - hi) + 255 * hi)
        d[i + 1] = Math.round(g * blend * (1 - hi) + 255 * hi)
        d[i + 2] = Math.round(b * blend * (1 - hi) + 255 * hi)
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.93))
    }
    img.src = objectUrl
  })
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function FashionStylist() {
  const [step, setStep]               = useState(0)
  const [category, setCategory]       = useState('Women')
  const [userHeight, setUserHeight]   = useState('')
  const [photo, setPhoto]             = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)
  const [loadingMsg, setLoadingMsg]   = useState('')
  const [error, setError]             = useState('')
  const [result, setResult]           = useState<any>(null)

  // Try-on state
  const [dressFile, setDressFile]           = useState<File | null>(null)
  const [dressObjUrl, setDressObjUrl]       = useState<string | null>(null)   // original dress URL
  const [tryOnCategory, setTryOnCategory]   = useState<'upper_body'|'lower_body'|'dresses'>('dresses')
  const [selectedColor, setSelectedColor]   = useState<string | null>(null)
  const [coloredDataUri, setColoredDataUri] = useState<string | null>(null)   // recolored dress data URI
  const [coloringLoading, setColoringLoading] = useState(false)
  const [tryOnLoading, setTryOnLoading]     = useState(false)
  const [tryOnLoadingMsg, setTryOnLoadingMsg] = useState('')
  const [tryOnImage, setTryOnImage]         = useState<string | null>(null)
  const [colorResults, setColorResults]     = useState<{ name: string; hex: string; image: string }[]>([])

  const photoRef = useRef<HTMLInputElement>(null)
  const dressRef = useRef<HTMLInputElement>(null)

  // ── Open file picker (always fresh) ─────────────────────────
  const openPhotoPicker = () => {
    if (photoRef.current) photoRef.current.value = ''
    photoRef.current?.click()
  }

  // ── New photo selected → reset everything ────────────────────
  const handleNewPhoto = (f: File) => {
    const url = URL.createObjectURL(f)
    setPhoto(f)
    setPhotoPreview(url)
    // Clear previous results
    setResult(null); setError('')
    setDressFile(null); setDressObjUrl(null)
    setSelectedColor(null); setColoredDataUri(null)
    setTryOnImage(null); setColorResults([])
    analyze(f)
  }

  // ── Analyze photo via /api/analyze ──────────────────────────
  const analyze = async (file: File) => {
    setLoading(true); setError('')
    setLoadingMsg('Detecting body keypoints...')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('category', category)
      if (userHeight) form.append('user_height', userHeight)
      setLoadingMsg('Extracting measurements...')
      const data = await fetch('/api/analyze', { method: 'POST', body: form }).then(r => r.json())
      if (data.error) { setError(data.error); setLoading(false); return }
      setResult(data)
      setStep(1)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  // ── Select color → canvas-recolor dress preview ──────────────
  const handleColorSelect = async (colorName: string) => {
    if (!dressObjUrl) return
    setSelectedColor(colorName)
    setColoringLoading(true)
    setColoredDataUri(null)
    try {
      const hex = COLOR_HEX[colorName] || '#888888'
      const recolored = await recolorGarment(dressObjUrl, hex)
      setColoredDataUri(recolored)
    } catch { setColoredDataUri(null) }
    setColoringLoading(false)
  }

  // ── IDM-VTON try-on (NO Claude API) ─────────────────────────
  const doTryOn = async () => {
    if (!photo || !dressFile) return
    setTryOnLoading(true); setTryOnImage(null); setError('')

    try {
      const fileToDataUri = (f: File): Promise<string> =>
        new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f) })

      const personDataUri = await fileToDataUri(photo)
      // Use recolored dress if available, else original
      const garmentDataUri = (selectedColor && coloredDataUri) ? coloredDataUri : await fileToDataUri(dressFile)

      setTryOnLoadingMsg('Sending to IDM-VTON...')
      const resp = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          human_img: personDataUri,
          garm_img: garmentDataUri,
          garment_des: selectedColor ? `${selectedColor} outfit` : 'outfit',
          category: tryOnCategory,
        })
      })
      const data = await resp.json()

      if (data.error) {
        // Canvas fallback
        setTryOnLoadingMsg('Using canvas fallback...')
        const fallback = await canvasFallback(photo, garmentDataUri)
        setTryOnImage(fallback)
        setError('⚠️ Photo-realistic try-on needs REPLICATE_API_TOKEN in .env.local. Canvas overlay shown instead.')
      } else {
        setTryOnImage(data.output_url)
        if (selectedColor) {
          setColorResults(prev => {
            const filtered = prev.filter(x => x.name !== selectedColor)
            return [{ name: selectedColor, hex: COLOR_HEX[selectedColor] || '#888', image: data.output_url }, ...filtered]
          })
        }
      }
    } catch (e: any) {
      setError('Try-on failed: ' + e.message)
    }
    setTryOnLoading(false); setTryOnLoadingMsg('')
  }

  // ── Canvas fallback ──────────────────────────────────────────
  const canvasFallback = (personFile: File, garmentSrc: string): Promise<string> =>
    new Promise(resolve => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const pImg = new Image(); const gImg = new Image(); let n = 0
      const draw = () => {
        canvas.width = pImg.width; canvas.height = pImg.height
        ctx.drawImage(pImg, 0, 0)
        const tx = pImg.width * 0.16, ty = pImg.height * 0.13
        const tw = pImg.width * 0.68, th = pImg.height * 0.66
        ctx.globalAlpha = 0.85; ctx.drawImage(gImg, tx, ty, tw, th); ctx.globalAlpha = 1
        resolve(canvas.toDataURL('image/jpeg', 0.92))
      }
      pImg.onload = gImg.onload = () => { if (++n === 2) draw() }
      pImg.src = URL.createObjectURL(personFile); gImg.src = garmentSrc
    })

  // ── Helpers ──────────────────────────────────────────────────
  const skinRec  = result ? (SKIN_RECS[result.skin_tone] || SKIN_RECS['Medium']) : null
  const bodyInfo = result ? (BODY_TYPES[result.body_type] || BODY_TYPES['Rectangle']) : null

  const getRecommendedProducts = () => {
    if (!result) return []
    const all  = PRODUCTS[category] || PRODUCTS.Women
    const best = new Set(skinRec?.best || [])
    let matched = all.filter((p: any) =>
      (p.bodies.includes(result.body_type) || p.bodies.includes('all')) &&
      (p.tones.includes(result.skin_tone)  || p.tones.includes('all')) &&
      p.colors.some((c: string) => best.has(c))
    )
    if (!matched.length) matched = all.filter((p: any) => p.bodies.includes(result.body_type) || p.bodies.includes('all'))
    if (!matched.length) matched = all
    return matched.slice(0, 6)
  }

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  // ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A14', color: '#EAE4FF', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* HEADER */}
      <header style={{ background: 'linear-gradient(135deg,#1a0636,#0d0422)', borderBottom: '1px solid #2a1850', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(90deg,#e8c99a,#c97ef0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦ StyleSense AI</h1>
          <p style={{ margin: '2px 0 0', color: '#7060a0', fontSize: '0.72rem', letterSpacing: '0.08em' }}>AI BODY ANALYSIS · SKIN TONE · IDM-VTON COLOR TRY-ON · SMART SHOPPING</p>
        </div>
        {result && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#14103a', border: '1px solid #2e2068', borderRadius: 12, padding: '7px 14px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: skinRec?.hex, border: '1px solid #888', display: 'inline-block' }} />
            <span style={{ fontWeight: 800, color: '#e8c99a', fontSize: 13 }}>Size {result.size}</span>
            <span style={{ color: '#8060c0', fontSize: 12 }}>{bodyInfo?.icon} {result.body_type}</span>
            <span style={{ color: '#6050a0', fontSize: 11 }}>{skinRec?.label} skin</span>
            <button onClick={openPhotoPicker} style={{ marginLeft: 4, padding: '4px 10px', borderRadius: 8, border: '1px solid #4a2090', background: '#2a1060', color: '#c0a0ff', fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>
              📷 Change Photo
            </button>
          </div>
        )}
      </header>

      {/* PROGRESS */}
      <div style={{ background: '#0d0a24', borderBottom: '1px solid #1e1848', padding: '12px 24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 0, minWidth: 'max-content', margin: '0 auto', maxWidth: 900, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => result && i > 0 && setStep(i)} disabled={i > 0 && !result}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', background: 'transparent',
                cursor: i === 0 || result ? 'pointer' : 'default',
                color: i === step ? '#e8c99a' : i < step ? '#8060c0' : '#3a3060',
                fontWeight: i === step ? 800 : 500, fontSize: 12,
                borderBottom: i === step ? '2px solid #e8c99a' : '2px solid transparent', whiteSpace: 'nowrap' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800,
                background: i < step ? '#4a2090' : i === step ? '#e8c99a' : '#1e1848',
                color: i === step ? '#0a0a1a' : i < step ? '#c0a0ff' : '#4a4070', flexShrink: 0 }}>{i < step ? '✓' : i + 1}</span>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* ═══ STEP 0: UPLOAD ═══ */}
        {step === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            <div style={{ background: '#12103a', border: '1px solid #2a2060', borderRadius: 18, padding: 24 }}>
              <h2 style={{ margin: '0 0 6px', color: '#e8c99a', fontSize: 16, fontWeight: 800 }}>📸 Upload Full-Body Photo</h2>
              <p style={{ margin: '0 0 16px', color: '#5050a0', fontSize: 12 }}>Stand straight, face camera, full body visible</p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['Women','Men','Kids'].map(c => (
                  <button key={c} onClick={() => setCategory(c)} style={{ flex: 1, padding: '9px 0', border: `1.5px solid ${category===c?'#8060e0':'#1e1848'}`, borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 12, background: category===c?'#2a1f60':'#0d0d2a', color: category===c?'#e8c99a':'#5040a0' }}>{c}</button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, background: '#0d0d2a', borderRadius: 10, padding: '8px 12px', border: '1px solid #1e1848' }}>
                <span>📏</span>
                <span style={{ color: '#7060a0', fontSize: 12 }}>Height</span>
                <input type="number" value={userHeight} onChange={e => setUserHeight(e.target.value)} placeholder="e.g. 162" min="80" max="220"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e8e0ff', fontSize: 14, fontWeight: 700, width: 60 }} />
                <span style={{ color: '#4040a0', fontSize: 12 }}>cm (optional)</span>
              </div>

              {/* Click to pick / replace photo */}
              <div onClick={openPhotoPicker}
                style={{ border: '2px dashed #2a2860', borderRadius: 14, padding: 24, cursor: 'pointer', background: '#0d0d2a', textAlign: 'center', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6040c0')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2860')}>
                {photoPreview
                  ? <>
                      <img src={photoPreview} alt="preview" style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 10, objectFit: 'contain' }} />
                      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(40,16,96,0.92)', color: '#c0a0ff', fontSize: 11, fontWeight: 800, padding: '5px 16px', borderRadius: 20, border: '1px solid #6040c0', whiteSpace: 'nowrap' }}>
                        📷 Click to change photo — old photo removed
                      </div>
                    </>
                  : <>
                      <div style={{ fontSize: 48 }}>📷</div>
                      <div style={{ color: '#5050a0', fontSize: 14 }}>Click or tap to upload photo</div>
                      <div style={{ color: '#2a2a60', fontSize: 11 }}>JPG · PNG · WEBP</div>
                    </>
                }
              </div>

              {loading && (
                <div style={{ marginTop: 14, background: '#1a1848', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ color: '#8060e0', fontSize: 13, marginBottom: 6 }}>⏳ {loadingMsg}</div>
                  <div style={{ height: 4, background: '#0d0a24', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#6040c0,#c080ff)', borderRadius: 4, animation: 'pulse 1.2s ease-in-out infinite', width: '60%' }} />
                  </div>
                </div>
              )}
              {error && <div style={{ marginTop: 12, padding: '10px 14px', background: '#2a0a0a', border: '1px solid #880000', borderRadius: 8, color: '#ff8080', fontSize: 12 }}>❌ {error}</div>}
            </div>

            <div style={{ background: '#12103a', border: '1px solid #1e1848', borderRadius: 18, padding: 24 }}>
              <h2 style={{ margin: '0 0 16px', color: '#e8c99a', fontSize: 15, fontWeight: 800 }}>✨ What StyleSense Does</h2>
              {[['📐','Body Measurements','Shoulder, bust, waist, high hip, low hip, arm length via AI pose detection'],
                ['📏','Size Classification','Precise size XS–XXXL using Indian standard measurement charts'],
                ['👤','Body Type Analysis','Identifies from 16 body shapes for perfect styling guidance'],
                ['🎨','Skin Tone Detection','Fair/Light/Medium/Tan/Deep/Olive + full color palette'],
                ['✅','Color Recommendations','Colors that enhance your skin tone + what to avoid'],
                ['👗','Dress Recommendations','Outfits matched to body type, size & skin tone'],
                ['🎨','Color Variation Try-On','Same dress, different recommended colors — IDM-VTON photorealistic'],
                ['🛒','Smart Shopping Links','Amazon, Flipkart & Myntra with your exact size'],
              ].map(([icon, title, desc]) => (
                <div key={title as string} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <div>
                    <div style={{ color: '#c0a8e0', fontWeight: 700, fontSize: 12, marginBottom: 2 }}>{title}</div>
                    <div style={{ color: '#50507a', fontSize: 11, lineHeight: 1.4 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 1: MEASUREMENTS ═══ */}
        {step === 1 && result && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            <div>
              <SectionHeader icon="📐" title="Body Measurements" subtitle={`Estimated from your photo · ${category}`} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Shoulder',result.shoulder_cm,'↔'],['Bust / Chest',result.bust_cm,'⬤'],['Waist',result.waist_cm,'◯'],['High Hip',result.high_hip_cm,'◐'],
                  ['Low Hip',result.hip_cm,'⬤'],['Height',result.height_cm,'↕'],['Hollow→Hem',result.hollow_to_hem_cm,'↓'],['Arm Length',result.arm_length_cm??Math.round((result.shoulder_cm||40)*1.6),'💪'],
                ].map(([k,v,ic]) => <MeasurementCard key={k as string} icon={ic as string} label={k as string} value={v} />)}
              </div>
            </div>
            <div>
              <SectionHeader icon="👕" title="Size Classification" subtitle="Indian standard size chart" />
              <SizeCard result={result} category={category} />
              {photoPreview && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ color: '#5050a0', fontSize: 11, marginBottom: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    YOUR PHOTO
                    <button onClick={openPhotoPicker} style={{ background: '#1a0a30', color: '#8060c0', border: '1px solid #3a2060', borderRadius: 6, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>📷 Change</button>
                  </div>
                  <img src={photoPreview} alt="You" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 12, border: '1px solid #2a2060' }} />
                </div>
              )}
            </div>
            <NavButtons onPrev={prevStep} onNext={nextStep} />
          </div>
        )}

        {/* ═══ STEP 2: BODY TYPE ═══ */}
        {step === 2 && result && (
          <div>
            <SectionHeader icon="👤" title="Your Body Type" subtitle="Identified from 16 distinct body shapes" />
            <div style={{ background: 'linear-gradient(135deg,#1e1060,#120840)', border: '2px solid #4a2090', borderRadius: 18, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 72, lineHeight: 1 }}>{bodyInfo?.icon}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#e8c99a', marginBottom: 4 }}>{result.body_type}</div>
                  <div style={{ color: '#9070c0', fontSize: 13, marginBottom: 10 }}>{bodyInfo?.desc}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {bodyInfo?.tips.map((t: string) => <span key={t} style={{ background: '#2a1f60', color: '#c0a0ff', border: '1px solid #3a2880', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>✓ {t}</span>)}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
              {Object.entries(BODY_TYPES).map(([name, info]) => (
                <div key={name} style={{ background: name===result.body_type?'linear-gradient(135deg,#2a1860,#1a0d48)':'#12103a', border: `1.5px solid ${name===result.body_type?'#6040c0':'#1e1848'}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 22 }}>{info.icon}</span>
                    <span style={{ color: name===result.body_type?'#e8c99a':'#9080c0', fontWeight: 700, fontSize: 12 }}>{name} {name===result.body_type&&'← You'}</span>
                  </div>
                  <div style={{ color: '#50507a', fontSize: 11 }}>{info.desc}</div>
                </div>
              ))}
            </div>
            <NavButtons onPrev={prevStep} onNext={nextStep} />
          </div>
        )}

        {/* ═══ STEP 3: SKIN & COLORS ═══ */}
        {step === 3 && result && skinRec && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
            <div>
              <SectionHeader icon="🎨" title="Skin Tone Analysis" subtitle="Your personal color palette" />
              <div style={{ background: 'linear-gradient(135deg,#1e1060,#120840)', border: '2px solid #4a2090', borderRadius: 18, padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 70, height: 70, borderRadius: '50%', background: skinRec.hex, border: '3px solid #2a1860', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#e8c99a' }}>{skinRec.label} Skin Tone</div>
                  <div style={{ color: '#9070c0', fontSize: 12, marginTop: 4 }}>{skinRec.best.length} recommended · {skinRec.avoid.length} to avoid</div>
                </div>
              </div>
              <div style={{ background: '#12103a', border: '1px solid #1e1848', borderRadius: 14, padding: 16, marginBottom: 14 }}>
                <div style={{ color: '#22c55e', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>✅ Colors That Enhance You</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{skinRec.best.map((c: string) => <ColorChip key={c} name={c} hex={COLOR_HEX[c]} good />)}</div>
              </div>
              <div style={{ background: '#12103a', border: '1px solid #1e1848', borderRadius: 14, padding: 16 }}>
                <div style={{ color: '#ef4444', fontWeight: 800, fontSize: 13, marginBottom: 10 }}>⚠️ Colors to Avoid</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{skinRec.avoid.map((c: string) => <ColorChip key={c} name={c} hex={COLOR_HEX[c]||'#888'} />)}</div>
              </div>
            </div>
            <div>
              <SectionHeader icon="💡" title="Style Tips" subtitle={`For ${result.body_type} body type`} />
              <div style={{ background: '#12103a', border: '1px solid #1e1848', borderRadius: 14, padding: 16, marginBottom: 14 }}>
                <div style={{ color: '#e8c99a', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Clothing Styles to Embrace</div>
                {bodyInfo?.tips.map((t: string) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '7px 10px', background: '#0d0d22', borderRadius: 8 }}>
                    <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>
                    <span style={{ color: '#c0a8e0', fontSize: 13 }}>{t}</span>
                  </div>
                ))}
              </div>
              {result.style_tips && (
                <div style={{ background: '#12103a', border: '1px solid #1e1848', borderRadius: 14, padding: 16 }}>
                  <div style={{ color: '#e8c99a', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>AI-Personalized Tips</div>
                  {(result.style_tips as string[]).map((t: string) => <div key={t} style={{ color: '#9080b0', fontSize: 12, marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid #3a2070' }}>• {t}</div>)}
                </div>
              )}
            </div>
            <NavButtons onPrev={prevStep} onNext={nextStep} />
          </div>
        )}

        {/* ═══ STEP 4: DRESS PICKS ═══ */}
        {step === 4 && result && (
          <div>
            <SectionHeader icon="👗" title="Dress Recommendations" subtitle={`Curated for ${result.body_type} · ${skinRec?.label} skin · Size ${result.size}`} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {getRecommendedProducts().map((p: any) => <ProductCard key={p.name} product={p} bestColors={new Set(skinRec?.best||[])} size={result.size} />)}
            </div>
            <NavButtons onPrev={prevStep} onNext={nextStep} nextLabel="Try On Outfits →" />
          </div>
        )}

        {/* ═══ STEP 5: VIRTUAL TRY-ON ═══ */}
        {step === 5 && result && (
          <div>
            <SectionHeader icon="🪄" title="Virtual Try-On — Color Variations" subtitle="Upload your outfit · pick a skin-tone recommended color · IDM-VTON generates your look" />

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'linear-gradient(90deg,#1a0a3a,#0d0520)', border: '1px solid #4a2090', borderRadius: 12, padding: '10px 14px', marginBottom: 20, fontSize: 11, lineHeight: 1.6 }}>
              <span style={{ fontSize: 20, marginTop: 1 }}>✨</span>
              <div>
                <span style={{ color: '#c0a0ff', fontWeight: 800 }}>How it works: </span>
                <span style={{ color: '#7050a0' }}>Upload your dress → pick a recommended color → canvas recolors the dress → </span>
                <span style={{ color: '#8060c0' }}>IDM-VTON generates a photo-realistic try-on with the same dress in the new color.</span>
                <span style={{ color: '#5040a0' }}> Try multiple colors to compare!</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(310px,1fr))', gap: 20 }}>

              {/* ── LEFT: Controls ── */}
              <div>
                {/* 1. Your photo */}
                <div style={{ background: '#12103a', border: '1px solid #2a2060', borderRadius: 16, padding: 16, marginBottom: 14 }}>
                  <div style={{ color: '#e8c99a', fontWeight: 800, marginBottom: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StepBadge n={1} />
                    Your Photo {photoPreview && <span style={{ marginLeft: 'auto', color: '#22c55e', fontSize: 11 }}>✓ Ready</span>}
                    {photoPreview && <button onClick={openPhotoPicker} style={{ padding: '2px 8px', background: '#1a0a30', color: '#8060c0', border: '1px solid #3a2060', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontWeight: 700 }}>📷 Change</button>}
                  </div>
                  {photoPreview
                    ? <img src={photoPreview} alt="You" style={{ width: '100%', maxHeight: 170, objectFit: 'contain', borderRadius: 10, border: '1px solid #2a2060' }} />
                    : <div style={{ color: '#5050a0', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>← Upload photo from Step 1</div>
                  }
                </div>

                {/* 2. Garment type */}
                <div style={{ background: '#12103a', border: '1px solid #2a2060', borderRadius: 16, padding: 16, marginBottom: 14 }}>
                  <div style={{ color: '#e8c99a', fontWeight: 800, marginBottom: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StepBadge n={2} /> Garment Type
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([['upper_body','👕 Top'],['lower_body','👖 Bottom'],['dresses','👗 Dress/Full']] as const).map(([val,lbl]) => (
                      <button key={val} onClick={() => setTryOnCategory(val)}
                        style={{ flex: 1, padding: '8px 4px', border: `1.5px solid ${tryOnCategory===val?'#8060e0':'#1e1848'}`, borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 11, background: tryOnCategory===val?'#2a1f60':'#0d0d2a', color: tryOnCategory===val?'#e8c99a':'#5040a0' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Upload outfit */}
                <div style={{ background: '#12103a', border: '1px solid #2a2060', borderRadius: 16, padding: 16, marginBottom: 14 }}>
                  <div style={{ color: '#e8c99a', fontWeight: 800, marginBottom: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StepBadge n={3} />
                    Upload Outfit {dressObjUrl && <span style={{ marginLeft: 'auto', color: '#22c55e', fontSize: 11 }}>✓ Ready</span>}
                  </div>
                  <div
                    onClick={() => { if (dressRef.current) dressRef.current.value = ''; dressRef.current?.click() }}
                    style={{ border: '2px dashed #2a2860', borderRadius: 12, padding: 16, cursor: 'pointer', background: '#0d0d2a', textAlign: 'center', minHeight: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, position: 'relative' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#6040c0')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2860')}>
                    {(coloredDataUri && selectedColor)
                      ? <>
                          <img src={coloredDataUri} alt="recolored" style={{ maxHeight: 130, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                          <div style={{ position: 'absolute', bottom: 6, right: 6, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(13,13,34,0.9)', padding: '2px 8px', borderRadius: 10 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLOR_HEX[selectedColor]||'#888', display: 'inline-block' }} />
                            <span style={{ fontSize: 9, color: '#c0a0ff', fontWeight: 800 }}>{selectedColor}</span>
                          </div>
                        </>
                      : dressObjUrl
                        ? <img src={dressObjUrl} alt="outfit" style={{ maxHeight: 130, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                        : <><div style={{ fontSize: 30 }}>👗</div><div style={{ color: '#4040a0', fontSize: 12 }}>Click to upload outfit image</div><div style={{ color: '#2a2a60', fontSize: 10 }}>Best: plain/white background, full garment</div></>
                    }
                  </div>
                  <input ref={dressRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setDressFile(f)
                        const url = URL.createObjectURL(f)
                        setDressObjUrl(url)
                        setSelectedColor(null); setColoredDataUri(null); setTryOnImage(null)
                      }
                      e.target.value = ''
                    }} />
                  {dressFile && (
                    <button onClick={() => { setDressFile(null); setDressObjUrl(null); setSelectedColor(null); setColoredDataUri(null); setTryOnImage(null) }}
                      style={{ marginTop: 8, width: '100%', background: '#1a0a20', color: '#c060a0', border: '1px solid #401030', padding: '6px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>🗑️ Remove Outfit</button>
                  )}
                </div>

                {/* 4. Color picker */}
                {dressFile && skinRec && (
                  <div style={{ background: '#12103a', border: '1px solid #2a2060', borderRadius: 16, padding: 16, marginBottom: 14 }}>
                    <div style={{ color: '#e8c99a', fontWeight: 800, marginBottom: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StepBadge n={4} />
                      Pick a Color Variation
                      {coloringLoading && <span style={{ marginLeft: 'auto', color: '#8060c0', fontSize: 10, fontWeight: 600 }}>🎨 Applying color...</span>}
                    </div>
                    <div style={{ color: '#5050a0', fontSize: 11, marginBottom: 10 }}>
                      Recommended for <b style={{ color: '#9070c0' }}>{skinRec.label}</b> skin tone:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {skinRec.best.map((colorName: string) => {
                        const hex = COLOR_HEX[colorName] || '#888'
                        const isSel = selectedColor === colorName
                        return (
                          <button key={colorName} onClick={() => handleColorSelect(colorName)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: isSel?'#2a1f60':'#0d0d22', color: isSel?'#e8c99a':'#8070b0', border: `1.5px solid ${isSel?'#8060e0':'#1e1848'}`, borderRadius: 10, padding: '5px 10px', fontSize: 11, fontWeight: isSel?800:500, cursor: 'pointer', boxShadow: isSel?`0 0 10px ${hex}44`:'none' }}>
                            <span style={{ width: 12, height: 12, borderRadius: '50%', background: hex, border: '1.5px solid rgba(255,255,255,0.2)', display: 'inline-block', flexShrink: 0 }} />
                            {colorName}{isSel && ' ✓'}
                          </button>
                        )
                      })}
                    </div>
                    {selectedColor && !coloringLoading && (
                      <div style={{ marginTop: 10, padding: '7px 10px', background: '#0d0d22', border: `1px solid ${COLOR_HEX[selectedColor]||'#888'}44`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: COLOR_HEX[selectedColor]||'#888', display: 'inline-block' }} />
                        <span style={{ color: '#9080b0' }}>Dress recolored to <b style={{ color: '#e8c99a' }}>{selectedColor}</b> — ready to generate</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Generate */}
                <button onClick={doTryOn} disabled={!photo || !dressFile || tryOnLoading || coloringLoading}
                  style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none',
                    cursor: (!photo||!dressFile||tryOnLoading||coloringLoading)?'not-allowed':'pointer',
                    background: (!photo||!dressFile||tryOnLoading||coloringLoading)?'#1a1848':'linear-gradient(135deg,#5030b0,#8050d0)',
                    color: (!photo||!dressFile||tryOnLoading||coloringLoading)?'#4040a0':'#fff',
                    fontWeight: 900, fontSize: 15, boxShadow: (!photo||!dressFile||tryOnLoading||coloringLoading)?'none':'0 4px 20px rgba(128,80,210,0.4)' }}>
                  {tryOnLoading ? `⏳ ${tryOnLoadingMsg||'Processing...'}` : selectedColor ? `✨ Try On in ${selectedColor}` : '✨ Generate Try-On'}
                </button>

                <div style={{ marginTop: 10, padding: '10px 12px', background: '#0d0d22', border: '1px solid #1a1848', borderRadius: 10, fontSize: 11, color: '#4a4880', lineHeight: 1.6 }}>
                  <b style={{ color: '#6a6898' }}>Requires:</b> <code style={{ color: '#8060c0' }}>REPLICATE_API_TOKEN</code> in <code style={{ color: '#8060c0' }}>.env.local</code> for photo-realistic results (replicate.com · ~$0.05/gen).
                  Without it, a canvas overlay fallback is shown.
                </div>
              </div>

              {/* ── RIGHT: Result ── */}
              <div>
                {tryOnLoading && (
                  <div style={{ background: '#12103a', border: '1px solid #2a2060', borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 48, marginBottom: 14 }}>✨</div>
                    <div style={{ color: '#c0a0ff', fontSize: 15, fontWeight: 800, marginBottom: 6 }}>{tryOnLoadingMsg || 'Generating...'}</div>
                    <div style={{ color: '#5050a0', fontSize: 12, marginBottom: 20 }}>Warping {selectedColor||''} garment to your body shape</div>
                    {['Recoloring dress to ' + (selectedColor||'selected color'), 'Uploading to IDM-VTON model', 'AI garment warping in progress'].map((s, i) => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: '#0d0d22', borderRadius: 8, marginBottom: 6, textAlign: 'left' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6040c0', flexShrink: 0, animation: `pulse 1.2s ease-in-out ${i*0.3}s infinite` }} />
                        <span style={{ color: '#6060a0', fontSize: 11 }}>{s}</span>
                      </div>
                    ))}
                    <div style={{ height: 3, background: '#0d0a24', borderRadius: 4, overflow: 'hidden', marginTop: 16 }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg,#5030b0,#c080ff,#5030b0)', backgroundSize: '200% 100%', borderRadius: 4, animation: 'shimmer 1.5s linear infinite' }} />
                    </div>
                  </div>
                )}

                {tryOnImage && !tryOnLoading && (
                  <div style={{ background: '#12103a', border: '1px solid #2a2060', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e1848', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: '#e8c99a', fontWeight: 800, fontSize: 13 }}>
                        📸 Try-On Result
                        {selectedColor && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
                          — <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLOR_HEX[selectedColor]||'#888', display: 'inline-block', marginLeft: 4 }} /> {selectedColor}
                        </span>}
                      </span>
                      <span style={{ marginLeft: 'auto', background: '#1e1048', color: '#8060c0', fontSize: 10, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>IDM-VTON</span>
                      <a href={tryOnImage} download={`tryon-${selectedColor||'result'}.jpg`} target="_blank" rel="noreferrer"
                        style={{ background: '#2a1f60', color: '#c0a0ff', border: '1px solid #3a2880', fontSize: 10, padding: '3px 10px', borderRadius: 6, textDecoration: 'none', fontWeight: 700 }}>↓ Save</a>
                    </div>
                    <img src={tryOnImage} alt="Try-on" style={{ width: '100%', display: 'block', maxHeight: 520, objectFit: 'contain', background: '#0d0d2a' }} />
                  </div>
                )}

                {/* Color history grid */}
                {colorResults.length > 0 && (
                  <div style={{ background: '#12103a', border: '1px solid #1e1848', borderRadius: 16, padding: 16, marginBottom: 14 }}>
                    <div style={{ color: '#e8c99a', fontWeight: 800, fontSize: 13, marginBottom: 12 }}>🎨 Color Try-On History</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 8 }}>
                      {colorResults.map(cr => (
                        <div key={cr.name} onClick={() => setTryOnImage(cr.image)}
                          style={{ borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${cr.hex}55`, cursor: 'pointer', transition: 'transform 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                          <img src={cr.image} alt={cr.name} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                          <div style={{ padding: '4px 6px', background: '#0d0d22', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cr.hex, display: 'inline-block' }} />
                            <span style={{ fontSize: 9, color: '#8070a0', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cr.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!tryOnImage && !tryOnLoading && (
                  <div style={{ background: '#12103a', border: '1px solid #1e1848', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                    <div style={{ fontSize: 60, marginBottom: 14, opacity: 0.3 }}>👗</div>
                    <div style={{ color: '#4040a0', fontSize: 14, marginBottom: 6 }}>Upload outfit · pick a color · click Generate</div>
                    <div style={{ color: '#2a2a60', fontSize: 11 }}>Try multiple colors to find what suits you best</div>
                    {skinRec && (
                      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
                        {skinRec.best.slice(0, 6).map((c: string) => (
                          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#1a1848', color: '#6050a0', borderRadius: 8, padding: '3px 8px', fontSize: 10 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLOR_HEX[c]||'#888', display: 'inline-block' }} />{c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {error && <div style={{ marginTop: 10, padding: '10px 14px', background: '#2a0a0a', border: '1px solid #880000', borderRadius: 8, color: '#ff8080', fontSize: 12 }}>❌ {error}</div>}
              </div>
            </div>

            <NavButtons onPrev={prevStep} showNext={false} />
          </div>
        )}

      </div>

      {/* Single hidden photo input shared across all steps */}
      <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleNewPhoto(f); e.target.value = '' }} />

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  )
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

function StepBadge({ n }: { n: number }) {
  return <span style={{ background: '#4a2090', color: '#e8c99a', width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{n}</span>
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#e8e0ff', display: 'flex', alignItems: 'center', gap: 8 }}><span>{icon}</span>{title}</h2>
      <p style={{ margin: 0, color: '#5050a0', fontSize: 12 }}>{subtitle}</p>
    </div>
  )
}

function MeasurementCard({ icon, label, value }: { icon: string; label: string; value: any }) {
  return (
    <div style={{ background: '#0d0d22', border: '1px solid #1a1848', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ color: '#3a3870', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{icon} {label}</div>
      <div style={{ color: '#e8e0ff', fontWeight: 800, fontSize: 18 }}>{value ?? '–'}<span style={{ fontSize: 10, color: '#4a4870', marginLeft: 2, fontWeight: 400 }}>cm</span></div>
    </div>
  )
}

function SizeCard({ result, category }: { result: any; category: string }) {
  const sizeMap: Record<string, Record<string, string>> = {
    Women: { XS:'76-80', S:'81-85', M:'86-91', L:'92-97', XL:'98-103', XXL:'104-108', XXXL:'109-116' },
    Men:   { S:'86-91', M:'92-97', L:'98-103', XL:'104-109', XXL:'110-115', XXXL:'116-121' },
    Kids:  { '2Y':'H≤92','3Y':'H≤100','4Y':'H≤108','5Y':'H≤115','6Y':'H≤120','7Y':'H≤125','8Y+':'H>125' },
  }
  const chart = sizeMap[category] || sizeMap.Women
  return (
    <div style={{ background: '#12103a', border: '1px solid #2a2060', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg,#2a1060,#1a0848)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#e8c99a' }}>{result.size}</div>
        <div>
          <div style={{ color: '#c0a0ff', fontSize: 12, fontWeight: 700 }}>Your Size</div>
          <div style={{ color: '#6050a0', fontSize: 11 }}>Bust {result.bust_cm}cm · {category}</div>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ color: '#4a4870', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>SIZE CHART — BUST (cm)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {Object.entries(chart).map(([size, range]) => (
            <div key={size} style={{ padding: '4px 9px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: size===result.size?'#4a2090':'#0d0d22', border: `1px solid ${size===result.size?'#8060e0':'#1a1848'}`, color: size===result.size?'#e8c99a':'#4a4870' }}>
              {size} <span style={{ fontWeight: 400, fontSize: 9, opacity: 0.7 }}>{range}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ColorChip({ name, hex, good }: { name: string; hex: string; good?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#1e1848', color: good?'#c0b0e0':'#707090', border: `1px solid ${good?'#2e2868':'#1a1840'}`, borderRadius: 8, padding: '3px 9px', fontSize: 11, fontWeight: good?700:400 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: hex, border: '1px solid rgba(255,255,255,0.15)', display: 'inline-block', flexShrink: 0 }} />{name}
    </span>
  )
}

function ProductCard({ product, bestColors, size }: { product: any; bestColors: Set<string>; size: string }) {
  const mc = product.colors.filter((c: string) => bestColors.has(c))
  const displayColors = mc.length ? mc : product.colors.slice(0, 3)
  return (
    <div style={{ background: '#12103a', border: '1px solid #1e1848', borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <div style={{ color: '#e8c99a', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{product.name}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {displayColors.map((c: string) => (
            <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#1e1848', color: '#a090d0', border: '1px solid #2e2868', borderRadius: 8, padding: '2px 7px', fontSize: 11 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLOR_HEX[c]||'#888', display: 'inline-block' }} />{c}
            </span>
          ))}
        </div>
      </div>
      <div style={{ color: '#3a3070', fontSize: 11 }}>Best for: <span style={{ color: '#5050a0' }}>{product.bodies.slice(0,2).join(', ')}</span></div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <a href={`${product.amazon}&rh=p_n_size_browse-vebin:${encodeURIComponent(size)}`} target="_blank" rel="noreferrer" style={{ background: '#ff9900', color: '#000', padding: '7px 12px', borderRadius: 8, fontWeight: 800, fontSize: 11, textDecoration: 'none', flex: 1, textAlign: 'center', minWidth: 80 }}>🛒 Amazon</a>
        <a href={`${product.flipkart}&p%5B%5D=facets.size%255B%255D%3D${encodeURIComponent(size)}`} target="_blank" rel="noreferrer" style={{ background: '#2874f0', color: '#fff', padding: '7px 12px', borderRadius: 8, fontWeight: 800, fontSize: 11, textDecoration: 'none', flex: 1, textAlign: 'center', minWidth: 80 }}>🛒 Flipkart</a>
        <a href={product.myntra} target="_blank" rel="noreferrer" style={{ background: '#ff3f6c', color: '#fff', padding: '7px 12px', borderRadius: 8, fontWeight: 800, fontSize: 11, textDecoration: 'none', flex: 1, textAlign: 'center', minWidth: 80 }}>🛒 Myntra</a>
      </div>
    </div>
  )
}

function NavButtons({ onPrev, onNext, nextLabel='Next →', showNext=true }: { onPrev?:()=>void; onNext?:()=>void; nextLabel?:string; showNext?:boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #1e1848', gridColumn: '1 / -1' }}>
      {onPrev ? <button onClick={onPrev} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #2a2060', background: '#12103a', color: '#9070c0', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>← Back</button> : <div />}
      {showNext && onNext && <button onClick={onNext} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#4a2090,#7040c0)', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>{nextLabel}</button>}
    </div>
  )
}
