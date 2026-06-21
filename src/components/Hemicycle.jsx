import { useMemo, useRef, useState } from 'react'

const COLORS = {
  'LFI-NFP': '#CC0033',
  'ECOS':    '#50A000',
  'SOC':     '#E5007D',
  'GDR':     '#8B0000',
  'LIOT':    '#9370DB',
  'DEM':     '#FF8C00',
  'HOR':     '#00B09B',
  'EPR':     '#0066CC',
  'UDDPLR':  '#002395',
  'DR':      '#0047AB',
  'RN':      '#010066',
  'NI':      '#9E9E9E',
}

// Ordre gauche → droite (AXIS_VALUES de scoring.js)
const AXIS_ORDER = ['LFI-NFP', 'ECOS', 'SOC', 'GDR', 'LIOT', 'DEM', 'HOR', 'EPR', 'UDDPLR', 'DR', 'RN']

const CX = 200
const CY = 185
const RINGS = [
  { rIn: 60,  rOut: 82  },
  { rIn: 87,  rOut: 109 },
  { rIn: 114, rOut: 136 },
  { rIn: 141, rOut: 163 },
]
const NEEDLE_R = 172
const GAP = 0.014 // radians entre groupes

function arcPath(cx, cy, rIn, rOut, a1, a2) {
  const pt = (r, a) => `${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`
  const large = a1 - a2 > Math.PI ? 1 : 0
  return [
    `M${pt(rOut, a1)}`,
    `A${rOut},${rOut},0,${large},1,${pt(rOut, a2)}`,
    `L${pt(rIn, a2)}`,
    `A${rIn},${rIn},0,${large},0,${pt(rIn, a1)}`,
    'Z',
  ].join(' ')
}

export default function Hemicycle({ scores, axe }) {
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  function handleMouseMove(e, seg) {
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip({ seg, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  function handleTouch(e, seg) {
    e.preventDefault()
    const touch = e.touches[0]
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip({ seg, x: touch.clientX - rect.left, y: touch.clientY - rect.top })
    setTimeout(() => setTooltip(null), 1800)
  }

  const ordered = useMemo(() => {
    const rank = Object.fromEntries(AXIS_ORDER.map((a, i) => [a, i]))
    const known = scores
      .filter(g => rank[g.abbr] !== undefined)
      .sort((a, b) => rank[a.abbr] - rank[b.abbr])
    const rest = scores.filter(g => rank[g.abbr] === undefined)
    return [...known, ...rest]
  }, [scores])

  const total = useMemo(
    () => ordered.reduce((s, g) => s + (g.effectif || 0), 0),
    [ordered]
  )

  const segments = useMemo(() => {
    const usable = Math.PI - GAP * (ordered.length - 1)
    let angle = Math.PI
    return ordered.map((g, i) => {
      const span = (g.effectif / total) * usable
      const a1 = angle
      const a2 = angle - span
      angle = a2 - (i < ordered.length - 1 ? GAP : 0)
      return {
        ...g,
        a1,
        a2,
        color: COLORS[g.abbr] ?? '#888',
        opacity: Math.max(0.08, 0.08 + (g.score ?? 0) * 0.92),
      }
    })
  }, [ordered, total])

  // axe: 1 (gauche) → π, 9 (droite) → 0
  const needleAngle = (Math.PI * (9 - axe)) / 8
  const nx = CX + NEEDLE_R * Math.cos(needleAngle)
  const ny = CY - NEEDLE_R * Math.sin(needleAngle)

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Votre position dans l'hémicycle
      </h3>

      <div ref={containerRef} className="relative">
        {tooltip && (
          <div
            className="absolute z-10 pointer-events-none bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
            style={{ left: tooltip.x + 14, top: tooltip.y - 40 }}
          >
            <span className="font-semibold">{tooltip.seg.libelle}</span>
            <span className="ml-2 text-slate-300">{Math.round(tooltip.seg.score * 100)}%</span>
          </div>
        )}
        <svg
        viewBox="0 0 400 198"
        className="w-full"
        role="img"
        aria-label="Hémicycle de l'Assemblée nationale"
      >
        {segments.map(seg => (
          <g
            key={seg.abbr}
            onMouseMove={e => handleMouseMove(e, seg)}
            onMouseLeave={() => setTooltip(null)}
            onTouchStart={e => handleTouch(e, seg)}
            className="cursor-pointer"
          >
            {RINGS.map((ring, ri) => (
              <path
                key={ri}
                d={arcPath(CX, CY, ring.rIn, ring.rOut, seg.a1, seg.a2)}
                fill={seg.color}
                opacity={seg.opacity}
              />
            ))}
          </g>
        ))}

        {/* Ligne de base */}
        <line
          x1={CX - 172} y1={CY} x2={CX + 172} y2={CY}
          stroke="#e2e8f0" strokeWidth="1"
        />

        {/* Aiguille */}
        <line
          x1={CX} y1={CY} x2={nx} y2={ny}
          stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r="5" fill="#1e293b" />

        {/* Labels gauche / droite */}
        <text x="28"  y="196" fontSize="11" fill="#94a3b8" textAnchor="middle">Gauche</text>
        <text x="372" y="196" fontSize="11" fill="#94a3b8" textAnchor="middle">Droite</text>
        </svg>
      </div>

      {/* Légende */}
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 justify-center">
        {segments.map(seg => (
          <div key={seg.abbr} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs text-slate-500">{seg.abbr}</span>
            <span className="text-xs font-semibold text-slate-700">
              {Math.round(seg.score * 100)}%
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center italic">
        L'aiguille indique votre position gauche–droite. L'opacité reflète votre concordance.
      </p>
    </div>
  )
}
