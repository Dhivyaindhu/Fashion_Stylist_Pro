"""
3D Fashion Stylist Pro — Backend (HF Space compatible)
• Works WITHOUT mediapipe (uses silhouette/GrabCut method)
• Works WITHOUT rembg (optional)
• FastAPI REST endpoints for Vercel frontend
"""

import gradio as gr
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance
import cv2, math, base64, io, json

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# ── Static data ────────────────────────────────────────────────
COLOR_HEX = {
    "Pastel Pink":"#FFD1DC","Lavender":"#E6D0FF","Mint Green":"#AAFFDD",
    "Sky Blue":"#87CEEB","Blush Rose":"#FFB6C1","Butter Yellow":"#FFFACD",
    "Soft Peach":"#FFDAB9","Warm Coral":"#FF7F50","Dusty Mauve":"#C09090",
    "Champagne":"#F7E7CE","Terracotta":"#E07050","Royal Blue":"#4169E1",
    "Emerald":"#50C878","Mustard":"#FFDB58","Teal":"#008080",
    "Burnt Orange":"#CC5500","Cobalt":"#0047AB","Deep Burgundy":"#800020",
    "Fuchsia":"#FF00FF","Crimson":"#DC143C","Navy":"#001F5B",
    "Jade":"#00A86B","Pure White":"#FFFFFF","Bright Gold":"#FFD700",
    "Hot Pink":"#FF69B4","Lime":"#32CD32","Peach":"#FFCBA4",
    "Blush":"#DE5D83","Coral":"#FF6B6B",
}
SKIN_PALETTE = {
    "Fair":  {"best":["Pastel Pink","Lavender","Mint Green","Sky Blue","Blush Rose","Butter Yellow","Peach"],"avoid":["Pure White"],"dicebear_skin":"f8d5c2","hair":"b8860b"},
    "Light": {"best":["Soft Peach","Warm Coral","Dusty Mauve","Champagne","Terracotta","Sky Blue","Blush"],"avoid":["Pale pastels"],"dicebear_skin":"e8b89a","hair":"4a3728"},
    "Medium":{"best":["Royal Blue","Emerald","Mustard","Teal","Burnt Orange","Cobalt","Coral"],"avoid":["Muddy browns"],"dicebear_skin":"c68642","hair":"2d1b0e"},
    "Tan":   {"best":["Cobalt","Deep Burgundy","Fuchsia","Crimson","Navy","Jade"],"avoid":["Dull browns"],"dicebear_skin":"a0522d","hair":"1a0f0a"},
    "Deep":  {"best":["Pure White","Bright Gold","Cobalt","Fuchsia","Hot Pink","Lime","Crimson"],"avoid":["Dark muddy tones"],"dicebear_skin":"4a2912","hair":"0a0505"},
}
BODY_TYPES = {
    "Hourglass":{"icon":"⌛","desc":"Balanced shoulders & hips, defined waist","tips":["Wrap dresses","Bodycon","Belted styles","Fit & Flare"]},
    "Full Hourglass":{"icon":"💎","desc":"Curvaceous balanced proportions","tips":["Structured dresses","V-necks","High-waist trousers"]},
    "Pear":{"icon":"🍐","desc":"Hips wider than shoulders","tips":["A-line skirts","Empire waist","Boat necks","Dark bottoms"]},
    "Apple":{"icon":"🍎","desc":"Fuller midsection","tips":["Empire waist","V-necklines","Flowy tops","Tunics"]},
    "Inverted Triangle":{"icon":"🔻","desc":"Broader shoulders, narrower hips","tips":["A-line skirts","Wide-leg trousers","Peplum tops"]},
    "Rectangle":{"icon":"▭","desc":"Similar measurements throughout","tips":["Peplum","Ruffles","Belted looks","Wrap dresses"]},
    "Petite":{"icon":"🌸","desc":"Smaller overall frame","tips":["Monochromatic","Vertical stripes","Mini lengths"]},
    "Trapezoid":{"icon":"🔷","desc":"Broad shoulders tapering to hips","tips":["Slim chinos","Fitted shirts","Straight jeans"]},
    "Triangle":{"icon":"🔺","desc":"Wider hips than shoulders","tips":["Blazers","Light tops","Dark bottoms"]},
    "Circle":{"icon":"⭕","desc":"Rounder midsection","tips":["Vertical stripes","Dark solids","Longer jackets"]},
    "Column":{"icon":"🏛","desc":"Uniform width top to bottom","tips":["Layered looks","Textured fabrics"]},
}
SIZE_BUST = {"XS":80,"S":84,"M":88,"L":92,"XL":96,"XXL":100,"XXXL":106,
             "2-4Y":52,"4-6Y":56,"6-8Y":60,"8-10Y":64,"10-12Y":68}

