# 🚀 Deployment Guide — Fashion Stylist Pro

## ─── PROBLEM 1: 404 on Vercel ───────────────────────────────

The 404 was caused by:
1. `HF_SPACE_URL` env variable not set in Vercel
2. Three.js/GLB imports failing (fixed — now uses pure SVG avatar, no .glb file needed)

### Fix: Set Environment Variable in Vercel

1. Go to **vercel.com** → your project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `HF_SPACE_URL`
   - **Value:** `https://indhu321-fashion-stylist-backend.hf.space`
   - Environment: ✅ Production ✅ Preview ✅ Development
3. Click **Save**, then go to **Deployments** → **Redeploy**

---

## ─── PROBLEM 2: MediaPipe import failing on HF ──────────────

Replace your HF Space `app.py` with `BACKEND_app.py` from this folder.
Replace your `requirements.txt` with `BACKEND_FIX_requirements.txt`.

The new backend uses **GrabCut silhouette** detection (cv2 only) — 
no mediapipe needed, works on CPU-only HF Spaces.

---

## ─── PROBLEM 3: GLB file (what is it?) ─────────────────────

A `.glb` file is a 3D model file used by Three.js.
The old code needed `public/avatar_base.glb` — **you don't need it anymore**.
This version uses a **pure SVG + JavaScript avatar** that rotates 360° 
with no external 3D files required.

---

## ─── Frontend Deployment Steps ──────────────────────────────

1. Delete old Vercel project files
2. Upload this entire folder to GitHub
3. Connect GitHub repo to Vercel
4. Set `HF_SPACE_URL` env variable (step above)
5. Deploy — should show green ✅

## ─── Backend HF Space Steps ─────────────────────────────────

1. Go to your HF Space → Files tab
2. Replace `app.py` with `BACKEND_app.py` content
3. Replace `requirements.txt` with `BACKEND_FIX_requirements.txt` content
4. Space will auto-restart in ~1 minute
5. Test: visit `https://indhu321-fashion-stylist-backend.hf.space/health`
   Should return: `{"status":"ok",...}`
