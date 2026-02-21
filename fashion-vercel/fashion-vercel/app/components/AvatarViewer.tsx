'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

/* ─── Types ──────────────────────────────────────────────── */
export interface MorphData {
  hip_scale:    number
  waist_scale:  number
  bust_scale:   number
  height_scale: number
}

interface AvatarProps {
  morphs:   MorphData
  dressSrc: string | null
}

/* ─── Morph-target avatar mesh ────────────────────────────── */
function AvatarModel({ morphs, dressSrc }: AvatarProps) {
  const { scene } = useGLTF('/avatar_base.glb')
  const meshRef   = useRef<THREE.SkinnedMesh | null>(null)
  const dressRef  = useRef<THREE.Mesh | null>(null)

  /* Apply morph targets whenever measurements change */
  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.SkinnedMesh)) return
      if (!child.morphTargetDictionary || !child.morphTargetInfluences) return
      meshRef.current = child

      const dict = child.morphTargetDictionary
      const inf  = child.morphTargetInfluences

      /* Clamp 0–1. Morph target names must exist in your GLB. */
      const set = (name: string, val: number) => {
        if (name in dict) inf[dict[name]] = Math.max(0, Math.min(1, val))
      }

      set('hip_wide',    (morphs.hip_scale    - 1.0) * 1.6)
      set('waist_wide',  (morphs.waist_scale  - 1.0) * 1.6)
      set('bust_wide',   (morphs.bust_scale   - 1.0) * 1.6)
      set('height_tall', (morphs.height_scale - 1.0) * 1.8)

      /* Thin variants (negative morphs) */
      set('hip_thin',   Math.max(0, (1.0 - morphs.hip_scale)   * 1.2))
      set('waist_thin', Math.max(0, (1.0 - morphs.waist_scale) * 1.2))
    })
  }, [morphs, scene])

  /* Dress plane overlay */
  useEffect(() => {
    if (!dressSrc) { dressRef.current && (dressRef.current.visible = false); return }
    const loader  = new THREE.TextureLoader()
    loader.load(dressSrc, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      if (dressRef.current) {
        ;(dressRef.current.material as THREE.MeshBasicMaterial).map = tex
        ;(dressRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true
        dressRef.current.visible = true
      }
    })
  }, [dressSrc])

  return (
    <group>
      <primitive object={scene} scale={2.0} position={[0, -1.75, 0]} />

      {/* Dress plane — sits just in front of the torso */}
      <mesh ref={dressRef} position={[0, 0.15, 0.08]} visible={false}>
        <planeGeometry args={[0.80, 1.55, 12, 24]} />
        <meshBasicMaterial transparent alphaTest={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/* ─── Camera auto-rotate helper ──────────────────────────── */
function AutoRotate({ active }: { active: boolean }) {
  const { camera } = useThree()
  const angle = useRef(0)
  useFrame((_, delta) => {
    if (!active) return
    angle.current += delta * 0.5
    camera.position.x = Math.sin(angle.current) * 3.2
    camera.position.z = Math.cos(angle.current) * 3.2
    camera.lookAt(0, 0, 0)
  })
  return null
}

/* ─── Loading placeholder ─────────────────────────────────── */
function AvatarPlaceholder() {
  return (
    <mesh>
      <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
      <meshStandardMaterial color="#3a2880" wireframe />
    </mesh>
  )
}

/* ─── Public component ────────────────────────────────────── */
interface AvatarViewerProps {
  morphs:   MorphData | null
  dressSrc: string | null
  skinHex:  string
}

const DEFAULT_MORPHS: MorphData = { hip_scale:1, waist_scale:1, bust_scale:1, height_scale:1 }

export default function AvatarViewer({ morphs, dressSrc, skinHex }: AvatarViewerProps) {
  const [spinning, setSpinning] = useState(false)
  const [view,     setView]     = useState<'front'|'side'|'back'>('front')

  const snapCamera = (v: 'front'|'side'|'back') => {
    setSpinning(false); setView(v)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Canvas ── */}
      <div className="canvas-wrap relative">
        <Canvas
          shadows
          camera={{ position: [0, 0.4, 3.2], fov: 42 }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#07071a']} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[2, 5, 3]} intensity={1.1} castShadow />
          <pointLight position={[-3, 3, -2]} intensity={0.4} color="#9966ff" />
          <pointLight position={[3, -1, 3]}  intensity={0.2} color="#4499ff" />

          <Suspense fallback={<AvatarPlaceholder />}>
            <AvatarModel morphs={morphs ?? DEFAULT_MORPHS} dressSrc={dressSrc} />
            <Environment preset="studio" />
          </Suspense>

          <ContactShadows
            position={[0, -1.76, 0]}
            opacity={0.5} scale={4} blur={2.4} far={2}
          />

          <AutoRotate active={spinning} />

          {!spinning && (
            <OrbitControls
              enablePan={false}
              minDistance={2}
              maxDistance={5.5}
              minPolarAngle={Math.PI * 0.15}
              maxPolarAngle={Math.PI * 0.85}
            />
          )}
        </Canvas>

        {/* View indicator */}
        <div className="absolute top-3 left-3 m-badge text-xs opacity-70">
          {spinning ? '🔄 Spinning' : view.toUpperCase()}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap gap-2 justify-center">
        {(['front','side','back'] as const).map(v => (
          <button key={v} className={`step-btn ${view===v&&!spinning?'active':''}`}
                  onClick={() => snapCamera(v)}>
            {v==='front'?'⬆ Front':v==='side'?'➡ Side':'⬇ Back'}
          </button>
        ))}
        <button
          className={`step-btn ${spinning?'active':''}`}
          onClick={() => setSpinning(s => !s)}>
          {spinning ? '⏸ Stop' : '▶ Auto Spin'}
        </button>
      </div>

      {/* ── Skin tone indicator ── */}
      <div className="flex justify-center items-center gap-2 text-xs text-purple-400">
        <span className="w-4 h-4 rounded-full border border-yellow-600"
              style={{ background: skinHex }} />
        Skin: {skinHex}
      </div>
    </div>
  )
}