# ── Skin tone detection ──────────────────────────────────────
def detect_skin_tone(rgb_np):
    hh,ww = rgb_np.shape[:2]
    face = rgb_np[int(hh*.05):int(hh*.25), int(ww*.3):int(ww*.7)]
    if face.size == 0: face = rgb_np[:hh//4]
    br = (np.mean(face[:,:,0]) + np.mean(face[:,:,1]) + np.mean(face[:,:,2])) / 3
    if   br > 210: return "Fair",   "#f5d5c8"
    elif br > 185: return "Light",  "#ebbfa0"
    elif br > 155: return "Medium", "#c8956c"
    elif br > 120: return "Tan",    "#a0694a"
    else:          return "Deep",   "#5c2e10"

# ── Body measurement detection (silhouette, no mediapipe) ─────
W_SZ = [(0.105,"XS"),(0.145,"S"),(0.182,"M"),(0.220,"L"),(0.258,"XL"),(0.298,"XXL")]
M_SZ = [(0.120,"S"),(0.158,"M"),(0.198,"L"),(0.240,"XL"),(0.285,"XXL")]

def calc_size(sh_px, hp_px, pw, cat):
    if pw <= 0: return "M"
    sc = (sh_px/pw)*.42 + (hp_px/pw)*.58
    if cat == "Kids":
        for t,s in [(0.12,"2-4Y"),(0.15,"4-6Y"),(0.19,"6-8Y"),(0.23,"8-10Y")]:
            if sc <= t: return s
        return "10-12Y"
    for t,s in (M_SZ if cat=="Men" else W_SZ):
        if sc <= t: return s
    return "XXXL"

def get_person_mask(img_bgr):
    h,w = img_bgr.shape[:2]
    try:
        mx,my = max(int(w*.12),6), max(int(h*.06),6)
        rect = (mx,my,w-2*mx,h-2*my)
        bgd = np.zeros((1,65),np.float64); fgd = np.zeros((1,65),np.float64); gc = np.zeros((h,w),np.uint8)
        cv2.grabCut(img_bgr,gc,rect,bgd,fgd,8,cv2.GC_INIT_WITH_RECT)
        mask = np.where((gc==2)|(gc==0),0,255).astype(np.uint8)
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,13))
        mask = cv2.morphologyEx(mask,cv2.MORPH_CLOSE,k)
        cnts,_ = cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
        if cnts and cv2.contourArea(max(cnts,key=cv2.contourArea)) >= h*w*.04:
            cl = np.zeros_like(mask); cv2.drawContours(cl,[max(cnts,key=cv2.contourArea)],-1,255,-1); return cl
    except: pass
    mask = np.zeros((h,w),np.uint8)
    mask[:, max(0,w//2-int(w*.38)):min(w,w//2+int(w*.38))] = 255
    return mask

def detect_measurements(img_bgr, category):
    h,w = img_bgr.shape[:2]
    avg_h = 162 if category=="Women" else (175 if category=="Men" else 118)
    BK,HK,SK = 2.68,2.78,1.78

    pm = get_person_mask(img_bgr)
    cnts,_ = cv2.findContours(pm,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    if cnts: bx,by,bw_,bh_ = cv2.boundingRect(max(cnts,key=cv2.contourArea))
    else: bx,by=int(w*.12),int(h*.03); bw_=int(w*.76); bh_=int(h*.94)

    def sw(frac):
        ws = []
        for dy in [-3,0,3]:
            ry = max(0,min(int(by+bh_*frac)+dy,h-1))
            row = pm[ry, max(0,bx):min(w,bx+bw_)]; nz = np.where(row>0)[0]
            if len(nz) >= 4: ws.append(int(nz[-1]-nz[0]))
        return int(np.median(ws)) if ws else bw_

    tr = by
    for yi in range(by, by+bh_):
        if yi >= h: break
        if np.sum(pm[yi,bx:min(bx+bw_,w)]) > 0: tr=yi; break
    bh2 = max((by+bh_-1)-tr, 1)

    shf = (tr-by+int(bh2*.15))/max(bh_,1); bsf = (tr-by+int(bh2*.26))/max(bh_,1)
    wf_ = (tr-by+int(bh2*.48))/max(bh_,1); hf  = (tr-by+int(bh2*.62))/max(bh_,1)

    sh_px=sw(shf); bp_=sw(bsf); wp_=sw(wf_); hp_px=sw(hf)
    size = calc_size(sh_px,hp_px,w,category)
    p = avg_h/max(bh_,1); CIRC = math.pi/1.39
    bc=round(bp_*p*CIRC,1); wc=round(wp_*p*CIRC,1); hc=round(hp_px*p*CIRC,1); sc_=round(sh_px*p*1.20,1)

    if category=="Women": bc=max(72,min(bc,148)); wc=max(56,min(wc,132)); hc=max(78,min(hc,152))
    elif category=="Men":  bc=max(80,min(bc,150)); wc=max(62,min(wc,138)); hc=max(82,min(hc,148))

    vis = img_bgr.copy()
    for frac,lbl,col in [(shf,"Shoulder",(80,255,80)),(bsf,"Chest",(0,200,255)),(wf_,"Waist",(255,180,0)),(hf,"Hip",(80,80,255))]:
        ry = by+int(bh_*frac); cv2.line(vis,(bx,ry),(bx+bw_,ry),col,3)
        cv2.putText(vis,lbl,(bx+4,max(8,ry-6)),cv2.FONT_HERSHEY_SIMPLEX,.65,col,2)
    cv2.putText(vis,f"SIZE:{size}",(10,42),cv2.FONT_HERSHEY_SIMPLEX,1.4,(0,255,120),3)

    return dict(height_cm=round(bh_*p,1),shoulder_cm=sc_,chest_cm=bc,waist_cm=wc,hip_cm=hc,
        inseam_cm=round(bh_*p*.44,1),sh_ratio=round(sh_px/max(hp_px,1),3),wh_ratio=round(wp_/max(hp_px,1),3),
        _sh_px=sh_px,_hp_px=hp_px,_photo_w=w,method="Silhouette (GrabCut)",vis=vis,size_override=size)

def classify_body(m, cat):
    sr,wr = m["sh_ratio"],m["wh_ratio"]; sc,hc,wc = m["shoulder_cm"],m["hip_cm"],m["waist_cm"]
    wd = ((sc+hc)/2)-wc
    if cat=="Women":
        if abs(sr-1.0)<.10 and wr<.83 and wd>5: return "Full Hourglass" if wd>10 else "Hourglass"
        if sr<.92: return "Pear"
        if sr>1.12: return "Inverted Triangle"
        if wr>.86: return "Apple"
        if sc<34: return "Petite"
        return "Rectangle"
    if cat=="Men":
        if sr>1.12: return "Trapezoid"
        if wr>.90: return "Circle"
        if sr<.90: return "Triangle"
        return "Column"
    return "Petite"

def extract_dress(pil_img):
    img_rgb = np.array(ImageEnhance.Contrast(pil_img.convert("RGB")).enhance(1.1))
    img_bgr = cv2.cvtColor(img_rgb,cv2.COLOR_RGB2BGR); h,w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr,cv2.COLOR_BGR2GRAY)
    edges = gray[[0,-1],:].flatten().tolist()+gray[:,[0,-1]].flatten().tolist()
    if np.mean(edges)>200:
        _,fg = cv2.threshold(gray,238,255,cv2.THRESH_BINARY_INV)
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)); fg=cv2.morphologyEx(fg,cv2.MORPH_CLOSE,k)
        cnts,_ = cv2.findContours(fg,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE); dm=np.zeros((h,w),np.uint8)
        if cnts:
            lg = [c for c in cnts if cv2.contourArea(c)>h*w*.002]
            cv2.drawContours(dm,lg if lg else [max(cnts,key=cv2.contourArea)],-1,255,-1)
        k2=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(25,25)); dm=cv2.morphologyEx(dm,cv2.MORPH_CLOSE,k2)
    else:
        margin=max(5,min(w,h)//25); rect=(margin,margin,w-2*margin,h-2*margin)
        bgd=np.zeros((1,65),np.float64); fgd=np.zeros((1,65),np.float64); gc=np.zeros((h,w),np.uint8)
        try: cv2.grabCut(img_bgr,gc,rect,bgd,fgd,5,cv2.GC_INIT_WITH_RECT); fg=np.where((gc==2)|(gc==0),0,255).astype(np.uint8)
        except: _,fg=cv2.threshold(gray,20,255,cv2.THRESH_BINARY)
        k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,13)); kb=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(35,35))
        fg[:int(h*.22),:]=0
        dm=cv2.morphologyEx(cv2.morphologyEx(fg,cv2.MORPH_OPEN,k),cv2.MORPH_CLOSE,kb)

    num,labels,stats,_ = cv2.connectedComponentsWithStats(dm,8)
    if num>1:
        lg2=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA])); dm=np.where(labels==lg2,255,0).astype(np.uint8)
    dm=cv2.GaussianBlur(dm,(7,7),0); _,dm=cv2.threshold(dm,100,255,cv2.THRESH_BINARY)
    rgba=np.zeros((h,w,4),np.uint8); rgba[:,:,:3]=img_rgb; rgba[:,:,3]=dm
    result=Image.fromarray(rgba,"RGBA"); bbox=Image.fromarray(dm).getbbox()
    if bbox:
        pad=20; result=result.crop((max(0,bbox[0]-pad),max(0,bbox[1]-pad),min(w,bbox[2]+pad),min(h,bbox[3]+pad)))
    return result

