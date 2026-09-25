import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// 1 world unit = 1 dm (10 cm). Real-world proportions: a 360ml soju bottle is ~21.6cm tall and
// ~6.4cm across, a soju glass ~5.9cm, a 30-bottle plastic crate ("한 짝") ~23cm tall.
export type V3 = [number, number, number];
export const BOTTLE_H = 2.14;
const v2 = (x: number, y: number) => new THREE.Vector2(x, y);

// ---------------------------------------------------------------- geometry (module-cached)

function bottleProfile(): THREE.Vector2[] {
  const pts = [v2(0, 0), v2(0.25, 0), v2(0.285, 0.004), v2(0.305, 0.014), v2(0.316, 0.03), v2(0.32, 0.05), v2(0.32, 1.08)];
  const shoulder = new THREE.SplineCurve([
    v2(0.32, 1.08), v2(0.316, 1.14), v2(0.302, 1.2), v2(0.279, 1.26), v2(0.249, 1.32), v2(0.216, 1.38),
    v2(0.188, 1.44), v2(0.168, 1.5), v2(0.154, 1.56), v2(0.146, 1.62), v2(0.141, 1.68), v2(0.14, 1.74),
  ]);
  pts.push(...shoulder.getPoints(40).slice(1));
  pts.push(v2(0.14, 1.87), v2(0.147, 1.875), v2(0.147, 1.905), v2(0, 1.905));
  return pts;
}

// A taller, straight-shouldered spirits bottle — "some other country's bottle", so Korea's soju
// bottle is told apart by silhouette, not by being the only colored thing on screen.
function spiritsProfile(): THREE.Vector2[] {
  const pts = [v2(0, 0), v2(0.3, 0), v2(0.33, 0.02), v2(0.34, 0.06), v2(0.34, 1.62)];
  const shoulder = new THREE.SplineCurve([v2(0.34, 1.62), v2(0.33, 1.72), v2(0.29, 1.82), v2(0.22, 1.9), v2(0.16, 1.97), v2(0.14, 2.05)]);
  pts.push(...shoulder.getPoints(24).slice(1));
  pts.push(v2(0.14, 2.5), v2(0.15, 2.5), v2(0.15, 2.53), v2(0, 2.53));
  return pts;
}

function capGeometry(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.15, 0.152, 0.235, 240, 1, false);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    if (Math.hypot(x, z) < 0.1) continue;
    const k = 1 + 0.007 * (0.5 + 0.5 * Math.cos(Math.atan2(z, x) * 48));
    pos.setXYZ(i, x * k, pos.getY(i), z * k);
  }
  g.computeVertexNormals();
  return g;
}

// Soju glass: a hollow shell (outer wall up, rim, inner wall down) so it reads as glass, not a
// solid block — 5.85cm tall, thick 1.2cm base, ~55ml cavity.
function shotGlassProfile(): THREE.Vector2[] {
  return [
    v2(0, 0), v2(0.18, 0), v2(0.196, 0.006), v2(0.2, 0.02), v2(0.235, 0.575), v2(0.233, 0.585),
    v2(0.222, 0.585), v2(0.219, 0.575), v2(0.188, 0.14), v2(0.18, 0.125), v2(0, 0.12),
  ];
}
function shotLiquidProfile(level: number): THREE.Vector2[] {
  const top = 0.125 + (0.575 - 0.125) * level, rTop = 0.188 + (0.219 - 0.188) * level;
  return [v2(0, 0.126), v2(0.18, 0.126), v2(0.186, 0.14), v2(rTop - 0.004, top), v2(0, top)];
}

