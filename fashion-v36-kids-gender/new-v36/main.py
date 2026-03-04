"""
Fashion Stylist v28 — BODY ANALYSIS FOCUSED
═══════════════════════════════════════════
✅ 16 Body Types classification
✅ Shoulder, Bust, Waist, High Hip, Low Hip, Arm Length measurements
✅ Size XS to XXXL (Indian standard)
✅ Skin tone detection (Fair/Light/Medium/Tan/Deep/Olive)
✅ Color recommendations per skin tone
✅ Dress recommendations by body type + skin tone + size
✅ 2D Virtual Try-On endpoint
═══════════════════════════════════════════
"""
import numpy as np, cv2, math, base64, io, statistics
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from typing import Optional
import json

print("=" * 70)
print("Fashion Stylist v28 — BODY ANALYSIS + 16 BODY TYPES")
print("=" * 70)

TORCH_OK = YOLO_OK = REMBG_OK = False
try:
    import torch
    TORCH_OK = True
    print("✅ PyTorch OK")
except:
    print("⚠️  PyTorch unavailable")

try:
    from ultralytics import YOLO as _YOLO_CLS
    YOLO_OK = True
    print("✅ YOLOv8 OK")
except:
    print("⚠️  YOLOv8 unavailable")

try:
    from rembg import remove as rembg_remove
    REMBG_OK = True
    print("✅ rembg OK")
except:
    print("⚠️  rembg unavailable")

_FACE_CASCADE = None
try:
    _fc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    if not _fc.empty():
        _FACE_CASCADE = _fc
        print("✅ Face detector OK")
except:
    pass

print("=" * 70)


def to_py(obj):
    if isinstance(obj, dict): return {k: to_py(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)): return [to_py(i) for i in obj]
    if isinstance(obj, np.ndarray): return obj.tolist()
    if isinstance(obj, np.floating): return float(obj)
    if isinstance(obj, np.integer): return int(obj)
    if isinstance(obj, np.bool_): return bool(obj)
    return obj


# ══════════════════════════════════════════════════════════════
# SIZE CHARTS (Indian Standard)
# ══════════════════════════════════════════════════════════════
WOMEN_SIZE_CHART = [(80, "XS"), (85, "S"), (91, "M"), (97, "L"), (103, "XL"), (108, "XXL"), (116, "XXXL")]
MEN_SIZE_CHART   = [(91, "S"),  (97, "M"), (103, "L"), (109, "XL"), (115, "XXL"), (121, "XXXL")]

CATEGORY_PROPS = {
    "Women": {"default_height": 162, "sc_max": 48, "bc_max": 108, "wc_max": 100, "hc_max": 116},
    "Men":   {"default_height": 175, "sc_max": 58, "bc_max": 122, "wc_max": 112, "hc_max": 120},
    "Kids":  {"default_height": 115, "sc_max": 38, "bc_max": 70,  "wc_max": 64,  "hc_max": 72},
}


def size_from_bust(cat, bust_cm, height_cm=None):
    bust_cm = float(bust_cm)
    if cat == "Kids":
        h = float(height_cm or 100)
        for t, s in [(92, "2Y"), (100, "3Y"), (108, "4Y"), (115, "5Y"), (120, "6Y"), (125, "7Y"), (130, "8Y+")]:
            if h <= t: return s
        return "8Y+"
    tbl = MEN_SIZE_CHART if cat == "Men" else WOMEN_SIZE_CHART
    for t, s in tbl:
        if bust_cm <= t: return s
    return "4XL"


