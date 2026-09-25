import { useEffect, useState } from "react";
import * as THREE from "three";
import { continueRender, delayRender } from "remotion";

const INK = "#14202b";

export type LabelSpec =
  | { kind: "bottle"; title: string; sub?: string }
  | { kind: "podium"; rank: string; name: string; value: string };

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
};
const texture = (c: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

// Wraps a cylinder whose u=0.5 faces the camera (the label mesh is turned π): text sits mid-canvas.
function bottleLabel(title: string, sub?: string) {
  const [c, g] = canvas(1024, 256);
  g.fillStyle = "#f7f5ee";
  g.fillRect(0, 0, 1024, 256);
  g.fillStyle = INK;
  g.fillRect(0, 20, 1024, 4);
  g.fillRect(0, 232, 1024, 4);
  g.textAlign = "center";
  g.textBaseline = "middle";
  const size = title.length <= 2 ? 104 : title.length <= 4 ? 72 : 58;
  g.font = `900 ${size}px Pretendard`;
  g.fillText(title, 512, sub ? 114 : 130);
  if (sub) {
    g.font = `500 28px "IBM Plex Mono"`;
    g.fillText(sub, 512, 192);
  }
  return texture(c);
}

function podiumFace(rank: string, name: string, value: string) {
  const [c, g] = canvas(860, 400);
  g.fillStyle = INK;
  g.textBaseline = "alphabetic";
  g.font = `900 330px Pretendard`;
  g.fillText(rank, 22, 330);
  g.font = `800 76px Pretendard`;
  g.fillText(name, 270, 190);
  g.font = `500 70px "IBM Plex Mono"`;
  g.fillText(value, 272, 300);
  return texture(c);
}

const allText = (specs: Record<string, LabelSpec>) =>
  Object.values(specs).map((s) => (s.kind === "bottle" ? s.title + (s.sub ?? "") : s.rank + s.name + s.value)).join("");

// Textures need the real fonts, so they're built only after the faces load; the caller mounts its
// <ThreeCanvas> once this returns non-null, and the render is held (delayRender) until that commit.
export function useTextures<K extends string>(specs: Record<K, LabelSpec>): Record<K, THREE.Texture> | null {
  const [tex, setTex] = useState<Record<K, THREE.Texture> | null>(null);
  const [handle] = useState(() => delayRender("storyboard label textures"));
  useEffect(() => {
    const text = allText(specs);
    const build = () => {
      const out = {} as Record<K, THREE.Texture>;
      for (const k of Object.keys(specs) as K[]) {
        const s = specs[k];
        out[k] = s.kind === "bottle" ? bottleLabel(s.title, s.sub) : podiumFace(s.rank, s.name, s.value);
      }
      setTex(out);
    };
    Promise.all([
      document.fonts.load('900 104px "Pretendard"', text),
      document.fonts.load('800 76px "Pretendard"', text),
      document.fonts.load('500 28px "IBM Plex Mono"', text),
    ]).then(build, build);
  }, []); // specs are static literals per frame
  useEffect(() => {
    if (tex) continueRender(handle);
  }, [tex, handle]);
  return tex;
}