export const CRATE = { cols: 6, rows: 5, pitch: 0.7, H: 2.32, wall: 0.07 };
const CRATE_W = CRATE.cols * CRATE.pitch + 2 * CRATE.wall;
const CRATE_D = CRATE.rows * CRATE.pitch + 2 * CRATE.wall;
function crateGeometry(): THREE.BufferGeometry {
  const { cols, rows, pitch, H, wall } = CRATE;
  const W = CRATE_W, D = CRATE_D;
  const parts: THREE.BufferGeometry[] = [];
  const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    parts.push(g);
  };
  box(W, 0.05, D, 0, 0.025, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.14, H, 0.14, sx * (W / 2 - 0.07), H / 2, sz * (D / 2 - 0.07));
  const bars: [number, number][] = [[0.07, 0.14], [0.64, 0.08], [1.2, 0.08], [1.76, 0.08], [2.25, 0.14]];
  for (const [y, h] of bars) {
    box(W, h, 0.05, 0, y, D / 2 - 0.025);
    box(W, h, 0.05, 0, y, -D / 2 + 0.025);
    box(0.05, h, D, W / 2 - 0.025, y, 0);
    box(0.05, h, D, -W / 2 + 0.025, y, 0);
  }
  for (let c = 2; c < cols; c += 2) {
    const x = -W / 2 + wall + c * pitch;
    box(0.06, H, 0.05, x, H / 2, D / 2 - 0.025);
    box(0.06, H, 0.05, x, H / 2, -D / 2 + 0.025);
  }
  for (let c = 1; c < cols; c++) box(0.025, 0.55, D - 0.1, -W / 2 + wall + c * pitch, 0.3, 0);
  for (let r = 1; r < rows; r++) box(W - 0.1, 0.55, 0.025, 0, 0.3, -D / 2 + wall + r * pitch);
  return mergeGeometries(parts)!;
}

const cache = new Map<string, THREE.BufferGeometry>();
const cached = (key: string, make: () => THREE.BufferGeometry) => {
  let g = cache.get(key);
  if (!g) cache.set(key, (g = make()));
  return g;
};
export const geo = {
  bottle: () => cached("bottle", () => new THREE.LatheGeometry(bottleProfile(), 72)),
  spirits: () => cached("spirits", () => new THREE.LatheGeometry(spiritsProfile(), 72)),
  cap: () => cached("cap", capGeometry),
  band: () => cached("band", () => new THREE.CylinderGeometry(0.149, 0.151, 0.03, 64)),
  label: () => cached("label", () => new THREE.CylinderGeometry(0.3228, 0.3228, 0.5, 96, 1, true)),
  spiritsLabel: () => cached("spiritsLabel", () => new THREE.CylinderGeometry(0.3428, 0.3428, 0.7, 96, 1, true)),
  shot: () => cached("shot", () => new THREE.LatheGeometry(shotGlassProfile(), 64)),
  shotLiquid: (level: number) => cached(`shotLiquid${level}`, () => new THREE.LatheGeometry(shotLiquidProfile(level), 64)),
  crate: () => cached("crate", crateGeometry),
  // a pawn with shoulders, so a crowd seen from above still reads as people, not pins
  body: () => cached("body", () => new THREE.LatheGeometry(
    [v2(0, 0), v2(0.25, 0), v2(0.28, 0.06), v2(0.3, 0.8), v2(0.34, 1.18), v2(0.42, 1.36), v2(0.4, 1.46), v2(0.3, 1.54), v2(0.14, 1.6), v2(0.12, 1.66), v2(0, 1.68)],
    40,
  )),
  head: () => cached("head", () => new THREE.SphereGeometry(0.27, 32, 20)),
};

// ---------------------------------------------------------------- materials

