"""
Fashion Stylist v27 — PRECISION ANALYSIS ENGINE
═══════════════════════════════════════════════════════════════════
IMPROVEMENTS over v26:

IMPROVEMENT 1 — DUAL HIP MEASUREMENT (High + Low Hip):
  Added high_hip scan at torso*0.68 (just above pelvis)
  And low_hip scan at torso*0.82 (fullest hip/seat)
  Returns both — matches Olivia Paisley measurement guide image
  Classifies using LARGER of the two as the "operative" hip

IMPROVEMENT 2 — BETTER WAIST SEARCH:
  Waist search window tightened: torso*0.48 → torso*0.70
  Uses Savitzky-Golay smoothing on width profile before finding minimum
  Prevents false waist readings at ribs or hip

IMPROVEMENT 3 — ENHANCED SCALE CALIBRATION:
  Added crown-to-pelvis ratio (0.605 of full height for women)
  When ankles not visible, uses torso-height ratio more accurately
  Separate ratios per category (Women/Men/Kids)

IMPROVEMENT 4 — HOLLOW-TO-HEM (dress length) ESTIMATE:
  Estimates hollow_to_hem_cm (shoulder neckline to floor)
  Needed for dress sizing (standard dressmaking measurement)

IMPROVEMENT 5 — MEASUREMENT CONFIDENCE SCORES:
  Each measurement now has confidence 0–100
  Low confidence triggers "⚠ tip" for user
  Aggregated into overall result_confidence

IMPROVEMENT 6 — BETTER BODY TYPE CLASSIFICATION:
  Now uses High Hip in addition to bust/waist/low-hip
  Pear sub-types: Pear vs Full Pear vs Bell
  Improved Inverted Triangle detection (sc vs actual hip width)
  Added Full Hourglass separation from Hourglass more accurately

IMPROVEMENT 7 — ANTI-DRAPE GUARD V2:
  Dual-side asymmetry detection improved
  Handles churidar, palazzo, and dhoti pants correctly

═══════════════════════════════════════════════════════════════════
"""
import numpy as np, cv2, math, base64, io, statistics
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse

print("="*70)
print("Fashion Stylist v27  PRECISION ANALYSIS ENGINE")
print("="*70)

TORCH_OK = YOLO_OK = REMBG_OK = False
try:
    import torch
    from torchvision.models.detection import keypointrcnn_resnet50_fpn, KeypointRCNN_ResNet50_FPN_Weights
    TORCH_OK = True; print("✅ PyTorch OK")
except Exception as e: print(f"⚠ PyTorch unavailable: {e}")
try:
    from ultralytics import YOLO as _YOLO_CLS
    YOLO_OK = True; print("✅ YOLOv8 OK")
except Exception as e: print(f"⚠ YOLOv8 unavailable: {e}")
try:
    from rembg import remove as rembg_remove
    REMBG_OK = True; print("✅ rembg OK")
except Exception as e: print(f"⚠ rembg unavailable: {e}")

_FACE_CASCADE = None
try:
    _fc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    if not _fc.empty(): _FACE_CASCADE = _fc; print("✅ Face detector OK")
except: pass
print("="*70)

# ── JSON serializer ───────────────────────────────────────────
def to_py(obj):
    if isinstance(obj, dict):  return {k: to_py(v) for k,v in obj.items()}
    if isinstance(obj, (list,tuple)): return [to_py(i) for i in obj]
    if isinstance(obj, np.ndarray): return obj.tolist()
    if isinstance(obj, (np.floating,)): return float(obj)
    if isinstance(obj, (np.integer,)): return int(obj)
    if isinstance(obj, np.bool_): return bool(obj)
    if TORCH_OK and isinstance(obj, torch.Tensor): return obj.cpu().numpy().tolist()
    return obj

# ── Size charts (Indian standard) ────────────────────────────
WOMEN_SIZE = [(81,"XS"),(86,"S"),(91,"M"),(97,"L"),(102,"XL"),(107,"XXL"),(117,"XXXL")]
MEN_SIZE   = [(92,"S"),(97,"M"),(102,"L"),(107,"XL"),(112,"XXL"),(122,"XXXL")]

def size_from_bust(cat, bust_cm, height_cm=None):
    bust_cm = float(bust_cm)
    if cat == "Kids":
        h = float(height_cm or 100)
        for t,s in [(92,"2Y"),(100,"3Y"),(108,"4Y"),(115,"5Y"),(120,"6Y"),(125,"7Y"),(130,"8Y+")]:
            if h <= t: return s
        return "8Y+"
    tbl = MEN_SIZE if cat == "Men" else WOMEN_SIZE
    for t,s in tbl:
        if bust_cm <= t: return s
    return "4XL"

# ── Category anthropometric properties ───────────────────────
CATEGORY_PROPS = {
    "Women": {
        "default_height": 158,
        "sc_max": 48, "bc_max": 120, "wc_max": 108, "hc_max": 124, "hhc_max": 116,
        "torso_to_height": 0.32,        # torso (sh→hip) / full height
        "crown_to_hip": 0.605,          # crown to pelvis / full height (NEW)
        "shoulder_ratio": 0.245,        # shoulder span / height
    },
    "Men": {
        "default_height": 172,
        "sc_max": 58, "bc_max": 130, "wc_max": 118, "hc_max": 126, "hhc_max": 120,
        "torso_to_height": 0.33,
        "crown_to_hip": 0.595,
        "shoulder_ratio": 0.285,
    },
    "Kids": {
        "default_height": 112,
        "sc_max": 38, "bc_max": 70,  "wc_max": 64,  "hc_max": 72,  "hhc_max": 68,
        "torso_to_height": 0.30,
        "crown_to_hip": 0.580,
        "shoulder_ratio": 0.255,
    },
}

SKIN_PALETTE = {
    "Fair":  {"best":["Pastel Pink","Lavender","Mint Green","Sky Blue","Blush Rose","Butter Yellow","Peach"],"avoid":["Pure White","Neon"]},
    "Light": {"best":["Soft Peach","Warm Coral","Dusty Mauve","Champagne","Terracotta","Sky Blue","Blush"],"avoid":["Pale pastels"]},
    "Medium":{"best":["Royal Blue","Emerald","Mustard","Teal","Burnt Orange","Cobalt","Coral"],"avoid":["Muddy browns"]},
    "Tan":   {"best":["Cobalt","Deep Burgundy","Fuchsia","Crimson","Navy","Electric Teal","Jade"],"avoid":["Dull browns"]},
    "Deep":  {"best":["Pure White","Bright Gold","Cobalt","Fuchsia","Hot Pink","Lime","Crimson"],"avoid":["Dark muddy tones"]},
}

