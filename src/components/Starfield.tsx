"use client";

import { useMemo } from "react";

function makeShadows(count: number, maxX: number, maxY: number) {
  const parts: string[] = [];
  let seed = count * 9301 + 49297;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * maxX);
    const y = Math.floor(rand() * maxY);
    parts.push(`${x}px ${y}px #fff`);
  }
  return parts.join(", ");
}

export default function Starfield() {
  const small = useMemo(() => makeShadows(220, 2000, 2000), []);
  const medium = useMemo(() => makeShadows(90, 2000, 2000), []);
  const large = useMemo(() => makeShadows(40, 2000, 2000), []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0b]">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(255,255,255,0.06), transparent 60%), radial-gradient(ellipse 70% 60% at 85% 25%, rgba(255,255,255,0.05), transparent 60%), radial-gradient(ellipse 60% 50% at 50% 90%, rgba(255,255,255,0.04), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 animate-[twinkle_6s_ease-in-out_infinite]"
        style={{ width: 2, height: 2, borderRadius: "9999px", boxShadow: small }}
      />
      <div
        className="absolute inset-0 animate-[twinkle_8s_ease-in-out_infinite_1s]"
        style={{ width: 3, height: 3, borderRadius: "9999px", boxShadow: medium }}
      />
      <div
        className="absolute inset-0 animate-[twinkle_10s_ease-in-out_infinite_2s]"
        style={{ width: 4, height: 4, borderRadius: "9999px", boxShadow: large }}
      />
    </div>
  );
}