export function useMaterials() {
  return useMemo(() => {
    const greenGlass = new THREE.MeshPhysicalMaterial({
      color: "#bfeccd", transmission: 1, thickness: 0.34, roughness: 0.05, ior: 1.5,
      attenuationColor: new THREE.Color("#178a47"), attenuationDistance: 0.42,
      clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.3,
    });
    const clearGlass = new THREE.MeshPhysicalMaterial({
      color: "#f4f7f8", transmission: 1, thickness: 0.34, roughness: 0.03, ior: 1.5,
      attenuationColor: new THREE.Color("#b9c8d0"), attenuationDistance: 0.7,
      clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6,
    });
    // depthWrite off: otherwise the glass's front wall hides the liquid inside it (the liquid is a
    // transparent object, drawn after the glass, and would fail the depth test).
    const thinGlass = new THREE.MeshPhysicalMaterial({
      color: "#ffffff", transmission: 1, thickness: 0.12, roughness: 0.02, ior: 1.5,
      clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.6, depthWrite: false,
    });
    // Soju is clear, so "a full glass" reads from a faint volume plus a bright surface — any more
    // opaque and it reads as makgeolli. Transparent objects render after three's transmission pass.
    const liquid = new THREE.MeshPhysicalMaterial({
      color: "#e4eff5", transparent: true, opacity: 0.26, roughness: 0.02, ior: 1.33,
      clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 2.2, depthWrite: false,
      emissive: new THREE.Color("#4d5a60"), emissiveIntensity: 0.15,
    });
    const surface = new THREE.MeshPhysicalMaterial({
      color: "#f3f8fb", transparent: true, opacity: 0.6, roughness: 0.0, clearcoat: 1,
      envMapIntensity: 3, depthWrite: false, side: THREE.DoubleSide,
    });
    const cap = new THREE.MeshStandardMaterial({ color: "#c9cfcc", metalness: 1, roughness: 0.42, envMapIntensity: 1.1 });
    const crate = new THREE.MeshStandardMaterial({ color: "#26333f", roughness: 0.55, metalness: 0 });
    const clay = new THREE.MeshStandardMaterial({ color: "#f1efe9", roughness: 0.92 });
    const podium = new THREE.MeshStandardMaterial({ color: "#f3f4f2", roughness: 0.7 });
    return { greenGlass, clearGlass, thinGlass, liquid, surface, cap, crate, clay, podium };
  }, []);
}
export type Mats = ReturnType<typeof useMaterials>;

const paper = (map?: THREE.Texture) => new THREE.MeshStandardMaterial({ map, color: map ? "#ffffff" : "#f6f4ee", roughness: 0.78 });

// ---------------------------------------------------------------- objects

export const SojuBottle: React.FC<{ m: Mats; position?: V3; rotation?: V3; scale?: number; label?: THREE.Texture; castShadow?: boolean }> = ({
  m, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, label,
}) => {
  const labelMat = useMemo(() => paper(label), [label]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo.bottle()} material={m.greenGlass} />
      <mesh geometry={geo.cap()} material={m.cap} position={[0, 2.0225, 0]} />
      <mesh geometry={geo.band()} material={m.cap} position={[0, 1.888, 0]} />
      <mesh geometry={geo.label()} material={labelMat} position={[0, 0.62, 0]} rotation={[0, Math.PI, 0]} />
    </group>
  );
};

export const SpiritsBottle: React.FC<{ m: Mats; position?: V3; rotation?: V3; scale?: number; label?: THREE.Texture }> = ({
  m, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, label,
}) => {
  const labelMat = useMemo(() => paper(label), [label]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo.spirits()} material={m.clearGlass} />
      <mesh position={[0, 2.64, 0]} material={m.cap}><cylinderGeometry args={[0.16, 0.16, 0.22, 48]} /></mesh>
      <mesh geometry={geo.spiritsLabel()} material={labelMat} position={[0, 0.8, 0]} rotation={[0, Math.PI, 0]} />
    </group>
  );
};