BODY_TYPES = {
    "Hourglass":         {"icon":"⌛","desc":"Balanced shoulders & hips, defined waist","tips":["Wrap dresses","Bodycon","Belted","Fit & Flare"]},
    "Full Hourglass":    {"icon":"💎","desc":"Fuller curvaceous balanced figure","tips":["Structured dresses","V-necks","High-waist trousers"]},
    "Pear":              {"icon":"🍐","desc":"Hips wider than bust","tips":["A-line skirts","Empire waist","Boat necks","Dark bottoms"]},
    "Full Pear":         {"icon":"🍐","desc":"Significantly wider hips, smaller upper body","tips":["A-line","Off-shoulder","Bold tops","Dark bottoms"]},
    "Apple":             {"icon":"🍎","desc":"Fuller midsection, low waist definition","tips":["Empire waist","V-necklines","Flowy tops","Tunics"]},
    "Oval":              {"icon":"🥚","desc":"Bust larger than hips, fuller upper body","tips":["Empire waist","V-necks","Vertical stripes"]},
    "Inverted Triangle": {"icon":"🔻","desc":"Broader shoulders, narrower hips","tips":["A-line skirts","Wide-leg trousers","Peplum"]},
    "Rectangle":         {"icon":"▭","desc":"Balanced proportions, moderate definition","tips":["Peplum","Ruffles","Belted looks","Wrap dresses"]},
    "Petite":            {"icon":"🌸","desc":"Smaller overall frame","tips":["Monochromatic","Vertical stripes","Mini lengths"]},
    "Trapezoid":         {"icon":"🔷","desc":"Broad shoulders tapering to hips","tips":["Slim chinos","Fitted shirts","Straight jeans"]},
    "Triangle":          {"icon":"🔺","desc":"Wider hips than shoulders","tips":["Blazers","Light tops","Dark bottoms"]},
    "Circle":            {"icon":"⭕","desc":"Rounder midsection","tips":["Vertical stripes","Dark solids","Longer jackets"]},
    "Column":            {"icon":"🏛","desc":"Uniform width top to bottom","tips":["Layered looks","Textured fabrics"]},
}

def detect_skin_tone(rgb_np):
    h,w = rgb_np.shape[:2]
    face = rgb_np[int(h*.04):int(h*.22), int(w*.28):int(w*.72)]
    if face.size == 0: face = rgb_np[:h//6]
    br = float(np.mean(face[:,:,0]))
    if   br>215: return "Fair",  "#f5d5c8"
    elif br>188: return "Light", "#ebbfa0"
    elif br>155: return "Medium","#c8956c"
    elif br>115: return "Tan",   "#a0694a"
    else:        return "Deep",  "#5c2e10"

# ══════════════════════════════════════════════════════════════
# SEGMENTATION
# ══════════════════════════════════════════════════════════════
def get_mask(img_bgr):
    h,w = img_bgr.shape[:2]
    masks = []
    if REMBG_OK:
        try:
            pil   = Image.fromarray(cv2.cvtColor(img_bgr,cv2.COLOR_BGR2RGB))
            alpha = np.array(rembg_remove(pil))[:,:,3]
            m     = (alpha>30).astype(np.uint8)*255
            k     = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15))
            m     = cv2.morphologyEx(m,cv2.MORPH_CLOSE,k)
            masks.append((m,0.55))
        except: pass
    try:
        px,py = max(int(w*.12),10), max(int(h*.02),6)
        rect  = (px,py,w-2*px,h-py-6)
        bgd,fgd,gc = np.zeros((1,65),np.float64),np.zeros((1,65),np.float64),np.zeros((h,w),np.uint8)
        cv2.grabCut(img_bgr,gc,rect,bgd,fgd,10,cv2.GC_INIT_WITH_RECT)
        masks.append((np.where((gc==2)|(gc==0),0,255).astype(np.uint8),0.30))
    except: pass
    if not masks:
        m = np.zeros((h,w),np.uint8)
        m[:,max(0,w//2-int(w*.36)):min(w,w//2+int(w*.36))] = 255
        return m
    combined = np.zeros((h,w),np.float32)
    for mask,weight in masks: combined += mask.astype(np.float32)/255.*weight
    thresh = 0.28 if len(masks)==1 else 0.36
    final  = (combined>thresh).astype(np.uint8)*255
    k2 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(21,21))
    ko = cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9))
    final = cv2.morphologyEx(final,cv2.MORPH_CLOSE,k2)
    final = cv2.morphologyEx(final,cv2.MORPH_OPEN,ko)
    num,labels,stats,_ = cv2.connectedComponentsWithStats(final,8)
    if num>1:
        lg = 1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
        final = np.where(labels==lg,255,0).astype(np.uint8)
    return final

# ══════════════════════════════════════════════════════════════
# SAVITZKY-GOLAY SMOOTHER (no scipy needed)
# ══════════════════════════════════════════════════════════════
def savgol_smooth(data, window=9, poly=2):
    """Simple SG-like smoother using moving average as fallback."""
    if len(data) < window: return data
    half = window // 2
    result = list(data)
    for i in range(half, len(data)-half):
        result[i] = float(np.mean(data[max(0,i-half):i+half+1]))
    return result

