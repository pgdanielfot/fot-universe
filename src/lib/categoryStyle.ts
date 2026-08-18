const ACCENTS = {
  sky: { dot: "bg-sky-400", ring: "shadow-[0_0_10px_rgba(56,189,248,0.6)]", border: "hover:border-sky-400/40" },
  blue: { dot: "bg-blue-400", ring: "shadow-[0_0_10px_rgba(96,165,250,0.6)]", border: "hover:border-blue-400/40" },
  indigo: { dot: "bg-indigo-400", ring: "shadow-[0_0_10px_rgba(129,140,248,0.6)]", border: "hover:border-indigo-400/40" },
  violet: { dot: "bg-violet-400", ring: "shadow-[0_0_10px_rgba(167,139,250,0.6)]", border: "hover:border-violet-400/40" },
  fuchsia: { dot: "bg-fuchsia-400", ring: "shadow-[0_0_10px_rgba(232,121,249,0.6)]", border: "hover:border-fuchsia-400/40" },
  pink: { dot: "bg-pink-400", ring: "shadow-[0_0_10px_rgba(244,114,182,0.6)]", border: "hover:border-pink-400/40" },
  rose: { dot: "bg-rose-400", ring: "shadow-[0_0_10px_rgba(251,113,133,0.6)]", border: "hover:border-rose-400/40" },
  red: { dot: "bg-red-400", ring: "shadow-[0_0_10px_rgba(248,113,113,0.6)]", border: "hover:border-red-400/40" },
  orange: { dot: "bg-orange-400", ring: "shadow-[0_0_10px_rgba(251,146,60,0.6)]", border: "hover:border-orange-400/40" },
  amber: { dot: "bg-amber-400", ring: "shadow-[0_0_10px_rgba(251,191,36,0.6)]", border: "hover:border-amber-400/40" },
  yellow: { dot: "bg-yellow-400", ring: "shadow-[0_0_10px_rgba(250,204,21,0.6)]", border: "hover:border-yellow-400/40" },
  lime: { dot: "bg-lime-400", ring: "shadow-[0_0_10px_rgba(163,230,53,0.6)]", border: "hover:border-lime-400/40" },
  emerald: { dot: "bg-emerald-400", ring: "shadow-[0_0_10px_rgba(52,211,153,0.6)]", border: "hover:border-emerald-400/40" },
  teal: { dot: "bg-teal-400", ring: "shadow-[0_0_10px_rgba(45,212,191,0.6)]", border: "hover:border-teal-400/40" },
  cyan: { dot: "bg-cyan-400", ring: "shadow-[0_0_10px_rgba(34,211,238,0.6)]", border: "hover:border-cyan-400/40" },
} as const;

export type AccentKey = keyof typeof ACCENTS;

export const ACCENT_OPTIONS = Object.keys(ACCENTS) as AccentKey[];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function categoryStyle(name: string, color?: string | null) {
  const key = (color && color in ACCENTS ? color : null) as AccentKey | null;
  if (key) return ACCENTS[key];

  const keys = ACCENT_OPTIONS;
  return ACCENTS[keys[hash(name.trim().toLowerCase()) % keys.length]];
}
