# 👗 StyleSense AI — Fashion Stylist v28

## What's New in v28

| Feature | Detail |
|---------|--------|
| **16 Body Types** | Hourglass, Pear, Apple, Rectangle, Petite, Tall, Athletic, Lean Column, Oval, Diamond, Trapezoid, Spoon, Lollipop, Skittle, Inverted Triangle, Full Hourglass |
| **Full Measurements** | Shoulder, Bust, Waist, High Hip, Low Hip, Arm Length, Hollow-to-Hem, Inseam |
| **Skin Tone** | Fair / Light / Medium / Tan / Deep / Olive |
| **Photo-Realistic Try-On** | IDM-VTON via Replicate — same person, different outfit |
| **AI Stylist Report** | Claude analyzes fit, drape, color match, gives VERDICT |
| **Shopping** | Amazon · Flipkart · Myntra with size pre-filtered |

---

## Setup

### 1. Clone & Install
```bash
npm install
```

### 2. Environment Variables
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

### 3. Get Replicate API Token (for photo-realistic try-on)
1. Go to [replicate.com](https://replicate.com) → Sign up (free)
2. **Account → API tokens → Create token**
3. Paste into `.env.local` as `REPLICATE_API_TOKEN`
4. Cost: ~$0.04–$0.06 per try-on image

> **Without Replicate token:** The app still works — it falls back to a canvas overlay (person photo + outfit blended). All other features are unaffected.

### 4. Deploy Backend (HF Space)
Upload `main.py` to a Hugging Face Space (Docker SDK, Python).  
Set `HF_SPACE_URL` to your Space URL.

### 5. Run
```bash
npm run dev
```

---

## IDM-VTON Technical Notes

- **Model:** `cuuupid/idm-vton` on Replicate
- **Model version:** `c871bb9b...` (see `app/api/tryon/route.ts`)
- **Generation time:** ~8–15s (warm) · ~30–45s (cold start)
- **Best input photos:**
  - Person: full-body, standing straight, plain background
  - Outfit: white/plain background, full garment visible, front-facing
- **Garment categories:** `upper_body` · `lower_body` · `dresses`

---

## Project Structure

```
app/
  page.tsx              ← Main UI (6-step flow)
  api/
    analyze/route.ts    ← Proxy to HF Space (body analysis)
    extract-dress/route.ts ← Proxy to HF Space (garment extraction)
    tryon/route.ts      ← Replicate IDM-VTON proxy (NEW)
main.py                 ← HF Space backend (FastAPI)
```
