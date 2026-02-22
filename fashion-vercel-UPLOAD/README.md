# 👗 3D Fashion Stylist — Vercel Frontend

Next.js 14 frontend that connects to your Hugging Face backend for:
- 📸 AI body analysis (MediaPipe / OpenCV)
- 🧍 3D rotatable avatar (Three.js GLB + morph targets)
- 👗 Virtual dress try-on
- 🛍 Product recommendations (Amazon IN + Flipkart)

---

## 🗂 Project Structure

```
fashion-vercel/
├── app/
│   ├── page.tsx                    ← Main app (all 4 steps)
│   ├── layout.tsx                  ← Root layout
│   ├── globals.css                 ← Tailwind + custom styles
│   ├── api/
│   │   ├── analyze/route.ts        ← Proxy → HF /analyze
│   │   └── extract-dress/route.ts  ← Proxy → HF /extract-dress
│   └── components/
│       ├── AvatarViewer.tsx        ← Three.js 3D avatar canvas
│       ├── UploadPanel.tsx         ← Photo upload with drag/drop
│       ├── DressTryOn.tsx          ← Dress upload + fit analysis
│       └── RecommendPanel.tsx      ← Product recommendations
├── public/
│   └── avatar_base.glb             ← YOUR GLB FILE GOES HERE
├── .env.local.example              ← Copy → .env.local
├── package.json
└── README.md
```

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### Prerequisites
- Node.js 18+
- Git installed
- Vercel account (free) at vercel.com
- HF Space already live at `https://indhu321-fashion-stylist-backend.hf.space`

---

### STEP 1 — Add your GLB avatar file

Place a `avatar_base.glb` file inside the `/public` folder.

See `/public/README-avatar.txt` for options to get a free GLB.

**Quick test without GLB:** The app works without it — a purple wireframe shows instead.

---

### STEP 2 — Install dependencies locally

```bash
cd fashion-vercel
npm install
```

---

### STEP 3 — Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
HF_SPACE_URL=https://indhu321-fashion-stylist-backend.hf.space
```

---

### STEP 4 — Test locally

```bash
npm run dev
```

Open http://localhost:3000 — you should see the full app.

Test the API is working:
- Upload a full-body photo
- Click "Analyse My Body"
- 3D avatar should appear with measurements

---

### STEP 5 — Deploy to Vercel

**Option A — Vercel CLI (recommended):**
```bash
npm install -g vercel
vercel login
vercel --prod
```

When prompted:
- Project name: `fashion-stylist`
- Root directory: `./` (current folder)
- Build command: `npm run build` (default)
- Output: `.next` (default)

**Option B — GitHub + Vercel Dashboard:**
```bash
git init
git add .
git commit -m "Initial commit — Fashion Stylist v7"
git remote add origin https://github.com/YOUR_USERNAME/fashion-stylist.git
git push -u origin main
```
Then go to vercel.com → New Project → Import from GitHub.

---

### STEP 6 — Add Environment Variables on Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `HF_SPACE_URL` | `https://indhu321-fashion-stylist-backend.hf.space` |

Click **Save** → **Redeploy**.

---

### STEP 7 — Test in production

Visit your Vercel URL (e.g. `https://fashion-stylist-xyz.vercel.app`)

Test the full flow:
1. 📸 Upload a full-body photo → click Analyse
2. 👤 Avatar tab → see 3D model with your proportions
3. 👗 Try-On tab → upload a dress product image
4. 🛍 Recommendations tab → see matched products

---

## 🔗 Data Flow

```
User uploads photo (Vercel)
      ↓
POST /api/analyze  (Vercel Edge proxy)
      ↓
POST https://HF_SPACE_URL/analyze  (HF Space FastAPI)
      ↓  MediaPipe / OpenCV body detection
      ↓
JSON response: { size, morph, measurements, colors... }
      ↓
Three.js avatar morphTargetInfluences updated
      ↓
User uploads dress → POST /api/extract-dress → HF removes background
      ↓
Dress PNG overlaid on 3D avatar
```

---

## 🧩 GLB Morph Target Names

Your `avatar_base.glb` must have shape keys with these exact names:

| Name | Effect |
|------|--------|
| `hip_wide` | Widens hips |
| `waist_wide` | Widens waist |
| `bust_wide` | Widens bust/chest |
| `height_tall` | Increases height |
| `hip_thin` | Narrows hips (optional) |
| `waist_thin` | Narrows waist (optional) |

---

## 💡 Tips

- **HF cold start:** First request after inactivity takes 20–30s. Show a loading spinner (already done).
- **CORS:** HF backend has `allow_origins=["*"]`. In production, lock to your Vercel domain.
- **GLB size:** Keep under 5MB for fast load. Compress with https://gltf.report/
- **Mobile:** The layout is responsive — works on phones too.

---

## 🛠 Local Development Commands

```bash
npm run dev     # Start dev server on :3000
npm run build   # Build for production
npm run start   # Run production build locally
```

---

Built with Next.js 14 · Three.js · @react-three/fiber · Tailwind CSS
Backend: Hugging Face Spaces · Gradio + FastAPI · MediaPipe · OpenCV
