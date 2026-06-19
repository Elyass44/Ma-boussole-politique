import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { getSummary } from '../services/ai.js'
import { groupMajorityPosition } from '../logic/scoring.js'

const VOTE_STYLE = {
  pour:           { label: 'Pour',      cls: 'bg-emerald-100 text-emerald-700' },
  contre:         { label: 'Contre',    cls: 'bg-red-100 text-red-600'         },
  je_ne_sais_pas: { label: 'Sans avis', cls: 'bg-slate-100 text-slate-500'    },
}

function GroupPill({ abbr, pos }) {
  return (
    <span
      title={`${abbr} a voté ${pos === 'pour' ? 'pour' : 'contre'}`}
      className={`text-xs px-1.5 py-0.5 rounded font-mono cursor-default select-none ${
        pos === 'pour'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-red-100 text-red-600'
      }`}
    >
      {abbr}
    </span>
  )
}

export default function QuestionReview({ scrutins, reponses, scores }) {
  const [propositions, setPropositions] = useState({})

  useEffect(() => {
    Promise.all(
      scrutins.map(s =>
        getSummary(s)
          .then(r => r?.proposition ? [s.uid, r.proposition] : null)
          .catch(() => null)
      )
    ).then(results => {
      const map = {}
      results.forEach(r => { if (r) map[r[0]] = r[1] })
      setPropositions(map)
    })
  }, [scrutins])

  return (
    <div className="space-y-2">
      {scrutins.map((scrutin, i) => {
        const reponse = reponses[i]
        const titre = propositions[scrutin.uid] || scrutin.titre
        const voteStyle = VOTE_STYLE[reponse]
        const voteUrl = scrutin.canonical_url ?? `https://www.civix.fr/votes/${scrutin.uid}`

        const groupResults = scrutin.votes
          .map(v => {
            const group = scores.find(g => g.uid === v.groupe_uid)
            if (!group) return null
            const pos = groupMajorityPosition(v)
            if (!pos || pos === 'abstention') return null
            return { abbr: group.abbr, pos }
          })
          .filter(Boolean)

        return (
          <div key={scrutin.uid} className="rounded-xl p-4 bg-slate-50">
            <div className="flex gap-3">
              <span className="text-xs font-bold text-slate-400 tabular-nums pt-0.5 shrink-0 w-6">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-700 font-medium leading-snug line-clamp-2">
                    {titre}
                  </p>
                  <a
                    href={voteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Voir le vote"
                    className="shrink-0 text-slate-400 hover:text-blue-600 transition-colors mt-0.5"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${voteStyle.cls}`}>
                    {voteStyle.label}
                  </span>
                  {groupResults.map(g => (
                    <GroupPill key={g.abbr} abbr={g.abbr} pos={g.pos} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