export const SojuGlass: React.FC<{ m: Mats; position?: V3; level?: number; scale?: number }> = ({ m, position = [0, 0, 0], level = 0.85, scale = 1 }) => {
  const top = 0.125 + (0.575 - 0.125) * level, rTop = 0.188 + (0.219 - 0.188) * level - 0.006;
  return (
    <group position={position} scale={scale}>
      <mesh geometry={geo.shot()} material={m.thinGlass} />
      {level > 0 && (
        <>
          <mesh geometry={geo.shotLiquid(level)} material={m.liquid} />
          <mesh position={[0, top + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.surface}>
            <circleGeometry args={[rTop, 48]} />
          </mesh>
        </>
      )}
    </group>
  );
};

// Instance matrices are written in a layout effect, i.e. before the single advance() Remotion's
// ThreeCanvas runs per frame. (drei's <Instances> registers instances via state and only draws them
// on a second tick — which a rendered frame never gets.)
type Xf = { p: V3; r?: V3; s?: number };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export const Instanced: React.FC<{ geometry: THREE.BufferGeometry; material: THREE.Material; items: Xf[] }> = ({ geometry, material, items }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current!;
    items.forEach((it, i) => {
      _q.setFromEuler(_e.set(...(it.r ?? [0, 0, 0])));
      mesh.setMatrixAt(i, _m.compose(_p.set(...it.p), _q, _s.setScalar(it.s ?? 1)));
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [items]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} frustumCulled={false} />;
};

// Many upright bottles at once (crates, crowds): three instanced meshes instead of hundreds of groups.
export type Placed = { p: V3; ry?: number; s?: number };
export const BottleField: React.FC<{ m: Mats; items: Placed[]; label?: THREE.Texture }> = ({ m, items, label }) => {
  const labelMat = useMemo(() => paper(label), [label]);
  const [glass, caps, labels] = useMemo(() => {
    const at = (it: Placed, dy: number): V3 => [it.p[0], it.p[1] + dy * (it.s ?? 1), it.p[2]];
    return [
      items.map((it) => ({ p: it.p, r: [0, it.ry ?? 0, 0] as V3, s: it.s })),
      items.map((it) => ({ p: at(it, 2.0225), s: it.s })),
      items.map((it) => ({ p: at(it, 0.62), r: [0, Math.PI + (it.ry ?? 0), 0] as V3, s: it.s })),
    ];
  }, [items]);
  return (
    <>
      <Instanced geometry={geo.bottle()} material={m.greenGlass} items={glass} />
      <Instanced geometry={geo.cap()} material={m.cap} items={caps} />
      <Instanced geometry={geo.label()} material={labelMat} items={labels} />
    </>
  );
};

// A stack of full 30-bottle crates; returns the bottle placements so one BottleField draws them all.
export function crateStack(base: V3, crates: number): { crates: V3[]; bottles: Placed[] } {
  const out: { crates: V3[]; bottles: Placed[] } = { crates: [], bottles: [] };
  for (let k = 0; k < crates; k++) {
    const y = base[1] + k * (CRATE.H + 0.004);
    out.crates.push([base[0], y, base[2]]);
    for (let c = 0; c < CRATE.cols; c++)
      for (let r = 0; r < CRATE.rows; r++)
        out.bottles.push({
          p: [base[0] - CRATE_W / 2 + CRATE.wall + (c + 0.5) * CRATE.pitch, y + 0.05, base[2] - CRATE_D / 2 + CRATE.wall + (r + 0.5) * CRATE.pitch],
          ry: ((k * 31 + c * 7 + r * 13) % 17) * 0.37,
        });
  }
  return out;
}
export const Crates: React.FC<{ m: Mats; at: V3[] }> = ({ m, at }) => {
  const items = useMemo(() => at.map((p) => ({ p })), [at]);
  return <Instanced geometry={geo.crate()} material={m.crate} items={items} />;
};
export const CRATE_SIZE = { W: CRATE_W, D: CRATE_D, H: CRATE.H };

export const Figures: React.FC<{ m: Mats; at: V3[] }> = ({ m, at }) => {
  const [bodies, heads] = useMemo(
    () => [at.map((p) => ({ p })), at.map((p) => ({ p: [p[0], p[1] + 1.92, p[2]] as V3 }))],
    [at]
  );
  return (
    <>
      <Instanced geometry={geo.body()} material={m.clay} items={bodies} />
      <Instanced geometry={geo.head()} material={m.clay} items={heads} />
    </>
  );
};

// The face texture is 860×400 (labels.ts podiumFace); the plane keeps that aspect and hugs the top.
export const PodiumBlock: React.FC<{ m: Mats; position: V3; size: V3; face?: THREE.Texture }> = ({ m, position, size, face }) => {
  const faceMat = useMemo(() => (face ? new THREE.MeshStandardMaterial({ map: face, roughness: 0.7, transparent: true }) : null), [face]);
  const fw = size[0] * 0.84, fh = fw * (400 / 860);
  return (
    <group position={position}>
      <RoundedBox args={size} radius={0.05} smoothness={4} material={m.podium} position={[0, size[1] / 2, 0]} />
      {faceMat && (
        <mesh position={[0, size[1] - 0.1 - fh / 2, size[2] / 2 + 0.003]} material={faceMat}>
          <planeGeometry args={[fw, fh]} />
        </mesh>
      )}
    </group>
  );
};

// ---------------------------------------------------------------- camera + lighting

export const CameraRig: React.FC<{ position: V3; target: V3; fov: number }> = ({ position, target, fov }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.fov = fov;
    camera.near = 0.1;
    camera.far = 400;
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, position, target, fov]);
  return null;
};

