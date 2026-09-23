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
  const small = useMemo(() => makeShadows(100, 2000, 2000), []);
  const medium = useMemo(() => makeShadows(35, 2000, 2000), []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#07111f]">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 12% -10%, rgba(14,116,144,0.30), transparent 62%), radial-gradient(ellipse 50% 45% at 96% 6%, rgba(30,64,175,0.20), transparent 62%), radial-gradient(ellipse 60% 45% at 50% 105%, rgba(15,118,110,0.12), transparent 65%)",
        }}
      />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.13)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div
        className="absolute inset-0 animate-[twinkle_6s_ease-in-out_infinite] opacity-60"
        style={{ width: 2, height: 2, borderRadius: "9999px", boxShadow: small }}
      />
      <div
        className="absolute inset-0 animate-[twinkle_8s_ease-in-out_infinite_1s] opacity-50"
        style={{ width: 3, height: 3, borderRadius: "9999px", boxShadow: medium }}
      />
    </div>
  );
}