# ══════════════════════════════════════════════════════════════
# 16 BODY TYPE CLASSIFICATION
# ══════════════════════════════════════════════════════════════
def classify_body_type_16(shoulder_cm, bust_cm, waist_cm, hip_cm, height_cm, category):
    """
    Classify into 16 body types based on measurements.
    Uses shoulder-bust-waist-hip ratios.
    """
    sh = float(shoulder_cm or 40)
    bu = float(bust_cm or 88)
    wa = float(waist_cm or 72)
    hi = float(hip_cm or 94)
    ht = float(height_cm or 162)

    # Core ratios
    waist_to_hip = wa / hi if hi > 0 else 0.8
    bust_to_hip  = bu / hi if hi > 0 else 0.95
    shoulder_to_hip = sh / hi if hi > 0 else 0.8
    waist_drop = hi - wa  # larger = more defined waist
    bust_hip_diff = abs(bu - hi)

    if category == "Kids":
        return "Petite"

    if category == "Men":
        # Men's body types
        sh_to_wa = sh / wa if wa > 0 else 1.0
        if sh_to_wa > 1.30 and waist_to_hip < 0.85:
            return "Trapezoid"
        elif sh_to_wa > 1.15:
            return "Inverted Triangle"
        elif waist_to_hip > 0.95:
            return "Oval"
        elif bust_hip_diff < 6 and waist_drop < 10:
            return "Rectangle"
        else:
            return "Lean Column"

    # Women's body types (11 types)
    if ht < 158:
        return "Petite"

    if ht > 174:
        # Tall body type - override if very tall
        if bust_hip_diff < 5 and waist_drop < 12:
            return "Tall"

    # Hourglass family
    if waist_drop >= 25 and bust_hip_diff <= 5 and waist_to_hip <= 0.75:
        if bu > 100 or hi > 105:
            return "Full Hourglass"
        return "Hourglass"

    # Apple/Oval — wide midsection
    if waist_to_hip >= 0.90 and bu >= hi:
        return "Apple (Round)"

    if waist_to_hip >= 0.88:
        return "Oval"

    # Pear — hips significantly wider than bust/shoulders
    if hi - bu >= 10 and hi - sh >= 12:
        if waist_to_hip < 0.80:
            return "Spoon"
        return "Pear (Triangle)"

    # Inverted Triangle — shoulders/bust wider than hips
    if bu - hi >= 10 or sh - hi >= 8:
        if bu > 100:
            return "Lollipop"
        return "Inverted Triangle"

    if sh > hi + 6:
        return "Skittle"

    # Diamond — wider in middle
    if bu > sh and bu > hi and waist_drop < 15:
        return "Diamond"

    # Athletic — muscular proportions
    if waist_drop >= 15 and bust_hip_diff <= 6 and bu >= 85:
        return "Athletic"

    # Rectangle/Column
    if bust_hip_diff <= 5 and waist_drop <= 12:
        if bu < 84:
            return "Lean Column"
        return "Rectangle"

    # Default
    return "Rectangle"