// Same projection as CameraRig, for pinning 2D type to a 3D point.
export function project(p: V3, cam: { position: V3; target: V3; fov: number }, w = 1080, h = 1920): { x: number; y: number } {
  const c = new THREE.PerspectiveCamera(cam.fov, w / h, 0.1, 400);
  c.position.set(...cam.position);
  c.lookAt(...cam.target);
  c.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(c);
  return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h };
}

const PAPER_BG = "#e8ecee";

// Bright-field product studio: an endless paper floor (fog hides its horizon), softboxes and two
// tall strip lights in the environment so glass picks up vertical highlights, and contact shadows.
// `fog` only exists to melt the floor's far edge into the background — it must start beyond the
// subject, or it washes the subject out (the crate towers sit ~130 units from their camera).
export const BrightStudio: React.FC<{ shadowScale?: number; shadowFar?: number; floor?: "paper" | "steel"; fog?: [number, number] }> = ({
  shadowScale = 40, shadowFar = 8, floor = "paper", fog = [60, 220],
}) => (
  <>
    <color attach="background" args={[PAPER_BG]} />
    <fog attach="fog" args={[PAPER_BG, ...fog]} />
    <ambientLight intensity={0.35} />
    <directionalLight position={[6, 14, 8]} intensity={1.4} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
      <planeGeometry args={[600, 600]} />
      {floor === "steel" ? (
        <meshStandardMaterial color="#b9bfc2" metalness={1} roughness={0.32} envMapIntensity={0.9} />
      ) : (
        <meshStandardMaterial color={PAPER_BG} roughness={1} />
      )}
    </mesh>
    <ContactShadows position={[0, 0.002, 0]} opacity={0.5} scale={shadowScale} blur={2.4} far={shadowFar} resolution={1024} frames={1} color="#1b2630" />
    <Environment resolution={512} frames={1}>
      <Lightformer form="rect" intensity={2.2} position={[0, 12, 2]} rotation-x={Math.PI / 2} scale={[16, 8, 1]} />
      <Lightformer form="rect" intensity={5} position={[-7, 4, 3]} rotation-y={Math.PI / 2.4} scale={[2.2, 14, 1]} />
      <Lightformer form="rect" intensity={5} position={[7, 4, 3]} rotation-y={-Math.PI / 2.4} scale={[2.2, 14, 1]} />
      <Lightformer form="rect" intensity={1.2} position={[0, 4, -10]} scale={[20, 8, 1]} />
    </Environment>
  </>
);

// The dark scenes' background is the brand ink itself, so the bottom ink band continues the room
// instead of cutting across it.
export const DARK_BG = "#14202b";

// A photographic sweep: floor curving up into a wall (no horizon line), painted with one continuous
// light — a glow on the wall behind the subject spilling onto the floor under it. Unlit/exact colour
// on purpose: glass only shows what's rendered behind it (three's transmission samples opaque
// objects), so this backdrop is what makes a bottle glow green, and its edges are exactly DARK_BG so
// it disappears into the background and the ink band.
const SWEEP = { W: 36, zFront: 12, zCurve: -2.5, R: 2.5, wallH: 14 };
const SWEEP_L = SWEEP.zFront - SWEEP.zCurve + (Math.PI * SWEEP.R) / 2 + SWEEP.wallH;
// arc-length position of a point on the sweep's centre line: on the floor at depth z, or at height y on curve/wall
const sweepS = (at: { z: number } | { y: number }) => {
  const floorLen = SWEEP.zFront - SWEEP.zCurve;
  if ("z" in at) return SWEEP.zFront - at.z;
  if (at.y <= SWEEP.R) return floorLen + SWEEP.R * Math.acos(1 - at.y / SWEEP.R);
  return floorLen + (Math.PI * SWEEP.R) / 2 + (at.y - SWEEP.R);
};

