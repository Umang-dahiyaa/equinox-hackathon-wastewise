// Lulu — the WasteWise AI mascot.
// A paper coffee cup with a green lid, a sage sleeve with a leaf,
// and a dark robot visor with glowing mint eyes.
//
// Usage:
//   import { LuluMascot } from "@/components/ui/LuluMascot"
//   <LuluMascot mood="happy" size={120} />
//
// Moods: idle | talking | thinking | happy | confused | sorry

type LuluMood = "idle" | "talking" | "thinking" | "happy" | "confused" | "sorry"

interface LuluMascotProps {
  mood?: LuluMood
  size?: number // width in px (height scales automatically)
  className?: string
}

const C = {
  ink: "#1F3D2B",
  lid: "#2E7D4F",
  lidTop: "#3C9A4E",
  sleeve: "#8FB996",
  cup: "#FFFDF7",
  eye: "#7CF0B4",
  cheek: "#F4A6A0",
}

function Eyes({ mood }: { mood: LuluMood }) {
  const glow = { filter: "url(#lulu-glow)" }

  if (mood === "happy") {
    return (
      <g stroke={C.eye} strokeWidth={6} strokeLinecap="round" fill="none" style={glow}>
        <path d="M76 103 Q85 88 94 103" />
        <path d="M106 103 Q115 88 124 103" />
      </g>
    )
  }
  if (mood === "sorry") {
    return (
      <g stroke={C.eye} strokeWidth={6} strokeLinecap="round" style={glow}>
        <path d="M77 104 L93 99" />
        <path d="M107 99 L123 104" />
      </g>
    )
  }
  if (mood === "thinking") {
    return (
      <g fill={C.eye} style={glow}>
        <rect x={82} y={86} width={14} height={16} rx={5} />
        <rect x={110} y={86} width={14} height={16} rx={5} />
      </g>
    )
  }
  if (mood === "confused") {
    return (
      <g fill={C.eye} style={glow}>
        <rect x={76} y={88} width={18} height={20} rx={6} />
        <rect x={106} y={95} width={18} height={7} rx={3.5} />
      </g>
    )
  }
  // idle + talking: normal eyes that blink
  return (
    <g fill={C.eye} style={glow} className="lulu-blink">
      <rect x={76} y={88} width={18} height={20} rx={6} />
      <rect x={106} y={88} width={18} height={20} rx={6} />
    </g>
  )
}

function Mouth({ mood }: { mood: LuluMood }) {
  const common = { stroke: C.ink, strokeWidth: 3.5, strokeLinecap: "round" as const, fill: "none" }
  if (mood === "talking") {
    return <ellipse cx={100} cy={129} rx={7} ry={4} fill={C.ink} className="lulu-talk" />
  }
  if (mood === "happy") return <path d="M86 125 Q100 139 114 125" {...common} />
  if (mood === "sorry") return <path d="M90 133 Q100 124 110 133" {...common} />
  if (mood === "confused") return <path d="M91 129 Q96 126 101 129 Q106 132 110 128" {...common} />
  return <path d="M90 126 Q100 134 110 126" {...common} />
}

export function LuluMascot({ mood = "idle", size = 120, className = "" }: LuluMascotProps) {
  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={(size * 240) / 200}
      className={className}
      role="img"
      aria-label={`Lulu the WasteWise assistant, ${mood}`}
    >
      <style>{`
        .lulu-bob { animation: lulu-bob 3s ease-in-out infinite; }
        .lulu-blink { transform-box: fill-box; transform-origin: center; animation: lulu-blink 4.5s infinite; }
        .lulu-talk { transform-box: fill-box; transform-origin: center; animation: lulu-talk .35s ease-in-out infinite alternate; }
        .lulu-steam { animation: lulu-steam 2.8s ease-in-out infinite; }
        .lulu-steam-2 { animation-delay: 1.4s; }
        .lulu-dot { animation: lulu-dot 1.2s ease-in-out infinite; }
        @keyframes lulu-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        @keyframes lulu-blink { 0%,92%,100% { transform: scaleY(1) } 95% { transform: scaleY(.1) } }
        @keyframes lulu-talk { from { transform: scaleY(.4) } to { transform: scaleY(1.2) } }
        @keyframes lulu-steam { 0% { opacity: 0; transform: translateY(6px) } 40% { opacity: .7 } 100% { opacity: 0; transform: translateY(-10px) } }
        @keyframes lulu-dot { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .lulu-bob, .lulu-blink, .lulu-talk, .lulu-steam, .lulu-dot { animation: none; }
        }
      `}</style>

      <defs>
        <filter id="lulu-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ground shadow */}
      <ellipse cx={100} cy={231} rx={46} ry={5} fill="rgba(31,61,43,.12)" />

      <g className="lulu-bob">
        {/* steam */}
        <g stroke={C.sleeve} strokeWidth={4} strokeLinecap="round" fill="none">
          <path className="lulu-steam" d="M68 36 q-6 -7 0 -14 q6 -7 0 -14" />
          <path className="lulu-steam lulu-steam-2" d="M132 36 q-6 -7 0 -14 q6 -7 0 -14" />
        </g>

        {/* antenna */}
        <line x1={100} y1={44} x2={100} y2={30} stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" />
        <circle cx={100} cy={25} r={6} fill={C.eye} stroke={C.ink} strokeWidth={3} />

        {/* cup body */}
        <path
          d="M40 72 L160 72 L145 218 Q145 223 140 223 L60 223 Q55 223 55 218 Z"
          fill={C.cup}
          stroke={C.ink}
          strokeWidth={3.5}
          strokeLinejoin="round"
        />

        {/* sleeve with leaf */}
        <path d="M47 142 L153 142 L148.6 186 L51.4 186 Z" fill={C.sleeve} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M90 175 Q88 152 112 151 Q113 174 90 175 Z" fill={C.ink} />
        <path d="M93 172 Q100 162 108 155" stroke={C.sleeve} strokeWidth={2} fill="none" strokeLinecap="round" />

        {/* lid */}
        <path d="M46 60 Q50 44 70 44 L130 44 Q150 44 154 60 Z" fill={C.lidTop} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
        <rect x={32} y={58} width={136} height={17} rx={8.5} fill={C.lid} stroke={C.ink} strokeWidth={3.5} />

        {/* robot visor */}
        <rect x={58} y={80} width={84} height={36} rx={18} fill={C.ink} />
        <Eyes mood={mood} />

        {/* cheeks + mouth */}
        <ellipse cx={68} cy={128} rx={7} ry={4} fill={C.cheek} opacity={0.75} />
        <ellipse cx={132} cy={128} rx={7} ry={4} fill={C.cheek} opacity={0.75} />
        <Mouth mood={mood} />

        {/* mood extras */}
        {mood === "thinking" && (
          <g fill={C.ink}>
            <circle className="lulu-dot" cx={150} cy={30} r={4} />
            <circle className="lulu-dot" cx={163} cy={22} r={5} style={{ animationDelay: ".2s" }} />
            <circle className="lulu-dot" cx={178} cy={12} r={6} style={{ animationDelay: ".4s" }} />
          </g>
        )}
        {mood === "confused" && (
          <text x={160} y={40} fontSize={34} fontWeight={700} fill={C.ink} fontFamily="Plus Jakarta Sans, sans-serif">
            ?
          </text>
        )}
        {mood === "happy" && (
          <g fill={C.eye} stroke={C.ink} strokeWidth={2}>
            <path d="M174 84 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" />
            <path d="M30 96 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" />
          </g>
        )}
      </g>
    </svg>
  )
}
