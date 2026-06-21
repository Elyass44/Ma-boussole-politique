import { useState } from 'react'
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { groupMajorityPosition } from '../logic/scoring.js'

function getBreakdown(scrutins, reponses, group) {
  const agreed = [], disagreed = []
  scrutins.forEach((s, i) => {
    if (reponses[i] === 'je_ne_sais_pas') return
    const gv = s.votes.find(v => v.groupe_uid === group.uid)
    if (!gv) return
    const pos = groupMajorityPosition(gv)
    if (!pos || pos === 'abstention') return
    const label = s.objet?.dossierLegislatif?.libelle || s.titre
    if (pos === reponses[i]) agreed.push(label)
    else disagreed.push(label)
  })
  return { agreed, disagreed }
}

export default function GroupRanking({ scores, scrutins, reponses }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="space-y-2">
      {scores.map(group => {
        const isExpanded = expanded === group.uid
        const breakdown = isExpanded ? getBreakdown(scrutins, reponses, group) : null

        return (
          <div key={group.uid} className="rounded-xl bg-slate-50 overflow-hidden">
            <button
              className="w-full p-4 text-left"
              onClick={() => setExpanded(isExpanded ? null : group.uid)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold truncate text-slate-700">{group.libelle}</span>
                  <span className="shrink-0 text-xs text-slate-500">({group.abbr})</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="font-bold text-slate-600">{Math.round(group.score * 100)}%</span>
                  {isExpanded
                    ? <ChevronUp size={14} className="text-slate-400" />
                    : <ChevronDown size={14} className="text-slate-400" />
                  }
                </div>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-400 transition-all duration-500"
                  style={{ width: `${group.score * 100}%` }}
                />
              </div>
            </button>

            {isExpanded && breakdown && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
                <div className="flex gap-4 pt-3">
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <Check size={12} />
                    {breakdown.agreed.length} accord{breakdown.agreed.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                    <X size={12} />
                    {breakdown.disagreed.length} désaccord{breakdown.disagreed.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {breakdown.disagreed.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-medium">Concordance parfaite sur tous les votes !</p>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Points de désaccord</p>
                    {breakdown.disagreed.slice(0, 4).map((label, i) => (
                      <p key={i} className="text-xs text-slate-600 leading-snug pl-2.5 border-l-2 border-red-200">
                        {label}
                      </p>
                    ))}
                    {breakdown.disagreed.length > 4 && (
                      <p className="text-xs text-slate-400 pl-2.5">
                        + {breakdown.disagreed.length - 4} autre{breakdown.disagreed.length - 4 > 1 ? 's' : ''}…
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
