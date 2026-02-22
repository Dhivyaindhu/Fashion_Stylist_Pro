'use client'

import { useEffect, useRef } from 'react'

export interface MorphData {
  hip_scale:    number
  waist_scale:  number
  bust_scale:   number
  height_scale: number
}

interface AvatarViewerProps {
  morphs:   MorphData | null
  dressSrc: string | null
  skinHex:  string
  skinTone: string
  bodyType: string
  dressB64?: string | null
}

export default function AvatarViewer({ morphs, dressSrc, skinHex, skinTone, bodyType, dressB64 }: AvatarViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const avatarHtml = buildAvatarHtml(skinHex, skinTone, bodyType, morphs, dressB64 ?? null)

  return (
    <div className="flex flex-col gap-3">
      <div style={{ width: '100%', minHeight: 480, background: '#07071a', borderRadius: 16, overflow: 'hidden' }}>
        <iframe
          ref={iframeRef}
          srcDoc={avatarHtml}
          style={{ width: '100%', height: 480, border: 'none', background: '#07071a' }}
          title="3D Avatar"
        />
      </div>
      <div className="flex justify-center items-center gap-2 text-xs text-purple-400">
        <span className="w-4 h-4 rounded-full border border-yellow-600" style={{ background: skinHex }} />
        Skin: {skinHex} · {bodyType}
      </div>
    </div>
  )
}

// ── helpers ──────────────────────────────────────────────────
function lighten(hex: string, f: number) {
  const h = hex.replace('#','')
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
  return '#'+[r,g,b].map(c=>Math.max(0,Math.min(255,Math.round(c*f))).toString(16).padStart(2,'0')).join('')
}

const SKIN_PALETTE: Record<string,{dicebear_skin:string,hair:string}> = {
  'Fair':   {dicebear_skin:'f8d5c2', hair:'b8860b'},
  'Light':  {dicebear_skin:'e8b89a', hair:'4a3728'},
  'Medium': {dicebear_skin:'c68642', hair:'2d1b0e'},
  'Tan':    {dicebear_skin:'a0522d', hair:'1a0f0a'},
  'Deep':   {dicebear_skin:'4a2912', hair:'0a0505'},
}