# ══════════════════════════════════════════════════════════════
# SKIN TONE DETECTION
# ══════════════════════════════════════════════════════════════
def detect_skin_tone(rgb_np):
    h, w = rgb_np.shape[:2]
    face = rgb_np[int(h * .04):int(h * .22), int(w * .25):int(w * .75)]
    if face.size == 0: face = rgb_np[:h // 6]

    r_mean = float(np.mean(face[:, :, 0]))
    g_mean = float(np.mean(face[:, :, 1]))
    b_mean = float(np.mean(face[:, :, 2]))

    # ITA (Individual Typology Angle) approximation
    brightness = r_mean * 0.299 + g_mean * 0.587 + b_mean * 0.114
    redness_ratio = r_mean / (g_mean + 1)

    # Olive detection: high green component relative to red
    if 0.80 < redness_ratio < 1.05 and brightness > 110 and brightness < 165:
        return "Olive", "#8B7355"

    if brightness > 210: return "Fair", "#F8D5C0"
    elif brightness > 182: return "Light", "#E8B89A"
    elif brightness > 148: return "Medium", "#C88642"
    elif brightness > 110: return "Tan", "#A0522D"
    else: return "Deep", "#4A2912"


# ══════════════════════════════════════════════════════════════
# SKIN TONE COLOR RECOMMENDATIONS
# ══════════════════════════════════════════════════════════════
SKIN_COLOR_RECS = {
    "Fair":   {
        "best":  ["Blush Pink", "Lavender", "Mint Green", "Sky Blue", "Butter Yellow", "Ivory White", "Champagne", "Soft Peach", "Sage Green", "Rose Gold"],
        "avoid": ["Pure White", "Warm Brown", "Camel", "Nude Beige", "Olive Green"]
    },
    "Light":  {
        "best":  ["Warm Coral", "Terracotta", "Dusty Rose", "Royal Blue", "Cobalt", "Teal", "Sage Green", "Cream", "Marigold", "Blush Pink"],
        "avoid": ["Pure White", "Pale Yellow", "Light Beige", "Baby Pink"]
    },
    "Medium": {
        "best":  ["Emerald", "Royal Blue", "Mustard", "Burnt Orange", "Cobalt", "Jade", "Forest Green", "Rust", "Camel", "Deep Burgundy"],
        "avoid": ["Nude Beige", "Dusty Rose", "Light Lavender", "Pale Peach"]
    },
    "Tan":    {
        "best":  ["Cobalt", "Crimson", "Fuchsia", "Bright Gold", "Teal", "Emerald", "Rust", "Coral Red", "Marigold", "Plum"],
        "avoid": ["Dusty Rose", "Nude Beige", "Light Beige", "Pale Cream", "Baby Blue"]
    },
    "Deep":   {
        "best":  ["Bright Gold", "Crimson", "Fuchsia", "Cobalt", "Royal Blue", "Deep Burgundy", "Plum", "Forest Green", "Coral Red", "Charcoal"],
        "avoid": ["Olive Green", "Warm Brown", "Dark Navy", "Black Brown", "Khaki"]
    },
    "Olive":  {
        "best":  ["Terracotta", "Burnt Orange", "Coral Red", "Mustard", "Forest Green", "Teal", "Rust", "Jade", "Warm Brown", "Camel"],
        "avoid": ["Mint Green", "Soft Peach", "Pale Pink", "Light Lavender"]
    },
}

# ══════════════════════════════════════════════════════════════
# BODY TYPE STYLE TIPS
# ══════════════════════════════════════════════════════════════
BODY_STYLE_TIPS = {
    "Hourglass":          ["Fitted silhouettes", "Wrap dresses", "Belted styles", "Bodycon fits", "Pencil skirts"],
    "Full Hourglass":     ["A-line skirts", "Wrap blouses", "Structured jackets", "Midi dresses", "Empire waist"],
    "Pear (Triangle)":    ["A-line dresses", "Off-shoulder tops", "Dark bottoms", "Flared skirts", "Boat necks"],
    "Inverted Triangle":  ["Peplum tops", "Wide-leg pants", "Full skirts", "Belt at waist", "Flowy bottoms"],
    "Rectangle":          ["Peplum tops", "Ruffled skirts", "Wrap dresses", "Statement belts", "Layered looks"],
    "Apple (Round)":      ["Empire waist dresses", "A-line silhouettes", "V-necklines", "Flowy tunics", "Dark solids"],
    "Petite":             ["Vertical stripes", "High waist styles", "Monochrome looks", "Cropped jackets", "Heels"],
    "Tall":               ["Maxi dresses", "Bold prints", "Wide-leg trousers", "Layered looks", "Horizontal details"],
    "Athletic":           ["Soft fabrics", "Ruffle details", "Flowy skirts", "Off-shoulder styles", "Wrap styles"],
    "Lean Column":        ["Layering", "Textured fabrics", "Ruffles & frills", "Belt accessories", "Bold prints"],
    "Oval":               ["Empire waist", "Structured blazers", "Straight-leg pants", "V-necklines", "Dark solids"],
    "Diamond":            ["A-line silhouettes", "Dark solid colors", "Structured tops", "Bootcut jeans", "V-necks"],
    "Trapezoid":          ["Slim trousers", "Tailored coats", "V-necks", "Darker bottoms", "Fitted shirts"],
    "Spoon":              ["High-rise bottoms", "Fit-and-flare", "Peplum blouses", "Wrap styles", "Bold tops"],
    "Lollipop":           ["V-necks", "Dark tops", "Wide-leg pants", "Wrap blouses", "Flowy bottoms"],
    "Skittle":            ["Boat necklines", "Structured shoulders", "Dark bottoms", "A-line skirts", "Fitted tops"],
}


# ══════════════════════════════════════════════════════════════
# BODY MASK EXTRACTION
# ══════════════════════════════════════════════════════════════
def get_mask(img_bgr):
    h, w = img_bgr.shape[:2]
    masks = []

    if REMBG_OK:
        try:
            pil = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
            alpha = np.array(rembg_remove(pil))[:, :, 3]
            m = (alpha > 30).astype(np.uint8) * 255
            k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
            m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
            masks.append((m, 0.70))
        except:
            pass

    try:
        px, py = max(int(w * .10), 10), max(int(h * .02), 6)
        rect = (px, py, w - 2 * px, h - py - 6)
        bgd, fgd, gc = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64), np.zeros((h, w), np.uint8)
        cv2.grabCut(img_bgr, gc, rect, bgd, fgd, 10, cv2.GC_INIT_WITH_RECT)
        masks.append((np.where((gc == 2) | (gc == 0), 0, 255).astype(np.uint8), 0.30))
    except:
        pass

    if not masks:
        m = np.zeros((h, w), np.uint8)
        m[:, max(0, w // 2 - int(w * .38)):min(w, w // 2 + int(w * .38))] = 255
        return m

    combined = np.zeros((h, w), np.float32)
    for mask, weight in masks:
        combined += mask.astype(np.float32) / 255. * weight

    final = (combined > 0.40).astype(np.uint8) * 255
    k2 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
    k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    final = cv2.morphologyEx(final, cv2.MORPH_CLOSE, k2)
    final = cv2.morphologyEx(final, cv2.MORPH_OPEN, k3)

    num, labels, stats, _ = cv2.connectedComponentsWithStats(final, 8)
    if num > 1:
        lg = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        final = np.where(labels == lg, 255, 0).astype(np.uint8)

    return final


# ══════════════════════════════════════════════════════════════
# YOLO POSE DETECTION
# ══════════════════════════════════════════════════════════════
_yolo_pose_model = None


def detect_pose_keypoints(img_bgr):
    global _yolo_pose_model

    if not YOLO_OK:
        return None

    try:
        if _yolo_pose_model is None:
            _yolo_pose_model = _YOLO_CLS('yolov8n-pose.pt')
            print("  ✅ YOLO Pose model loaded")

        results = _yolo_pose_model(img_bgr, conf=0.20, verbose=False)

        if not results or not results[0].keypoints or len(results[0].keypoints.xy) == 0:
            return None

        keypoints = results[0].keypoints.xy[0].cpu().numpy()
        conf = results[0].keypoints.conf[0].cpu().numpy() if hasattr(results[0].keypoints, 'conf') else None

        return {
            'nose': keypoints[0], 'left_eye': keypoints[1], 'right_eye': keypoints[2],
            'left_ear': keypoints[3], 'right_ear': keypoints[4],
            'left_shoulder': keypoints[5], 'right_shoulder': keypoints[6],
            'left_elbow': keypoints[7], 'right_elbow': keypoints[8],
            'left_wrist': keypoints[9], 'right_wrist': keypoints[10],
            'left_hip': keypoints[11], 'right_hip': keypoints[12],
            'left_knee': keypoints[13], 'right_knee': keypoints[14],
            'left_ankle': keypoints[15], 'right_ankle': keypoints[16],
            'confidence': conf
        }
    except Exception as e:
        print(f"  Pose error: {e}")
        return None


# ══════════════════════════════════════════════════════════════
# MEASUREMENT EXTRACTION (PIXEL → CM)
# ══════════════════════════════════════════════════════════════
def extract_measurements(img_bgr, mask, pose, category, user_height_cm):
    h, w = img_bgr.shape[:2]
    props = CATEGORY_PROPS.get(category, CATEGORY_PROPS["Women"])
    SCALE = 4.8  # pixels to cm approximation factor for cm conversion

    warnings = []

    if pose is None:
        return _fallback_measurements(img_bgr, mask, category, user_height_cm)

    ls = pose['left_shoulder']
    rs = pose['right_shoulder']
    lh = pose['left_hip']
    rh = pose['right_hip']
    la = pose['left_ankle']
    ra = pose['right_ankle']
    le = pose['left_elbow']
    re = pose['right_elbow']
    lw = pose['left_wrist']
    rw = pose['right_wrist']
    nose = pose['nose']

    cx = int((ls[0] + rs[0]) / 2)
    shoulder_y = int((ls[1] + rs[1]) / 2)
    hip_y = int((lh[1] + rh[1]) / 2)
    ankle_y = int((la[1] + ra[1]) / 2)

    body_height_px = ankle_y - nose[1]
    if body_height_px < 60:
        warnings.append("Body too small in frame — stand further from camera")
        return _fallback_measurements(img_bgr, mask, category, user_height_cm)

    # Height calculation
    target_h = float(user_height_cm) if user_height_cm and float(user_height_cm) > 60 else float(props["default_height"])
    px_per_cm = body_height_px / target_h

    def px_to_cm(px_val):
        return round(float(px_val) / px_per_cm, 1)

    # Helper: get width from mask at a given y
    def mask_width_at(y_pos):
        if y_pos < 0 or y_pos >= h: return 60
        samples = []
        for dy in range(-4, 5, 2):
            ry = max(0, min(y_pos + dy, h - 1))
            row = mask[ry, :]
            nz = np.where(row > 0)[0]
            if len(nz) < 6: continue
            left = int(nz[0])
            right = int(nz[-1])
            ld = cx - left
            rd = right - cx
            if ld < 4 or rd < 4: continue
            sym = min(ld, rd) / max(ld, rd) if max(ld, rd) > 0 else 0
            w_half = (ld + rd) / 2.0 if sym > 0.6 else min(ld, rd)
            samples.append(w_half)
        if not samples:
            row = mask[max(0, min(y_pos, h - 1)), :]
            nz = np.where(row > 0)[0]
            return float(nz[-1] - nz[0]) / 2.0 if len(nz) >= 6 else 60.0
        return float(np.median(samples))

    # SHOULDER width (pixel distance between shoulder keypoints)
    shoulder_px = abs(ls[0] - rs[0])
    shoulder_cm_val = max(30, min(props["sc_max"], px_to_cm(shoulder_px * 1.1)))

    # BUST (24% down from shoulder to ankle)
    bust_y = int(shoulder_y + body_height_px * 0.22)
    bust_px = mask_width_at(bust_y) * 2
    bust_cm_val = max(70, min(props["bc_max"], px_to_cm(bust_px * 1.05)))

    # WAIST (42-46% down)
    waist_y = int(shoulder_y + body_height_px * 0.44)
    waist_px = mask_width_at(waist_y) * 2
    waist_cm_val = max(55, min(props["wc_max"], px_to_cm(waist_px * 1.02)))

    # HIGH HIP (56-60% down)
    high_hip_y = int(shoulder_y + body_height_px * 0.58)
    high_hip_px = mask_width_at(high_hip_y) * 2
    high_hip_cm_val = max(65, min(props["hc_max"], px_to_cm(high_hip_px * 1.04)))

    # LOW HIP / seat (68-72% down)
    hip_y_pos = int(shoulder_y + body_height_px * 0.70)
    hip_px = mask_width_at(hip_y_pos) * 2
    hip_cm_val = max(70, min(props["hc_max"] + 8, px_to_cm(hip_px * 1.06)))

    # HOLLOW TO HEM
    hollow_y = int(nose[1] + body_height_px * 0.06)
    hollow_to_hem_cm = max(80, min(130, px_to_cm(ankle_y - hollow_y)))

    # INSEAM
    knee_y = int((pose['left_knee'][1] + pose['right_knee'][1]) / 2) if pose.get('left_knee') is not None else int(hip_y * 0.6 + ankle_y * 0.4)
    inseam_cm = max(55, min(90, px_to_cm(ankle_y - hip_y)))

    # ARM LENGTH (shoulder to wrist)
    try:
        left_arm_px = math.sqrt((ls[0]-le[0])**2 + (ls[1]-le[1])**2) + math.sqrt((le[0]-lw[0])**2 + (le[1]-lw[1])**2)
        right_arm_px = math.sqrt((rs[0]-re[0])**2 + (rs[1]-re[1])**2) + math.sqrt((re[0]-rw[0])**2 + (re[1]-rw[1])**2)
        arm_length_cm = max(45, min(80, px_to_cm((left_arm_px + right_arm_px) / 2)))
    except:
        arm_length_cm = round(shoulder_cm_val * 1.6, 1)

    height_cm_final = round(target_h, 1)

    quality_warnings = []
    if shoulder_px < 40: quality_warnings.append("Stand further from camera for better shoulder detection")
    if body_height_px < 120: quality_warnings.append("Ensure full body is visible head to toe")

    return {
        "shoulder_cm": round(shoulder_cm_val, 1),
        "bust_cm": round(bust_cm_val, 1),
        "waist_cm": round(waist_cm_val, 1),
        "high_hip_cm": round(high_hip_cm_val, 1),
        "hip_cm": round(hip_cm_val, 1),
        "hollow_to_hem_cm": round(hollow_to_hem_cm, 1),
        "inseam_cm": round(inseam_cm, 1),
        "arm_length_cm": round(arm_length_cm, 1),
        "height_cm": height_cm_final,
        "quality_warnings": quality_warnings,
        "method": "YOLO Pose",
    }


def _fallback_measurements(img_bgr, mask, category, user_height_cm):
    """Fallback when pose detection fails"""
    props = CATEGORY_PROPS.get(category, CATEGORY_PROPS["Women"])
    h_cm = float(user_height_cm) if user_height_cm and float(user_height_cm or 0) > 60 else float(props["default_height"])

    h, w = img_bgr.shape[:2]
    scale = h_cm / h if h > 0 else 0.22

    def col_width(y_frac):
        y = int(h * y_frac)
        if y < 0 or y >= h: return 40
        row = mask[y, :]
        nz = np.where(row > 0)[0]
        if len(nz) < 6: return 40
        return float(nz[-1] - nz[0]) * scale

    sh = max(32, min(props["sc_max"], col_width(0.22) * 0.85))
    bu = max(72, min(props["bc_max"], col_width(0.30) * 1.02))
    wa = max(58, min(props["wc_max"], col_width(0.46) * 0.96))
    hh = max(68, min(props["hc_max"], col_width(0.58) * 1.02))
    hi = max(74, min(props["hc_max"] + 8, col_width(0.68) * 1.05))

    return {
        "shoulder_cm": round(sh, 1), "bust_cm": round(bu, 1), "waist_cm": round(wa, 1),
        "high_hip_cm": round(hh, 1), "hip_cm": round(hi, 1),
        "hollow_to_hem_cm": round(h_cm * 0.58, 1), "inseam_cm": round(h_cm * 0.44, 1),
        "arm_length_cm": round(sh * 1.6, 1), "height_cm": round(h_cm, 1),
        "quality_warnings": ["Could not detect full pose — measurements estimated from silhouette"],
        "method": "Fallback",
    }


# ══════════════════════════════════════════════════════════════
# DRESS EXTRACTION (for try-on)
# ══════════════════════════════════════════════════════════════
def extract_dress(pil_img):
    img_rgb = np.array(pil_img.convert("RGB"))
    img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
    h, w = img_bgr.shape[:2]

    if REMBG_OK:
        try:
            dm = (np.array(rembg_remove(pil_img.convert("RGB")))[:, :, 3] > 30).astype(np.uint8) * 255
        except:
            dm = np.zeros((h, w), np.uint8)
    else:
        dm = np.zeros((h, w), np.uint8)

    if np.sum(dm) == 0:
        dm = np.ones((h, w), np.uint8) * 255

    num, labels, stats, _ = cv2.connectedComponentsWithStats(dm, 8)
    if num > 1:
        lg = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        dm = np.where(labels == lg, 255, 0).astype(np.uint8)

    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[:, :, :3] = img_rgb
    rgba[:, :, 3] = dm
    result = Image.fromarray(rgba, "RGBA")

    bbox = Image.fromarray(dm).getbbox()
    if bbox:
        pad = 20
        result = result.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                               min(w, bbox[2] + pad), min(h, bbox[3] + pad)))
    return result