function sweepGeometry(): THREE.BufferGeometry {
  const { W, zFront, zCurve, R, wallH } = SWEEP;
  const prof: [number, number][] = [];
  for (let i = 0; i <= 24; i++) prof.push([zFront - (i / 24) * (zFront - zCurve), 0]);
  for (let i = 1; i <= 32; i++) {
    const t = (i / 32) * (Math.PI / 2);
    prof.push([zCurve - R * Math.sin(t), R - R * Math.cos(t)]);
  }
  for (let i = 1; i <= 16; i++) prof.push([zCurve - R, R + (i / 16) * wallH]);
  const s: number[] = [0];
  for (let i = 1; i < prof.length; i++) s.push(s[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  const cols = 8, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  prof.forEach(([z, y], i) => {
    for (let j = 0; j <= cols; j++) {
      pos.push(-W / 2 + (j / cols) * W, y, z);
      uv.push(j / cols, s[i] / s[s.length - 1]);
    }
  });
  // wound so the lit face points up (floor) / toward the camera (wall)
  for (let i = 0; i < prof.length - 1; i++)
    for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j, b = a + cols + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export type Glow = { wallY: number; x?: number; radius: number; poolZ?: number; poolRadius?: number; inner?: string };
function sweepTexture(glow: Glow) {
  const ppu = 40, w = Math.round(SWEEP.W * ppu), h = Math.round(SWEEP_L * ppu);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = DARK_BG;
  g.fillRect(0, 0, w, h);
  const cx = (SWEEP.W / 2 + (glow.x ?? 0)) * ppu;
  const cyOf = (s: number) => h - s * ppu; // canvas top row = v 1 (wall top)
  const blob = (cy: number, r: number, inner: string, alphaMid: number) => {
    const grd = g.createRadialGradient(cx, cy, 0, cx, cy, r * ppu);
    grd.addColorStop(0, inner);
    grd.addColorStop(0.35, `rgba(120, 132, 138, ${alphaMid})`);
    grd.addColorStop(1, "rgba(20, 32, 43, 0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  };
  blob(cyOf(sweepS({ y: glow.wallY })), glow.radius, glow.inner ?? "rgba(244, 239, 226, 1)", 0.55);
  if (glow.poolRadius) blob(cyOf(sweepS({ z: glow.poolZ ?? 0 })), glow.poolRadius, "rgba(150, 158, 160, 0.55)", 0.2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const Sweep: React.FC<{ glow: Glow }> = ({ glow }) => {
  const map = useMemo(() => sweepTexture(glow), [glow]);
  return (
    <mesh geometry={cached("sweep", sweepGeometry)}>
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
};

// Dark-field: ink room on a lit sweep, a key spot for the label and cap, thin rim strips and one soft
// front panel in the environment so glass edges and rims catch light — the reveal beats' "lights out".
export const DarkStudio: React.FC<{ spot?: V3; target?: V3; glow?: Glow; sweepZ?: number }> = ({
  spot = [2.5, 7, 7], target = [0, 1, 0], glow = { wallY: 1.6, radius: 4.2, poolZ: -0.6, poolRadius: 2.2 }, sweepZ = 0,
}) => {
  const light = useMemo(() => {
    const s = new THREE.SpotLight("#fff1dc", 260, 30, 0.34, 0.9, 2);
    s.position.set(...spot);
    s.target.position.set(...target);
    return s;
  }, [spot, target]);
  return (
    <>
      <color attach="background" args={[DARK_BG]} />
      <ambientLight intensity={0.05} />
      <primitive object={light} />
      <primitive object={light.target} />
      <group position={[0, 0, sweepZ]}>
        <Sweep glow={glow} />
      </group>
      <ContactShadows position={[0, 0.003, 0]} opacity={0.75} scale={10} blur={2.2} far={3} resolution={512} frames={1} color="#05080b" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={6} position={[-4, 3, -3]} rotation-y={Math.PI / 4} scale={[0.6, 10, 1]} />
        <Lightformer form="rect" intensity={6} position={[4, 3, -3]} rotation-y={-Math.PI / 4} scale={[0.6, 10, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[0, 4, 8]} scale={[7, 3, 1]} />
      </Environment>
    </>
  );
};