function buildAvatarHtml(
  skinHex: string, skinTone: string, bodyType: string,
  morphs: MorphData | null, dressB64: string | null
): string {
  const m = morphs ?? { hip_scale:1, waist_scale:1, bust_scale:1, height_scale:1 }

  const CX=200, W=400, H=580
  const SC=4.2
  const hw = (c: number) => Math.max(10, Math.round((c / (2*Math.PI)) * SC))

  // Use morph scales to derive pixel widths
  const baseSh=52, baseBu=hw(88), baseWa=hw(72), baseHi=hw(90)
  const sh_w = Math.round(baseSh * Math.min(m.bust_scale, 1.5))
  const bu_w = Math.round(baseBu * Math.min(m.bust_scale, 1.5))
  const wa_w = Math.round(baseWa * Math.min(m.waist_scale, 1.5))
  const hi_w = Math.round(baseHi * Math.min(m.hip_scale, 1.5))
  const arm_w = Math.max(14, Math.round(sh_w * 0.30))
  const nw    = Math.max(14, Math.round(sh_w * 0.28))

  const y_sh=220, y_bu=y_sh+72, y_wa=y_bu+62, y_hi=y_wa+44, y_bot=y_hi+80
  const y_nek=y_sh-20, y_hcy=y_nek-80

  const skin     = skinHex
  const skin_sh  = lighten(skin, 0.72)
  const skin_hi  = lighten(skin, 1.28)
  const skin_mid = lighten(skin, 0.88)

  const pal = SKIN_PALETTE[skinTone] ?? SKIN_PALETTE['Medium']
  const db_url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${skinTone+bodyType}&skinColor=${pal.dicebear_skin}&hairColor=${pal.hair}&backgroundColor=transparent&scale=80&radius=50`

  const bodyD = (sw:number,bw:number,ww:number,hw_:number,sh=0) => {
    const lp=`M ${CX-sw+sh},${y_sh} C ${CX-sw-8+sh},${y_sh+20} ${CX-bw-6+sh},${y_bu-18} ${CX-bw+sh},${y_bu} C ${CX-bw+5+sh},${y_bu+24} ${CX-ww-4+sh},${y_wa-16} ${CX-ww+sh},${y_wa} C ${CX-ww-6+sh},${y_wa+18} ${CX-hw_+4+sh},${y_hi-14} ${CX-hw_+sh},${y_hi} C ${CX-hw_+sh},${y_hi+28} ${CX-hw_+8+sh},${y_bot-10} ${CX-hw_+12+sh},${y_bot} `
    const rp=`L ${CX+hw_-12+sh},${y_bot} C ${CX+hw_-8+sh},${y_bot-10} ${CX+hw_+sh},${y_hi+28} ${CX+hw_+sh},${y_hi} C ${CX+hw_-4+sh},${y_hi-14} ${CX+ww+6+sh},${y_wa+18} ${CX+ww+sh},${y_wa} C ${CX+ww+4+sh},${y_wa-16} ${CX+bw-5+sh},${y_bu+24} ${CX+bw+sh},${y_bu} C ${CX+bw+6+sh},${y_bu-18} ${CX+sw+8+sh},${y_sh+20} ${CX+sw+sh},${y_sh} Z`
    return lp+rp
  }
  const armD = (side:number,sw:number,sh=0) => {
    const ax=CX+side*sw+sh, ay=y_sh+8
    const ex=CX+side*(sw+32)+sh, ey=y_sh+110
    const hx=CX+side*(sw+14)+sh, hy=y_sh+210
    return `M ${ax},${ay} C ${ax+side*16},${ay+30} ${ex-side*6},${ey-28} ${ex},${ey} C ${ex+side*4},${ey+32} ${hx+side*10},${hy-36} ${hx},${hy}`
  }
  const neckD = (nn:number,sh=0) => `M ${CX-nn+sh},${y_nek+4} C ${CX-nn+2+sh},${y_nek+14} ${CX-nn+2+sh},${y_sh-10} ${CX-nn+3+sh},${y_sh} L ${CX+nn-3+sh},${y_sh} C ${CX+nn-2+sh},${y_sh-10} ${CX+nn-2+sh},${y_nek+14} ${CX+nn+sh},${y_nek+4} Z`

  const init_bd = bodyD(sh_w,bu_w,wa_w,hi_w)
  const init_la = armD(-1,sh_w)
  const init_ra = armD(1,sh_w)
  const init_nk = neckD(nw)

  let dressDefs='', dressBody=''
  if(dressB64){
    const gw=sh_w*2+arm_w*4+60
    const fg=`M ${CX-sh_w},${y_sh} C ${CX-sh_w-6},${y_sh+10} ${CX-sh_w-64+6},${y_sh+20} ${CX-sh_w-64},${y_sh+30} C ${CX-sh_w-68},${y_sh+70} ${CX-sh_w-64},${y_sh+100} ${CX-sh_w-32-arm_w/2},${y_sh+110} C ${CX-sh_w-32-arm_w/2},${y_sh+140} ${CX-sh_w-14-arm_w/2+4},${y_sh+195} ${CX-sh_w-14-arm_w/2+8},${y_sh+215} L ${CX-sh_w-14+arm_w/2},${y_sh+219} C ${CX-sh_w-32+arm_w/2},${y_sh+140} ${CX-sh_w+4},${y_sh+16} ${CX-bu_w-6},${y_bu-18} C ${CX-bu_w+5},${y_bu+24} ${CX-wa_w-4},${y_wa-16} ${CX-wa_w},${y_wa} C ${CX-wa_w-6},${y_wa+18} ${CX-hi_w+4},${y_hi-14} ${CX-hi_w},${y_hi} C ${CX-hi_w},${y_hi+28} ${CX-hi_w+12},${y_bot} L ${CX+hi_w-12},${y_bot} C ${CX+hi_w},${y_hi+28} ${CX+hi_w},${y_hi} ${CX+hi_w-4},${y_hi-14} C ${CX+wa_w+6},${y_wa+18} ${CX+wa_w},${y_wa} ${CX+wa_w+4},${y_wa-16} C ${CX+bu_w-5},${y_bu+24} ${CX+bu_w},${y_bu} ${CX+sh_w-4},${y_sh+16} C ${CX+sh_w-32-arm_w/2},${y_sh+100} ${CX+sh_w-32-arm_w/2},${y_sh+140} ${CX+sh_w+14-arm_w/2},${y_sh+215} L ${CX+sh_w+14+arm_w/2+4},${y_sh+219} C ${CX+sh_w+32+arm_w/2},${y_sh+140} ${CX+sh_w+32+arm_w/2},${y_sh+100} ${CX+sh_w+64+4},${y_sh+100} C ${CX+sh_w+64-4},${y_sh+70} ${CX+sh_w+64},${y_sh+30} C ${CX+sh_w+64-6},${y_sh+20} ${CX+sh_w+6},${y_sh+10} ${CX+sh_w},${y_sh} Z`
    dressDefs=`<clipPath id="gClip"><path id="garmentClipPath" d="${fg}"/></clipPath><pattern id="dressP" patternUnits="userSpaceOnUse" x="${CX-gw/2}" y="${y_sh}" width="${gw}" height="${y_bot-y_sh+40}"><image href="data:image/png;base64,${dressB64}" x="0" y="0" width="${gw}" height="${y_bot-y_sh+40}" preserveAspectRatio="xMidYMid slice"/></pattern>`
    dressBody=`<path id="dressPth" d="${fg}" fill="url(#dressP)" clip-path="url(#gClip)" opacity="0.92"/><path d="${fg}" fill="none" stroke="rgba(0,0,0,0.18)" stroke-width="3"/>`
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#07071a;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:system-ui,sans-serif}svg{cursor:grab}svg:active{cursor:grabbing}</style></head><body>
<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:16px">
<svg id="avatarSVG" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient id="bgG" cx="50%" cy="55%" r="62%"><stop offset="0%" stop-color="#1a1535"/><stop offset="100%" stop-color="#07071a"/></radialGradient>
    <linearGradient id="bodyG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${skin_sh}"/><stop offset="25%" stop-color="${skin}"/><stop offset="50%" stop-color="${skin_hi}" stop-opacity="0.88"/><stop offset="75%" stop-color="${skin}"/><stop offset="100%" stop-color="${skin_sh}"/></linearGradient>
    <filter id="bl4"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="ds"><feDropShadow dx="2" dy="4" stdDeviation="5" flood-opacity="0.3"/></filter>
    ${dressDefs}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgG)"/>
  <path id="leftArm" d="${init_la}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${dressB64?'0':'1'}"/>
  <ellipse id="leftHand" cx="${CX-sh_w-14}" cy="${y_sh+218}" rx="${Math.max(9,arm_w/2+1)}" ry="${Math.max(11,arm_w/2+3)}" fill="${skin}" opacity="${dressB64?'0':'1'}"/>
  <path id="rightArm" d="${init_ra}" fill="none" stroke="${skin_mid}" stroke-width="${arm_w}" stroke-linecap="round" opacity="${dressB64?'0':'1'}"/>
  <ellipse id="rightHand" cx="${CX+sh_w+14}" cy="${y_sh+218}" rx="${Math.max(9,arm_w/2+1)}" ry="${Math.max(11,arm_w/2+3)}" fill="${skin}" opacity="${dressB64?'0':'1'}"/>
  <path id="torso" d="${init_bd}" fill="url(#bodyG)" filter="url(#ds)"/>
  ${dressBody}
  <path id="neck" d="${init_nk}" fill="${skin_mid}" filter="url(#ds)"/>
  <circle id="headBase" cx="${CX}" cy="${y_hcy}" r="68" fill="${skin}" filter="url(#ds)"/>
  <image id="faceImg" href="${db_url}" x="${CX-80}" y="${y_hcy-88}" width="160" height="160" clip-path="circle(68px at 80px 82px)" preserveAspectRatio="xMidYMid meet"/>
  <text x="${CX}" y="${H-10}" text-anchor="middle" font-family="system-ui" font-size="11" fill="rgba(255,255,255,0.3)" id="viewLbl">FRONT · 0° · ${bodyType} · ${skinTone}</text>
</svg>
<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
  <button onclick="snapTo(0)"   style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">⬆ Front</button>
  <button onclick="snapTo(90)"  style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">➡ Right</button>
  <button onclick="snapTo(180)" style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">⬇ Back</button>
  <button onclick="snapTo(270)" style="background:#2a1f60;color:#c8b8ff;border:1px solid #4a3898;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">⬅ Left</button>
  <button id="spinBtn" onclick="toggleSpin()" style="background:#1a1040;color:#8070c0;border:1px solid #2e2060;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px">▶ Spin</button>
</div>
<input type="range" min="0" max="359" value="0" step="1" style="width:280px;accent-color:#8060e0" oninput="setAngle(+this.value)" id="rotSlider"/>
</div>
<script>
(function(){
var CX=${CX},W=${W},H=${H};
var SHW=${sh_w},BUW=${bu_w},WAW=${wa_w},HIW=${hi_w};
var YSH=${y_sh},YBU=${y_bu},YWA=${y_wa},YHI=${y_hi},YBOT=${y_bot};
var YNER=${y_nek},YHCY=${y_hcy},NW=${nw},ARW=${arm_w};
var BT="${bodyType}",ST="${skinTone}",hasDress=${dressB64?'true':'false'};
var angle=0,spinning=false,dragStartX=null,dragStartAngle=0;
function mod360(a){return((a%360)+360)%360;}
function viewName(a){a=mod360(a);if(a<22)return'FRONT';if(a<67)return'FRONT-RIGHT';if(a<112)return'RIGHT';if(a<157)return'BACK-RIGHT';if(a<202)return'BACK';if(a<247)return'BACK-LEFT';if(a<292)return'LEFT';if(a<337)return'FRONT-LEFT';return'FRONT';}
function update(a){
  a=mod360(a);var rad=a*Math.PI/180,cosA=Math.cos(rad),sinA=Math.sin(rad);
  var wS=Math.abs(cosA)*0.82+0.18,sh=Math.round(sinA*18);
  var sw=Math.max(8,Math.round(SHW*wS)),bw=Math.max(8,Math.round(BUW*wS)),ww=Math.max(8,Math.round(WAW*wS)),hw=Math.max(8,Math.round(HIW*wS)),nn=Math.max(6,Math.round(NW*wS)),aw=Math.round(ARW*wS);
  var lp='M '+(CX-sw+sh)+','+YSH+' C '+(CX-sw-8+sh)+','+(YSH+20)+' '+(CX-bw-6+sh)+','+(YBU-18)+' '+(CX-bw+sh)+','+YBU+' C '+(CX-bw+5+sh)+','+(YBU+24)+' '+(CX-ww-4+sh)+','+(YWA-16)+' '+(CX-ww+sh)+','+YWA+' C '+(CX-ww-6+sh)+','+(YWA+18)+' '+(CX-hw+4+sh)+','+(YHI-14)+' '+(CX-hw+sh)+','+YHI+' C '+(CX-hw+sh)+','+(YHI+28)+' '+(CX-hw+8+sh)+','+(YBOT-10)+' '+(CX-hw+12+sh)+','+YBOT+' ';
  var rp='L '+(CX+hw-12+sh)+','+YBOT+' C '+(CX+hw-8+sh)+','+(YBOT-10)+' '+(CX+hw+sh)+','+(YHI+28)+' '+(CX+hw+sh)+','+YHI+' C '+(CX+hw-4+sh)+','+(YHI-14)+' '+(CX+ww+6+sh)+','+(YWA+18)+' '+(CX+ww+sh)+','+YWA+' C '+(CX+ww+4+sh)+','+(YWA-16)+' '+(CX+bw-5+sh)+','+(YBU+24)+' '+(CX+bw+sh)+','+YBU+' C '+(CX+bw+6+sh)+','+(YBU-18)+' '+(CX+sw+8+sh)+','+(YSH+20)+' '+(CX+sw+sh)+','+YSH+' Z';
  var bd=lp+rp;
  function armPath(side){var ax=CX+side*sw+sh,ay=YSH+8,ex=CX+side*(sw+Math.round(32*wS))+sh,ey=YSH+110,hx=CX+side*(sw+Math.round(14*wS))+sh,hy=YSH+210;return'M '+ax+','+ay+' C '+(ax+side*16)+','+(ay+30)+' '+(ex-side*6)+','+(ey-28)+' '+ex+','+ey+' C '+(ex+side*4)+','+(ey+32)+' '+(hx+side*10)+','+(hy-36)+' '+hx+','+hy;}
  var nd='M '+(CX-nn+sh)+','+(YNER+4)+' C '+(CX-nn+2+sh)+','+(YNER+14)+' '+(CX-nn+2+sh)+','+(YSH-10)+' '+(CX-nn+3+sh)+','+YSH+' L '+(CX+nn-3+sh)+','+YSH+' C '+(CX+nn-2+sh)+','+(YSH-10)+' '+(CX+nn-2+sh)+','+(YNER+14)+' '+(CX+nn+sh)+','+(YNER+4)+' Z';
  function S(id,attr,val){var el=document.getElementById(id);if(el)el.setAttribute(attr,val);}
  function O(id,val){var el=document.getElementById(id);if(el)el.style.opacity=val;}
  var faceOp=Math.max(0,cosA).toFixed(2);
  S('torso','d',bd);S('neck','d',nd);
  if(!hasDress){S('leftArm','d',armPath(-1));S('rightArm','d',armPath(1));O('leftArm',Math.max(0,cosA)>0.1||a<200?'1':'0');O('rightArm',Math.max(0,cosA)>0.1||a>200?'1':'0');O('leftHand',Math.max(0,cosA)>0.1||a<200?'1':'0');O('rightHand',Math.max(0,cosA)>0.1||a>200?'1':'0');}
  S('headBase','cx',CX+sh);S('faceImg','x',CX-80+sh);O('faceImg',faceOp);
  S('viewLbl','x',CX+sh);var lbl=document.getElementById('viewLbl');if(lbl)lbl.textContent=viewName(a)+' · '+Math.round(a)+'° · '+BT+' · '+ST;
  var sl=document.getElementById('rotSlider');if(sl)sl.value=Math.round(a);
}
function setAngle(a){angle=mod360(a);update(angle);}window.setAngle=setAngle;
function snapTo(target){var start=angle,diff=mod360(target-start);if(diff>180)diff-=360;var steps=30,step=0;function tick(){step++;var t=step/steps;t=t<0.5?2*t*t:-1+(4-2*t)*t;angle=mod360(start+diff*t);update(angle);if(step<steps)requestAnimationFrame(tick);else{angle=mod360(target);update(angle);}}requestAnimationFrame(tick);}window.snapTo=snapTo;
function toggleSpin(){spinning=!spinning;var btn=document.getElementById('spinBtn');if(btn)btn.textContent=spinning?'⏸ Stop':'▶ Spin';if(spinning)spinLoop();}window.toggleSpin=toggleSpin;
function spinLoop(){if(!spinning)return;angle=mod360(angle+1.4);update(angle);requestAnimationFrame(spinLoop);}
var svg=document.getElementById('avatarSVG');
if(svg){svg.addEventListener('mousedown',function(e){spinning=false;var btn=document.getElementById('spinBtn');if(btn)btn.textContent='▶ Spin';dragStartX=e.clientX;dragStartAngle=angle;e.preventDefault();});document.addEventListener('mousemove',function(e){if(dragStartX===null)return;angle=mod360(dragStartAngle+(e.clientX-dragStartX)*0.6);update(angle);});document.addEventListener('mouseup',function(){dragStartX=null;});svg.addEventListener('touchstart',function(e){spinning=false;dragStartX=e.touches[0].clientX;dragStartAngle=angle;e.preventDefault();},{passive:false});document.addEventListener('touchmove',function(e){if(dragStartX===null)return;angle=mod360(dragStartAngle+(e.touches[0].clientX-dragStartX)*0.6);update(angle);e.preventDefault();},{passive:false});document.addEventListener('touchend',function(){dragStartX=null;});}
update(0);
})();
</script>
</body></html>`
}