def pil_to_b64(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


# ══════════════════════════════════════════════════════════════
# FASTAPI APP
# ══════════════════════════════════════════════════════════════
app = FastAPI(title="Fashion Stylist v28 — Body Analysis + 16 Body Types")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/", response_class=HTMLResponse)
async def root():
    return """<!DOCTYPE html><html><head><title>Fashion Stylist v28</title>
<style>body{font-family:system-ui;background:#07071a;color:#e8e0ff;padding:40px;max-width:820px;margin:auto}
h1{color:#e8c99a}.feat{background:#0a1f08;border-left:4px solid #22c55e;padding:8px 12px;margin:5px 0}
.ep{background:#10103a;border:1px solid #22c55e30;border-radius:10px;padding:14px;margin:8px 0}</style></head>
<body><h1>👗 Fashion Stylist v28 — Body Analysis</h1>
<div class="feat">✅ 16 Body Types Classification</div>
<div class="feat">✅ Full Measurements: Shoulder, Bust, Waist, High Hip, Low Hip, Arm Length</div>
<div class="feat">✅ Skin Tone Detection (Fair/Light/Medium/Tan/Deep/Olive)</div>
<div class="feat">✅ Size Classification XS to XXXL (Indian standard)</div>
<div class="feat">✅ Color Recommendations per skin tone</div>
<div class="feat">✅ 2D Virtual Try-On support</div>
<div class="ep"><b>POST /analyze</b> — Full body analysis</div>
<div class="ep"><b>POST /extract-dress</b> — Extract dress for try-on</div>
<div class="ep"><b>GET /health</b> — Status check</div>
</body></html>"""


@app.get("/health")
async def health():
    return {
        "status": "ok", "version": "v28_body_analysis",
        "yolo": YOLO_OK, "pytorch": TORCH_OK, "rembg": REMBG_OK
    }


@app.post("/analyze")
async def api_analyze(
    file: UploadFile = File(...),
    category: str = Form("Women"),
    user_height: str = Form("0")
):
    """
    Full body analysis:
    - Pose detection & measurements
    - Size classification
    - Body type (16 types)
    - Skin tone detection
    - Color recommendations
    - Style tips
    """
    try:
        print(f"\n📐 Analyzing body — category={category}, height={user_height}")

        data = await file.read()
        arr = np.frombuffer(data, np.uint8)
        img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            return JSONResponse({"error": "Cannot decode image"}, status_code=400)

        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        # 1. Body mask
        mask = get_mask(img_bgr)

        # 2. Pose keypoints
        pose = detect_pose_keypoints(img_bgr)

        # 3. Measurements
        meas = extract_measurements(img_bgr, mask, pose, category, user_height)

        # 4. Size
        size = size_from_bust(category, meas["bust_cm"], meas["height_cm"])

        # 5. Body type (16 types)
        body_type = classify_body_type_16(
            meas["shoulder_cm"], meas["bust_cm"], meas["waist_cm"],
            meas["hip_cm"], meas["height_cm"], category
        )

        # 6. Skin tone
        skin_tone, skin_hex = detect_skin_tone(img_rgb)

        # 7. Color recommendations
        color_rec = SKIN_COLOR_RECS.get(skin_tone, SKIN_COLOR_RECS["Medium"])

        # 8. Style tips
        style_tips = BODY_STYLE_TIPS.get(body_type, ["Wear what makes you feel confident!"])

        # 9. Body icon & description
        body_icons = {
            "Hourglass": "⌛", "Full Hourglass": "⌛", "Pear (Triangle)": "🍐",
            "Inverted Triangle": "🔻", "Rectangle": "▭", "Apple (Round)": "🍎",
            "Petite": "🌸", "Tall": "📏", "Athletic": "💪", "Lean Column": "🏛",
            "Oval": "⭕", "Diamond": "◆", "Trapezoid": "⬡", "Spoon": "🥄",
            "Lollipop": "🍭", "Skittle": "🎳",
        }
        body_descs = {
            "Hourglass": "Balanced bust & hips, defined waist",
            "Full Hourglass": "Fuller curves with defined waist ratio",
            "Pear (Triangle)": "Hips wider than shoulders",
            "Inverted Triangle": "Shoulders/bust wider than hips",
            "Rectangle": "Similar shoulder, waist & hip width",
            "Apple (Round)": "Fuller midsection, slimmer legs",
            "Petite": "Proportionally smaller frame",
            "Tall": "Proportionally taller frame",
            "Athletic": "Muscular build, narrow waist",
            "Lean Column": "Slim and straight, minimal curves",
            "Oval": "Midsection carries most weight",
            "Diamond": "Wider hips & shoulders, narrower waist",
            "Trapezoid": "Shoulders wider than hips (Men)",
            "Spoon": "Hip shelf with defined waist",
            "Lollipop": "Full bust on slim frame",
            "Skittle": "Narrow shoulders, full hips & thighs",
        }

        height_source = f"User-provided {user_height}cm" if user_height and float(user_height or 0) > 60 else "Estimated from proportions"

        result = {
            # Measurements
            "shoulder_cm": meas["shoulder_cm"],
            "bust_cm": meas["bust_cm"],
            "waist_cm": meas["waist_cm"],
            "high_hip_cm": meas["high_hip_cm"],
            "hip_cm": meas["hip_cm"],
            "hollow_to_hem_cm": meas["hollow_to_hem_cm"],
            "inseam_cm": meas["inseam_cm"],
            "arm_length_cm": meas["arm_length_cm"],
            "height_cm": meas["height_cm"],
            # Size
            "size": size,
            "category": category,
            # Body type
            "body_type": body_type,
            "body_icon": body_icons.get(body_type, "▭"),
            "body_desc": body_descs.get(body_type, ""),
            # Skin
            "skin_tone": skin_tone,
            "skin_hex": skin_hex,
            # Colors
            "best_colors": color_rec["best"],
            "avoid_colors": color_rec["avoid"],
            # Style
            "style_tips": style_tips,
            # Meta
            "method": meas["method"],
            "confidence": 80 if pose is not None else 60,
            "quality_warnings": meas.get("quality_warnings", []),
            "height_source": height_source,
            "vis_jpeg_b64": "",  # No debug visualization for clean UI
        }

        print(f"  ✅ Size={size}, Body={body_type}, Skin={skin_tone}")
        print(f"  📐 Bust={meas['bust_cm']}cm, Waist={meas['waist_cm']}cm, Hip={meas['hip_cm']}cm")

        return to_py(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/extract-dress")
async def api_extract_dress(file: UploadFile = File(...)):
    try:
        data = await file.read()
        pil_img = Image.open(io.BytesIO(data)).convert("RGBA")
        dress = extract_dress(pil_img)
        return {"dress_b64": pil_to_b64(dress)}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting Fashion Stylist v28...")
    uvicorn.run(app, host="0.0.0.0", port=7860)