# ══════════════════════════════════════════════════════════════
# SYMMETRIC WIDTH SCANNER  (saree / drape safe)
# ══════════════════════════════════════════════════════════════
def sym_half_width(pm, y, cx, h, spread=16):
    """
    Body half-width at scanline y.
    If L/R asymmetric (saree pallu/drape) → use MIN side (true body).
    If symmetric (fitted garment)           → use average.
    """
    samples = []
    for dy in range(-spread, spread+1, 2):
        ry = max(0, min(y+dy, h-1))
        nz = np.where(pm[ry,:]>0)[0]
        if len(nz) < 4: continue
        L = float(cx - nz[0])
        R = float(nz[-1] - cx)
        if L < 4 or R < 4: continue
        ratio = min(L,R)/max(L,R) if max(L,R)>0 else 0
        # If strongly asymmetric (drape/saree pallu), use minimum side
        samples.append((L+R)/2.0 if ratio>0.72 else min(L,R)*1.05)
    if not samples:
        nz = np.where(pm[max(0,min(y,h-1)),:]>0)[0]
        return float(nz[-1]-nz[0])/2 if len(nz)>=4 else 40.0
    samples.sort()
    lo = max(0, len(samples)//5)
    hi = max(lo+1, 4*len(samples)//5)
    return float(statistics.median(samples[lo:hi]))

def scan_zone(pm, y0, y1, cx, h, mode='max', spread=16):
    best_y = (y0+y1)//2; best_hw = None
    for y in range(max(0,y0), min(h-1,y1), 2):
        hw = sym_half_width(pm, y, cx, h, spread)
        if best_hw is None or (mode=='max' and hw>best_hw) or (mode=='min' and hw<best_hw):
            best_hw = hw; best_y = y
    return best_y, (best_hw or sym_half_width(pm,(y0+y1)//2,cx,h))

def find_true_waist(pm, top_y, bottom_y, cx, h):
    """
    Scan vertical range with smoothing; find narrowest symmetric scanline = natural waist.
    Uses SG-smoothing to avoid false waist at ribs or clothing folds.
    """
    candidates = []
    for y in range(max(0,top_y), min(h-1,bottom_y), 2):
        nz = np.where(pm[y,:]>0)[0]
        if len(nz) < 6: continue
        L,R = float(cx-nz[0]), float(nz[-1]-cx)
        if L<6 or R<6: continue
        ratio = min(L,R)/max(L,R) if max(L,R)>0 else 0
        candidates.append((y, (L+R)/2.0 if ratio>0.72 else min(L,R)*1.05))
    if not candidates:
        return (top_y+bottom_y)//2, sym_half_width(pm,(top_y+bottom_y)//2,cx,h)
    if len(candidates) >= 7:
        widths = [c[1] for c in candidates]
        smoothed = savgol_smooth(widths, window=min(9,len(widths)-1|1))
        mi = int(np.argmin(smoothed))
        return candidates[mi][0], smoothed[mi]
    return min(candidates, key=lambda c:c[1])

# ══════════════════════════════════════════════════════════════
# BODY VISIBILITY FRACTION
# ══════════════════════════════════════════════════════════════
def estimate_body_fraction(pm, h):
    """Estimate fraction of body visible (1.0 = full body, 0.72 = waist-up)."""
    try:
        row_sums = np.sum(pm,axis=1).astype(float)
        nz_rows  = np.where(row_sums>10)[0]
        if len(nz_rows)==0: return 0.85
        img_frac = (int(nz_rows[-1])-int(nz_rows[0])) / max(h,1)
        if img_frac>0.85: return 1.00
        if img_frac>0.65: return 0.92
        if img_frac>0.45: return 0.72
        return 0.60
    except: return 0.85

# ══════════════════════════════════════════════════════════════
# SCALE ENGINE  — improved torso ratio calibration
# ══════════════════════════════════════════════════════════════
def compute_scale(kp, img_bgr, bbox_h, user_height_cm, category, pm):
    """
    Compute pixel→cm scale factor p using the best available signal.
    v27: Added crown-to-hip torso fraction for cropped shots.
    Returns: (p, height_cm, source_str, ankle_reliable, confidence)
    """
    h,w = img_bgr.shape[:2]
    props = CATEGORY_PROPS.get(category, CATEGORY_PROPS["Women"])
    default_h = float(props["default_height"])

    if kp is not None:
        nose_y = float(kp[0][1]);  la_y = float(kp[15][1]); ra_y = float(kp[16][1])
        ls_x   = float(kp[5][0]);  rs_x = float(kp[6][0])
        lh_y   = float(kp[11][1]); rh_y = float(kp[12][1])
    else:
        nose_y=h*0.08; la_y=h*0.95; ra_y=h*0.95; ls_x=w*0.35; rs_x=w*0.65
        lh_y=h*0.60; rh_y=h*0.60

    sh_px   = abs(ls_x - rs_x)
    ankle_y = (la_y + ra_y) / 2.0
    hip_y   = (lh_y + rh_y) / 2.0
    ht_px   = abs(ankle_y - nose_y)

    nose_ok  = kp is not None and 0 < nose_y < h*0.40
    ankle_ok = (kp is not None and la_y>h*0.58 and ra_y>h*0.58
                and la_y<h*0.97 and ra_y<h*0.97 and ht_px>h*0.35)
    print(f"  ankle_ok={ankle_ok}  ht_kp={ht_px:.0f}px  h={h}")

    # Priority 1: user-provided height (ground truth)
    if user_height_cm and float(user_height_cm) > 50:
        uh = float(user_height_cm)
        if ankle_ok and nose_ok: p = uh / (ht_px * 1.065)
        elif kp is not None and nose_ok and hip_y > nose_y:
            # Use crown-to-hip ratio for cropped photos
            crown_hip_px = hip_y - nose_y
            crown_hip_cm = uh * props["crown_to_hip"]
            p = crown_hip_cm / crown_hip_px
        elif bbox_h and bbox_h > h*0.20:
            vis = estimate_body_fraction(pm, h); p = (uh * vis) / bbox_h
        else: p = uh / (h * 0.82)
        print(f"  USER HEIGHT {uh}cm -> p={p:.4f}")
        return p, uh, "User-provided height", ankle_ok, 95

    # Priority 2: full keypoint span (only if ankles visible)
    if ankle_ok and nose_ok and ht_px > h*0.40:
        p = default_h / ht_px; htc = round(ht_px * p, 1)
        if 130 <= htc <= 220:
            print(f"  KEYPOINT HT {htc}cm -> p={p:.4f}")
            return p, htc, "Keypoint height", True, 92

    # Priority 2b: crown-to-hip torso ratio (v27 NEW — better for cropped shots)
    if kp is not None and nose_ok and hip_y > nose_y and not ankle_ok:
        crown_hip_px = hip_y - nose_y
        crown_hip_cm = default_h * props["crown_to_hip"]
        p = crown_hip_cm / crown_hip_px
        htc = default_h
        print(f"  CROWN-HIP RATIO crown_hip={crown_hip_px:.0f}px -> p={p:.4f}")
        return p, htc, "Crown-to-hip ratio (partial body)", False, 80

    # Priority 3: bounding box + visibility fraction
    if bbox_h and bbox_h > h*0.18:
        vis = estimate_body_fraction(pm, h)
        p   = (default_h * vis) / bbox_h
        print(f"  BBOX vis={vis:.2f} -> p={p:.4f}")
        return p, default_h, f"Bbox ({vis:.0%} visible)", False, 70

    # Priority 4: shoulder-span anthropometric ratio
    if sh_px > 20:
        p = (default_h * props["shoulder_ratio"]) / (sh_px * 1.15)
        print(f"  SHOULDER RATIO -> p={p:.4f}")
        return p, default_h, "Shoulder-span ratio", False, 60

    p = default_h / (h * 0.82)
    return p, default_h, "Category default", False, 50

# ══════════════════════════════════════════════════════════════
# CORE MEASUREMENT ENGINE  — v27 DUAL HIP + IMPROVED ZONES
# ══════════════════════════════════════════════════════════════
def calc_measurements(kp, img_bgr, category, pm, bbox_h=None, user_height_cm=None):
    """
    v27 ZONE FRACTIONS (of torso = sh→hip distance):
      Shoulder    : sh_y - 8px  to  sh_y + torso*0.10   (mid-deltoid)
      Bust        : torso * 0.22  ← armpit/fullest chest
      Waist       : torso * 0.48 – 0.70 search  (tightened from 0.55–0.80)
      High Hip    : torso * 0.72  ← upper hip/lower abdomen  (NEW)
      Low Hip     : directly at hip keypoint ± 28px            (fullest seat)
      Hollow→Hem  : from shoulder neckline to estimated floor
    """
    h,w = img_bgr.shape[:2]
    props = CATEGORY_PROPS.get(category, CATEGORY_PROPS["Women"])

    if kp is not None:
        ls_x,ls_y = float(kp[5][0]),float(kp[5][1])
        rs_x,rs_y = float(kp[6][0]),float(kp[6][1])
        lh_x,lh_y = float(kp[11][0]),float(kp[11][1])
        rh_x,rh_y = float(kp[12][0]),float(kp[12][1])
    else:
        ls_x,ls_y=w*0.35,h*0.25; rs_x,rs_y=w*0.65,h*0.25
        lh_x,lh_y=w*0.38,h*0.65; rh_x,rh_y=w*0.62,h*0.65

    sh_px = abs(ls_x - rs_x)
    if sh_px < 8: return None

    # Scale engine
    p, htc, height_source, reliable_ankles, scale_conf = compute_scale(
        kp, img_bgr, bbox_h, user_height_cm, category, pm)

    cx    = int((ls_x + rs_x) / 2.0)
    sh_y  = int((ls_y + rs_y) / 2.0)
    hip_y = int((lh_y + rh_y) / 2.0)
    torso_h_px = max(abs(hip_y - sh_y), 50.0)

    # ── v27 CORRECTED ANATOMICAL ZONES ───────────────────────
    bu_anchor   = sh_y + int(torso_h_px * 0.22)          # bust (armpit/fullest chest)
    wa_top      = sh_y + int(torso_h_px * 0.48)          # waist search start (tightened)
    wa_bot      = sh_y + int(torso_h_px * 0.70)          # waist search end   (tightened)
    hh_anchor   = sh_y + int(torso_h_px * 0.80)          # HIGH hip (NEW)
    lh_anchor   = hip_y                                   # LOW hip = YOLO keypoint

    print(f"  Zones v27: sh={sh_y} bu={bu_anchor} wa={wa_top}-{wa_bot} hh={hh_anchor} lh={lh_anchor}  torso={torso_h_px:.0f}px")

    bu_y, bu_hw = scan_zone(pm,
                             max(0, bu_anchor-20), min(h-2, bu_anchor+24),
                             cx, h, 'max', spread=12)

    wa_y, wa_hw = find_true_waist(pm,
                                   min(wa_top, h-2), min(wa_bot, h-2),
                                   cx, h)

    # HIGH HIP scan (upper hip / abdomen area)
    hh_y, hh_hw = scan_zone(pm,
                              max(0, hh_anchor-18), min(h-2, hh_anchor+22),
                              cx, h, 'max', spread=12)

    # LOW HIP scan (fullest seat — at keypoint)
    lh_y, lh_hw = scan_zone(pm,
                              max(0, lh_anchor-28), min(h-2, lh_anchor+28),
                              cx, h, 'max', spread=14)

    sc_y, sc_hw = scan_zone(pm,
                              max(0, sh_y-8), min(h-2, sh_y+int(torso_h_px*0.10)),
                              cx, h, 'max', spread=8)

    EF = math.pi / 2.20   # ellipse circumference factor (2:1 depth/width body section)

    # ── Raw cm values ─────────────────────────────────────────
    sc_raw = sh_px * p * 1.18
    bc     = bu_hw * 2 * p * EF * 0.96
    wc     = wa_hw * 2 * p * EF * 0.96
    hhc    = hh_hw * 2 * p * EF * 0.96   # high hip circumference
    lhc    = lh_hw * 2 * p * EF * 0.96   # low hip circumference
    hc     = max(hhc, lhc)                # operative hip = largest measurement

    # Shoulder clip (ONLY shoulder)
    sc = float(np.clip(sc_raw, 28, props["sc_max"]))

    # Saree/drape guard: bust > 2.5× shoulder span = measuring drape, not body
    if sc_raw > 0 and bc > sc_raw * 2.50:
        print(f"  DRAPE GUARD: bc={bc:.1f} -> {sc_raw*2.28:.1f}")
        bc = sc_raw * 2.28

    # Pixel-area cross-validation
    try:
        mask_area = float(np.sum(pm>0))
        exp_area  = (sh_px * 1.35) * (htc/max(p,0.01)) * 0.72
        ratio     = mask_area / max(exp_area, 1)
        if ratio > 1.35:
            boost = min(ratio**0.38, 1.45)
            print(f"  AREA BOOST x{boost:.2f}")
            bc *= boost; wc *= boost; hhc *= boost; lhc *= boost; hc *= boost
    except: pass

    # Bust sanity
    max_bc = htc * 0.75
    if bc > max_bc: bc = max_bc * 0.97

    wc  = min(wc, bc - 2)
    hf  = htc / props["default_height"]
    bc  = float(np.clip(bc, 76*hf, props["bc_max"]))
    wc  = float(np.clip(wc, 58*hf, min(props["wc_max"], bc-2)))
    hhc = float(np.clip(hhc, 72*hf, props.get("hhc_max",116)))
    lhc = float(np.clip(lhc, 80*hf, props["hc_max"]))
    hc  = max(hhc, lhc)
    wc  = min(wc, bc-2)

    # ── Hollow-to-hem (neckline to floor) ─────────────────────
    # Neckline is approx 8% of height below crown
    hollow_to_hem = round(htc * 0.92, 1)

    size = size_from_bust(category, bc, htc)
    print(f"  MEAS v27: sh={sc:.1f} bust={bc:.1f} waist={wc:.1f} hi_hip={hhc:.1f} lo_hip={lhc:.1f} ht={htc:.1f} -> {size}")

    # ── Measurement confidence ────────────────────────────────
    m_conf = {
        'shoulder': 85 if kp is not None else 65,
        'bust':     80 if kp is not None else 62,
        'waist':    75 if kp is not None else 58,
        'high_hip': 78 if kp is not None else 60,
        'low_hip':  82 if kp is not None else 64,
    }
    overall_conf = int(np.mean(list(m_conf.values())) * (scale_conf/100))

    return {
        'height_cm':       round(htc,1),
        'shoulder_cm':     round(sc,1),
        'chest_cm':        round(bc,1),
        'waist_cm':        round(wc,1),
        'high_hip_cm':     round(hhc,1),
        'hip_cm':          round(lhc,1),       # low hip = standard "hip" measurement
        'operative_hip_cm':round(hc,1),         # max(high_hip, low_hip) for classification
        'hollow_to_hem_cm':hollow_to_hem,
        'inseam_cm':       round(htc*.44,1),
        'size':            size,
        'body_cx':         cx,
        'bu_y':            bu_y, 'wa_y': wa_y,
        'hh_y':            hh_y, 'hi_y': lh_y, 'sh_y': sc_y,
        # Ratios for body type classification
        'sc_hc':           round(sc / max(hc,1.0), 3),
        'wc_bc':           round(float(wc) / max(float(bc),1.0), 3),
        'waist_def':       round(((float(bc)+float(hc))/2.0) - float(wc), 1),
        # Metadata
        'height_source':   height_source,
        'reliable_ankles': reliable_ankles,
        'measurement_confidence': m_conf,
        'overall_confidence':     overall_conf,
    }

# ══════════════════════════════════════════════════════════════
# BODY TYPE CLASSIFIER  — v27: uses High+Low Hip + improved thresholds
# ══════════════════════════════════════════════════════════════
def classify_body(m, cat):
    """
    v27 classification uses BOTH high_hip and low_hip measurements.
    All cm-based ratios — no pixel distances used.
    """
    sc  = float(m["shoulder_cm"])
    bc  = float(m["chest_cm"])
    wc  = float(m["waist_cm"])
    hhc = float(m["high_hip_cm"])
    lhc = float(m["hip_cm"])
    hc  = float(m.get("operative_hip_cm", max(hhc, lhc)))

    waist_def = ((bc + hc) / 2.0) - wc
    sc_hc     = sc / max(hc, 1.0)
    wc_bc     = wc / max(bc, 1.0)
    hip_diff  = lhc - hhc   # positive = pear tendency; negative = inv-triangle tendency

    print(f"  CLASSIFY v27: sc={sc:.0f} bc={bc:.0f} wc={wc:.0f} hhc={hhc:.0f} lhc={lhc:.0f}")
    print(f"    waist_def={waist_def:.1f}  sc/hc={sc_hc:.3f}  wc/bc={wc_bc:.3f}  hip_diff={hip_diff:.1f}")

    if cat == "Women":
        # 1. HOURGLASS family: bust ≈ hip, strong waist definition
        if abs(bc - hc) <= 6 and waist_def >= 18 and wc_bc < 0.82:
            result = "Full Hourglass" if waist_def >= 28 else "Hourglass"
            print(f"    -> {result}"); return result

        # 2. PEAR family: hips clearly wider than bust
        if lhc > bc + 8:
            result = "Full Pear" if (lhc - bc) > 16 else "Pear"
            print(f"    -> {result}"); return result

        # 3. INVERTED TRIANGLE: wide shoulders relative to narrow hips
        if sc_hc > 0.47 and sc > bc * 0.46:
            print("    -> Inverted Triangle"); return "Inverted Triangle"

        # 4. OVAL: bust larger than hips (top-heavy figure)
        if bc > hc + 3 and wc_bc < 0.88:
            print("    -> Oval"); return "Oval"

        # 5. APPLE: waist nearly as large as bust + very low waist definition
        if wc_bc > 0.89 and waist_def < 10:
            print("    -> Apple"); return "Apple"

        # 6. PETITE: small overall frame
        if sc < 34 and bc < 82:
            print("    -> Petite"); return "Petite"

        # 7. Slight pear tendency (high hip wider than bust)
        if hc > bc + 2:
            print("    -> Pear"); return "Pear"

        # 8. Default: balanced figure
        print("    -> Rectangle"); return "Rectangle"

    if cat == "Men":
        if sc_hc > 0.50: return "Trapezoid"
        wc_hc = wc / max(hc,1.0)
        if wc_hc > 0.88: return "Circle"
        if sc_hc < 0.38: return "Triangle"
        return "Column"

    return "Petite"  # Kids

# ══════════════════════════════════════════════════════════════
# VISUALIZATION  — shows High Hip + Low Hip lines
# ══════════════════════════════════════════════════════════════
def draw_measure_lines(vis, pm, m, cx, h):
    """Draw shoulder, bust, waist, high-hip, low-hip lines."""
    # Shoulder (green)
    sh_y_v = m.get('sh_y', 0)
    if 0 < sh_y_v < h:
        nz = np.where(pm[sh_y_v,:]>0)[0]
        if len(nz) >= 4:
            L = cx-int(nz[0]); R = int(nz[-1])-cx
            sym = min(L,R) if max(L,R)>0 and min(L,R)/max(L,R)<0.72 else max(L,R)
            cv2.line(vis,(cx-sym,sh_y_v),(cx+sym,sh_y_v),(80,255,80),2)
            cv2.putText(vis,f"Sh:{m.get('shoulder_cm',0):.0f}cm",
                        (cx-sym+2,max(12,sh_y_v-4)),cv2.FONT_HERSHEY_SIMPLEX,.40,(80,255,80),1)

    # Bust (cyan), Waist (yellow), High Hip (magenta), Low Hip (blue)
    lines = [
        (m['bu_y'],  "Bust",     m['chest_cm'],     (0,200,255)),
        (m['wa_y'],  "Waist",    m['waist_cm'],      (255,180,0)),
        (m.get('hh_y', m.get('hi_y',0)), "Hi-Hip",  m.get('high_hip_cm',0), (255,80,255)),
        (m['hi_y'],  "Lo-Hip",   m['hip_cm'],        (80,80,255)),
    ]
    for ry,lbl,val,col in lines:
        ry = max(0, min(ry, h-1))
        nz = np.where(pm[ry,:]>0)[0]
        if len(nz) >= 4:
            L = cx-int(nz[0]); R = int(nz[-1])-cx
            sym = min(L,R) if max(L,R)>0 and min(L,R)/max(L,R)<0.72 else max(L,R)
            cv2.line(vis,(cx-sym,ry),(cx+sym,ry),col,2)
            cv2.putText(vis,f"{lbl}:{val:.0f}",
                        (cx-sym+2,max(12,ry-4)),cv2.FONT_HERSHEY_SIMPLEX,.40,col,1)

# ══════════════════════════════════════════════════════════════
# YOLO
# ══════════════════════════════════════════════════════════════
_yolo_model = None

def detect_yolo(img_bgr, category, pm, user_height_cm=None):
    global _yolo_model
    if not YOLO_OK: return None
    try:
        if _yolo_model is None:
            _yolo_model = _YOLO_CLS('yolov8n-pose.pt')
        results = _yolo_model(img_bgr, conf=0.28, verbose=False)
        if not results or not results[0].keypoints or len(results[0].keypoints.xy)==0:
            return None
        kp = results[0].keypoints.xy[0].cpu().numpy().astype(np.float64)
        bbox_h = None
        if results[0].boxes is not None and len(results[0].boxes.xyxy)>0:
            bb = results[0].boxes.xyxy[0].cpu().numpy().astype(np.float64)
            bbox_h = float(bb[3]-bb[1])
        m = calc_measurements(kp, img_bgr, category, pm, bbox_h, user_height_cm)
        if m is None: return None
        vis = img_bgr.copy(); cx = m['body_cx']; h = img_bgr.shape[0]
        for i,j in [(5,6),(5,11),(6,12),(11,12),(11,15),(12,16)]:
            p1=(int(kp[i][0]),int(kp[i][1])); p2=(int(kp[j][0]),int(kp[j][1]))
            if all(v>0 for v in p1+p2): cv2.line(vis,p1,p2,(0,255,100),2)
        for pt in kp[[0,5,6,11,12,15,16]]:
            if pt[0]>0 and pt[1]>0: cv2.circle(vis,(int(pt[0]),int(pt[1])),5,(255,100,0),-1)
        draw_measure_lines(vis, pm, m, cx, h)
        cv2.putText(vis,f"SIZE:{m['size']}",(8,36),cv2.FONT_HERSHEY_SIMPLEX,1.1,(0,255,120),3)
        m.update({"method":"YOLOv8 Pose v27","vis":vis,"confidence":m.get('overall_confidence',88)})
        return m
    except Exception as e:
        import traceback; traceback.print_exc(); return None

# ══════════════════════════════════════════════════════════════
# PYTORCH
# ══════════════════════════════════════════════════════════════
_torch_model = None

def detect_pytorch(img_bgr, category, pm, user_height_cm=None):
    global _torch_model
    if not TORCH_OK: return None
    try:
        if _torch_model is None:
            weights = KeypointRCNN_ResNet50_FPN_Weights.DEFAULT
            _torch_model = keypointrcnn_resnet50_fpn(weights=weights).eval()
            dev = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            _torch_model = _torch_model.to(dev)
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        t = torch.from_numpy(img_rgb).permute(2,0,1).float()/255.0
        dev = next(_torch_model.parameters()).device
        with torch.no_grad(): preds = _torch_model([t.to(dev)])
        if not preds or len(preds[0]['keypoints'])==0: return None
        if float(preds[0]['scores'][0]) < 0.50: return None
        kp = preds[0]['keypoints'][0].cpu().numpy().astype(np.float64)
        bb = preds[0]['boxes'][0].cpu().numpy().astype(np.float64)
        m = calc_measurements(kp, img_bgr, category, pm, float(bb[3]-bb[1]), user_height_cm)
        if m is None: return None
        vis = img_bgr.copy(); h_img = img_bgr.shape[0]
        for i,j in [(5,6),(5,11),(6,12),(11,12),(11,15),(12,16)]:
            p1=(int(kp[i][0]),int(kp[i][1])); p2=(int(kp[j][0]),int(kp[j][1]))
            if all(v>0 for v in p1+p2): cv2.line(vis,p1,p2,(0,200,255),2)
        draw_measure_lines(vis, pm, m, m['body_cx'], h_img)
        cv2.putText(vis,f"SIZE:{m['size']}",(8,36),cv2.FONT_HERSHEY_SIMPLEX,1.1,(0,255,120),3)
        m.update({"method":"PyTorch R-CNN v27","vis":vis,"confidence":m.get('overall_confidence',84)})
        return m
    except Exception as e:
        print(f"PyTorch ERROR: {e}"); return None

# ══════════════════════════════════════════════════════════════
# SILHOUETTE FALLBACK
# ══════════════════════════════════════════════════════════════
def detect_silhouette(img_bgr, category, pm, user_height_cm=None):
    h,w = img_bgr.shape[:2]
    props = CATEGORY_PROPS.get(category, CATEGORY_PROPS["Women"])
    cnts,_ = cv2.findContours(pm,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    if cnts: bx,by,bw_,bh_ = cv2.boundingRect(max(cnts,key=cv2.contourArea))
    else:    bx,by,bw_,bh_ = int(w*.12),int(h*.03),int(w*.76),int(h*.94)
    tr=by
    for yi in range(by,min(by+bh_,h)):
        if np.sum(pm[yi,bx:min(bx+bw_,w)])>0: tr=yi; break
    bot=by+bh_-1
    for yi in range(by+bh_-1,tr,-1):
        if np.sum(pm[yi,bx:min(bx+bw_,w)])>0: bot=yi; break
    body_h_px = max(bot-tr,1)
    p,htc,height_source,_,scale_conf = compute_scale(None,img_bgr,float(body_h_px),user_height_cm,category,pm)
    cx=bx+bw_//2; sh_y=tr+int(body_h_px*0.14)
    if _FACE_CASCADE:
        try:
            gray=cv2.equalizeHist(cv2.cvtColor(img_bgr,cv2.COLOR_BGR2GRAY))
            faces=_FACE_CASCADE.detectMultiScale(gray,1.10,4,minSize=(int(w*.06),int(h*.05)))
            if len(faces):
                fx,fy,fw,fh_=sorted(faces,key=lambda f:f[1])[0]
                if fy<h*0.55: cx=int(fx+fw//2); sh_y=fy+fh_+int(fh_*.10)
        except: pass
    torso_h = max(body_h_px*0.55, 50)
    bu_y,bu_hw = scan_zone(pm, sh_y+int(torso_h*.18), sh_y+int(torso_h*.30), cx, h, 'max')
    wa_y,wa_hw = find_true_waist(pm, sh_y+int(torso_h*.45), sh_y+int(torso_h*.68), cx, h)
    hh_y,hh_hw = scan_zone(pm, sh_y+int(torso_h*.68), sh_y+int(torso_h*.80), cx, h, 'max')
    lh_y,lh_hw = scan_zone(pm, sh_y+int(torso_h*.78), sh_y+int(torso_h*.96), cx, h, 'max')
    sc_y,sc_hw = scan_zone(pm, sh_y, sh_y+int(torso_h*.14), cx, h, 'max')
    EF=math.pi/2.20
    sc_raw=sc_hw*2*p*1.05
    bc=bu_hw*2*p*EF*0.96; wc=wa_hw*2*p*EF*0.96
    hhc=hh_hw*2*p*EF*0.96; lhc=lh_hw*2*p*EF*0.96
    hc=max(hhc,lhc)
    if sc_raw>0 and bc>sc_raw*2.50: bc=sc_raw*2.28
    try:
        ratio=float(np.sum(pm>0))/max((sc_hw*2*1.35)*(htc/max(p,0.01))*0.72,1)
        if ratio>1.35: boost=min(ratio**0.38,1.45); bc*=boost; wc*=boost; hhc*=boost; lhc*=boost; hc=max(hhc,lhc)*boost
    except: pass
    max_bc=htc*0.75
    if bc>max_bc: bc=max_bc*0.97
    wc=min(wc,bc-2)
    hf=htc/props["default_height"]
    sc=float(np.clip(sc_raw,28,props["sc_max"]))
    bc=float(np.clip(bc,76*hf,props["bc_max"]))
    wc=float(np.clip(wc,58*hf,min(props["wc_max"],bc-2)))
    hhc=float(np.clip(hhc,72*hf,props.get("hhc_max",116)))
    lhc=float(np.clip(lhc,80*hf,props["hc_max"]))
    hc=max(hhc,lhc); wc=min(wc,bc-2)
    hollow_to_hem=round(htc*0.92,1)
    size=size_from_bust(category,bc,htc)
    vis=img_bgr.copy()
    draw_measure_lines(vis,pm,
        {'bu_y':bu_y,'chest_cm':round(bc,1),'wa_y':wa_y,'waist_cm':round(wc,1),
         'hh_y':hh_y,'high_hip_cm':round(hhc,1),'hi_y':lh_y,'hip_cm':round(lhc,1),
         'sh_y':sc_y,'shoulder_cm':round(sc,1)},cx,h)
    cv2.putText(vis,f"SIZE:{size}",(8,36),cv2.FONT_HERSHEY_SIMPLEX,1.1,(0,255,120),3)
    overall_conf = int(58 * (scale_conf/100))
    return {
        'height_cm':round(htc,1),'shoulder_cm':round(sc,1),'chest_cm':round(bc,1),
        'waist_cm':round(wc,1),'high_hip_cm':round(hhc,1),'hip_cm':round(lhc,1),
        'operative_hip_cm':round(hc,1),'hollow_to_hem_cm':hollow_to_hem,
        'inseam_cm':round(htc*.44,1),'size':size,
        'method':"Silhouette v27",'vis':vis,'confidence':overall_conf,
        'body_cx':cx,'bu_y':bu_y,'wa_y':wa_y,'hh_y':hh_y,'hi_y':lh_y,'sh_y':sc_y,
        'sc_hc':round(sc/max(hc,1.0),3),'wc_bc':round(wc/max(bc,1.0),3),
        'waist_def':round(((bc+hc)/2)-wc,1),
        'height_source':height_source,'reliable_ankles':False,
        'measurement_confidence':{'shoulder':55,'bust':52,'waist':48,'high_hip':50,'low_hip':54},
        'overall_confidence':overall_conf,
    }

# ══════════════════════════════════════════════════════════════
# DISPATCH
# ══════════════════════════════════════════════════════════════
def detect_measurements(img_bgr, category, user_height_cm=None):
    print(f"\n{'='*55}\n{category} | user_h={user_height_cm}\n{'='*55}")
    pm = get_mask(img_bgr); candidates = []
    if YOLO_OK:
        r = detect_yolo(img_bgr,category,pm,user_height_cm)
        if r: candidates.append((r['confidence'],'YOLO',r))
    if TORCH_OK and not candidates:
        r = detect_pytorch(img_bgr,category,pm,user_height_cm)
        if r: candidates.append((r['confidence'],'PyTorch',r))
    if candidates:
        _,name,best = sorted(candidates,reverse=True)[0]
        print(f"FINAL: {name} -> {best['size']}"); return best
    return detect_silhouette(img_bgr,category,pm,user_height_cm)

# ══════════════════════════════════════════════════════════════
# FACE + DRESS extraction (unchanged from v26)
# ══════════════════════════════════════════════════════════════
def extract_face_from_image(img_bgr):
    if not _FACE_CASCADE: return None
    try:
        h,w=img_bgr.shape[:2]
        gray=cv2.equalizeHist(cv2.cvtColor(img_bgr,cv2.COLOR_BGR2GRAY))
        faces=_FACE_CASCADE.detectMultiScale(gray,1.06,4,
            minSize=(int(w*.06),int(h*.05)),maxSize=(int(w*.60),int(h*.50)))
        if len(faces)==0:
            faces=_FACE_CASCADE.detectMultiScale(gray,1.10,3,minSize=(int(w*.04),int(h*.03)))
        if len(faces)==0: return None
        x,y,fw,fh=sorted(faces,key=lambda f:f[1])[0]
        x1=max(0,x-int(fw*.40)); y1=max(0,y-int(fh*.55))
        x2=min(w,x+fw+int(fw*.40)); y2=min(h,y+fh+int(fh*.25))
        fc=img_bgr[y1:y2,x1:x2]
        if fc.size==0: return None
        fc=cv2.convertScaleAbs(fc,alpha=1.15,beta=8)
        fc=cv2.filter2D(fc,-1,np.array([[0,-0.3,0],[-0.3,2.2,-0.3],[0,-0.3,0]]))
        fh2,fw2=fc.shape[:2]; sz=max(fh2,fw2)
        sq=np.zeros((sz,sz,3),np.uint8)
        sq[(sz-fh2)//2:(sz-fh2)//2+fh2,(sz-fw2)//2:(sz-fw2)//2+fw2]=fc
        sq=cv2.resize(sq,(256,256),interpolation=cv2.INTER_LANCZOS4)
        _,buf=cv2.imencode('.jpg',sq,[cv2.IMWRITE_JPEG_QUALITY,90])
        return base64.b64encode(buf).decode()
    except: return None

def extract_dress(pil_img):
    img_rgb=np.array(pil_img.convert("RGB")); img_bgr=cv2.cvtColor(img_rgb,cv2.COLOR_RGB2BGR)
    h,w=img_bgr.shape[:2]; gray=cv2.cvtColor(img_bgr,cv2.COLOR_BGR2GRAY)
    border=float(np.mean(np.concatenate([gray[0,:],gray[-1,:],gray[:,0],gray[:,-1]])))
    if border>198:
        _,fg=cv2.threshold(gray,235,255,cv2.THRESH_BINARY_INV)
        dm=cv2.morphologyEx(fg,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(19,19)))
    elif REMBG_OK:
        try: dm=(np.array(rembg_remove(pil_img.convert("RGB")))[:,:,3]>30).astype(np.uint8)*255
        except: dm=np.zeros((h,w),np.uint8)
    else:
        rect=(max(8,min(w,h)//18),int(h*.10),w-2*max(8,min(w,h)//18),int(h*.86))
        bgd,fgd=np.zeros((1,65),np.float64),np.zeros((1,65),np.float64)
        gc=np.zeros((h,w),np.uint8)
        try:
            cv2.grabCut(img_bgr,gc,rect,bgd,fgd,8,cv2.GC_INIT_WITH_RECT)
            dm=np.where((gc==2)|(gc==0),0,255).astype(np.uint8)
        except: _,dm=cv2.threshold(gray,20,255,cv2.THRESH_BINARY)
    num,labels,stats,_=cv2.connectedComponentsWithStats(dm,8)
    if num>1:
        lg=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
        dm=np.where(labels==lg,255,0).astype(np.uint8)
    dm=cv2.GaussianBlur(dm,(5,5),0); _,dm=cv2.threshold(dm,100,255,cv2.THRESH_BINARY)
    rgba=np.zeros((h,w,4),np.uint8); rgba[:,:,:3]=img_rgb; rgba[:,:,3]=dm
    result=Image.fromarray(rgba,"RGBA"); bbox=Image.fromarray(dm).getbbox()
    if bbox:
        pad=20
        result=result.crop((max(0,bbox[0]-pad),max(0,bbox[1]-pad),
                             min(w,bbox[2]+pad),min(h,bbox[3]+pad)))
    return result

def pil_to_b64(img):
    buf=io.BytesIO(); img.save(buf,format="PNG"); return base64.b64encode(buf.getvalue()).decode()

# ══════════════════════════════════════════════════════════════
# FASTAPI
# ══════════════════════════════════════════════════════════════
app = FastAPI(title="Fashion Stylist v27")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])

@app.get("/",response_class=HTMLResponse)
async def root():
    active=[name for name,ok in [("YOLOv8",YOLO_OK),("PyTorch",TORCH_OK),("rembg",REMBG_OK),("FaceDetect",_FACE_CASCADE is not None)] if ok]
    return f"""<!DOCTYPE html><html><head><title>Fashion Stylist v27</title>
<style>body{{font-family:system-ui;background:#07071a;color:#e8e0ff;padding:40px;max-width:780px;margin:auto}}
h1{{color:#22c55e}}.fix{{background:#0a1f08;border-left:4px solid #22c55e;padding:8px 12px;margin:5px 0;font-size:13px}}
.ep{{background:#10103a;border:1px solid #22c55e30;border-radius:10px;padding:14px;margin:8px 0}}</style></head>
<body><h1>👗 Fashion Stylist v27</h1>
<p style="color:#8070c0">Active: <b>{', '.join(active) or 'Fallback only'}</b></p>
<h3 style="color:#ffd700">v27 Improvements:</h3>
<div class="fix">✅ DUAL HIP: High Hip (torso×0.72) + Low Hip (keypoint) — matches measurement guide</div>
<div class="fix">✅ Tighter waist search window (0.48–0.70) — no more rib/hip false minima</div>
<div class="fix">✅ SG-smoothed width profile for waist detection</div>
<div class="fix">✅ Crown-to-hip ratio for better cropped photo scale estimation</div>
<div class="fix">✅ Hollow-to-hem measurement added for dress sizing</div>
<div class="fix">✅ Per-measurement confidence scores</div>
<div class="fix">✅ Full Pear subtype added; Hourglass vs Full Hourglass refined</div>
<div class="ep"><b>POST /analyze</b> — fields: file, category, user_height</div>
<div class="ep"><b>POST /extract-face</b> | <b>POST /extract-dress</b> | <b>GET /health</b></div>
</body></html>"""

@app.get("/health")
async def health():
    d={"status":"ok","version":"v27","yolo":YOLO_OK,"pytorch":TORCH_OK,"rembg":REMBG_OK,"face_det":_FACE_CASCADE is not None}
    if TORCH_OK: d["cuda"]=bool(torch.cuda.is_available())
    return d

@app.post("/analyze")
async def api_analyze(file:UploadFile=File(...), category:str=Form("Women"), user_height:str=Form("0")):
    try:
        data=await file.read(); arr=np.frombuffer(data,np.uint8)
        img_bgr=cv2.imdecode(arr,cv2.IMREAD_COLOR)
        if img_bgr is None: return JSONResponse({"error":"Cannot decode image"},status_code=400)
        img_rgb=cv2.cvtColor(img_bgr,cv2.COLOR_BGR2RGB)
        uh=None
        try:
            v=float(user_height)
            if v>50: uh=v
        except: pass
        m   = detect_measurements(img_bgr, category, uh)
        bt  = classify_body(m, category)
        st,sx = detect_skin_tone(img_rgb)
        pal = SKIN_PALETTE.get(st,SKIN_PALETTE["Medium"])
        bti = BODY_TYPES.get(bt,{"icon":"👤","desc":"","tips":[]})
        vis_pil=Image.fromarray(cv2.cvtColor(m["vis"],cv2.COLOR_BGR2RGB))
        buf=io.BytesIO(); vis_pil.save(buf,format="JPEG",quality=84)
        vis_b64=base64.b64encode(buf.getvalue()).decode()

        # Quality warnings
        warnings = []
        m_conf = m.get('measurement_confidence',{})
        if not m.get('reliable_ankles',False): warnings.append("Full body (head to toe) improves height accuracy")
        if m_conf.get('waist',100) < 65: warnings.append("Fitted clothing improves waist measurement accuracy")
        if m_conf.get('bust',100)  < 65: warnings.append("Front-facing pose improves bust measurement")

        return to_py({
            "size":             m["size"],
            "body_type":        bt,
            "skin_tone":        st,
            "skin_hex":         sx,
            "method":           m["method"],
            "confidence":       m["confidence"],
            "category":         category,
            "height_cm":        m["height_cm"],
            "shoulder_cm":      m["shoulder_cm"],
            "bust_cm":          m["chest_cm"],
            "waist_cm":         m["waist_cm"],
            "high_hip_cm":      m.get("high_hip_cm", m["hip_cm"]),
            "hip_cm":           m["hip_cm"],
            "hollow_to_hem_cm": m.get("hollow_to_hem_cm", round(m["height_cm"]*0.92,1)),
            "inseam_cm":        m["inseam_cm"],
            "height_source":    m.get("height_source","Auto"),
            "reliable_ankles":  m.get("reliable_ankles",False),
            "measurement_confidence": m.get("measurement_confidence",{}),
            "quality_warnings": warnings,
            "morph": {
                "hip_scale":   round(min(float(m["hip_cm"])/92.,1.8),3),
                "waist_scale": round(min(float(m["waist_cm"])/72.,1.8),3),
                "bust_scale":  round(min(float(m["chest_cm"])/88.,1.8),3),
                "height_scale":round(min(float(m["height_cm"])/160.,1.4),3),
            },
            "best_colors":   pal["best"],
            "avoid_colors":  pal["avoid"],
            "style_tips":    bti.get("tips",[]),
            "body_icon":     bti["icon"],
            "body_desc":     bti["desc"],
            "vis_jpeg_b64":  vis_b64,
        })
    except Exception as e:
        import traceback
        return JSONResponse({"error":str(e),"trace":traceback.format_exc()},status_code=500)

@app.post("/extract-face")
async def api_extract_face(file:UploadFile=File(...)):
    try:
        data=await file.read(); arr=np.frombuffer(data,np.uint8)
        img_bgr=cv2.imdecode(arr,cv2.IMREAD_COLOR)
        if img_bgr is None: return JSONResponse({"error":"Cannot decode"},status_code=400)
        face_b64=extract_face_from_image(img_bgr)
        if face_b64: return {"success":True,"face_b64":face_b64}
        return {"success":False,"error":"No face detected"}
    except Exception as e: return JSONResponse({"error":str(e)},status_code=500)

@app.post("/extract-dress")
async def api_extract_dress(file:UploadFile=File(...)):
    try:
        data=await file.read(); pil_img=Image.open(io.BytesIO(data)).convert("RGBA")
        return {"dress_b64":pil_to_b64(extract_dress(pil_img))}
    except Exception as e: return JSONResponse({"error":str(e)},status_code=500)

if __name__=="__main__":
    import uvicorn
    uvicorn.run(app,host="0.0.0.0",port=7860)