def pil_to_b64(pil_img):
    buf=io.BytesIO(); pil_img.save(buf,format="PNG"); return base64.b64encode(buf.getvalue()).decode()

# ── FastAPI REST ──────────────────────────────────────────────
app_api = FastAPI(title="Fashion Stylist API")
app_api.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app_api.get("/health")
async def health():
    return {"status":"ok","mediapipe":False,"rembg":False,"method":"GrabCut silhouette"}

@app_api.post("/analyze")
async def api_analyze(file: UploadFile = File(...), category: str = Form("Women")):
    try:
        data    = await file.read()
        arr     = np.frombuffer(data, np.uint8)
        img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            return JSONResponse({"error":"Could not decode image"},status_code=400)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        m  = detect_measurements(img_bgr, category)
        sz = m.pop("size_override","M")
        bt = classify_body(m, category)
        st,sx = detect_skin_tone(img_rgb)
        pal = SKIN_PALETTE.get(st, SKIN_PALETTE["Medium"])
        vis_pil=Image.fromarray(cv2.cvtColor(m.pop("vis"),cv2.COLOR_BGR2RGB))
        buf=io.BytesIO(); vis_pil.save(buf,format="JPEG",quality=80)
        vis_b64=base64.b64encode(buf.getvalue()).decode()
        m.pop("_sh_px",None); m.pop("_hp_px",None); m.pop("_photo_w",None)
        return {
            "size":sz,"body_type":bt,"skin_tone":st,"skin_hex":sx,"method":m.get("method","GrabCut"),
            "height_cm":m["height_cm"],"shoulder_cm":m["shoulder_cm"],"bust_cm":m["chest_cm"],
            "waist_cm":m["waist_cm"],"hip_cm":m["hip_cm"],"inseam_cm":m["inseam_cm"],
            "morph":{
                "hip_scale":round(min(m["hip_cm"]/92.0,1.8),3),
                "waist_scale":round(min(m["waist_cm"]/72.0,1.8),3),
                "bust_scale":round(min(m["chest_cm"]/88.0,1.8),3),
                "height_scale":round(min(m["height_cm"]/162.0,1.4),3),
            },
            "best_colors":pal["best"],"avoid_colors":pal["avoid"],
            "style_tips":BODY_TYPES.get(bt,{}).get("tips",[]),
            "body_icon":BODY_TYPES.get(bt,{}).get("icon","👤"),
            "body_desc":BODY_TYPES.get(bt,{}).get("desc",""),
            "vis_jpeg_b64":vis_b64,
        }
    except Exception as e:
        return JSONResponse({"error":str(e)},status_code=500)

@app_api.post("/extract-dress")
async def api_extract_dress(file: UploadFile = File(...)):
    try:
        data=await file.read(); pil_img=Image.open(io.BytesIO(data)).convert("RGBA")
        extracted=extract_dress(pil_img)
        return {"dress_b64":pil_to_b64(extracted)}
    except Exception as e:
        return JSONResponse({"error":str(e)},status_code=500)

# ── Minimal Gradio UI (just for HF Space health check) ────────
with gr.Blocks(title="Fashion Stylist Backend") as demo:
    gr.Markdown("## 👗 Fashion Stylist Backend API\n\nThis is the **REST API backend**. The frontend is at your Vercel URL.\n\n**Endpoints:**\n- `GET /health` — status check\n- `POST /analyze` — body analysis\n- `POST /extract-dress` — garment extraction")
    gr.HTML("<p style='color:#888'>✅ Backend running. Connect via your Vercel frontend.</p>")

from gradio import mount_gradio_app
app = mount_gradio_app(app_api, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
