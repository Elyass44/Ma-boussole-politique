import { useState, useEffect } from 'react'
import { ThumbsUp, ThumbsDown, Minus, ExternalLink, LogOut, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import { getSummary, getInsights } from '../services/ai.js'

export default function Quiz({ scrutin, currentIndex, total, onAnswer, onAbandon }) {
  const [clicked, setClicked] = useState(null)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [openInsight, setOpenInsight] = useState(null)

  useEffect(() => {
    setClicked(null)
    setSummary(null)
    setSummaryLoading(true)
    setInsights(null)
    setInsightsLoading(false)
    setOpenInsight(null)
    getSummary(scrutin).then(result => {
      setSummary(result)
      setSummaryLoading(false)
    })
  }, [scrutin.uid])

  async function handleInsight(key) {
    if (openInsight === key) return setOpenInsight(null)
    setOpenInsight(key)
    if (insights) return
    setInsightsLoading(true)
    const data = await getInsights(scrutin)
    setInsights(data)
    setInsightsLoading(false)
  }

  function handleAnswer(reponse) {
    if (clicked) return
    setClicked(reponse)
    if (reponse === 'pour') {
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.85 }, colors: ['#10b981', '#34d399', '#fff'] })
    } else if (reponse === 'contre') {
      confetti({ particleCount: 25, spread: 55, origin: { y: 0.85 }, colors: ['#ef4444', '#f87171', '#fff'] })
    }
    setTimeout(() => onAnswer(reponse), 280)
  }

  const date = new Date(scrutin.date_scrutin).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const dossierRef = scrutin.objet?.dossierLegislatif?.dossierRef
  const dossierUrl = scrutin.canonical_url
    ?? (dossierRef
      ? `https://www.assemblee-nationale.fr/dyn/17/dossiers/${dossierRef}`
      : `https://www.civix.fr/votes/${scrutin.uid}`)

  // Libellé de la loi : préférer le libellé du dossier, sinon nettoyer le titre
  // On retire juste "l'ensemble de la/du" et on capitalise
  const loiLibelle = scrutin.objet?.dossierLegislatif?.libelle
    ?? (() => {
        const s = scrutin.titre
          .replace(/^l'ensemble d(?:e la|u) /i, '')
          .replace(/\s*\([^)]*\)\s*/g, '')
          .replace(/\.$/, '')
          .trim()
        return s.charAt(0).toUpperCase() + s.slice(1)
      })()

  const pct = Math.round(((currentIndex + 1) / total) * 100)

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-fade-up">

      {/* Header */}
      <div className="bg-blue-900 text-white px-4 pt-5 pb-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-blue-300 text-sm font-medium uppercase tracking-widest">Question</span>
            <span className="text-blue-400 text-sm">{pct}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold tabular-nums w-14">
              {String(currentIndex + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 space-y-1">
              <div className="h-2 bg-blue-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-blue-400 text-xs text-right">sur {total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 gap-3">
        <div key={currentIndex} className="flex-1 flex flex-col gap-3 animate-fade-up">

          {/* Question card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs text-slate-400">{date}</span>
              <a
                href={dossierUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-2.5 py-1 rounded-lg"
              >
                Consulter <ExternalLink size={11} />
              </a>
            </div>

            {/* Proposition IA */}
            {summaryLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-full" />
                <div className="h-5 bg-slate-200 rounded w-2/3" />
              </div>
            ) : summary?.proposition ? (
              <h2 className="text-lg font-bold text-slate-800 leading-snug">
                {summary.proposition}
              </h2>
            ) : (
              <h2 className="text-sm font-medium text-slate-500 leading-snug">
                {scrutin.titre}
              </h2>
            )}
          </div>

          {/* Contexte */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Contexte</p>
            <p className="text-sm text-slate-700 leading-relaxed">{loiLibelle}</p>
            {scrutin.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {scrutin.tags.map(tag => (
                  <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                    {tag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Questions IA */}
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)' }}>
            <div className="px-4 pt-3 pb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-white/80" />
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Éclairage IA</p>
            </div>
            <div className="px-3 pb-3 space-y-2">
              <div className="flex gap-2">
                {[
                  { key: 'concret',   label: 'Ce que ça change' },
                  { key: 'arguments', label: 'Arguments pour et contre' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleInsight(key)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-colors text-center ${
                      openInsight === key
                        ? 'bg-white text-purple-700'
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {openInsight && (
                <div className="rounded-xl bg-white/10 px-3 py-3 space-y-3">
                  {insightsLoading ? (
                    <div className="space-y-1.5 animate-pulse">
                      <div className="h-3 bg-white/20 rounded w-full" />
                      <div className="h-3 bg-white/20 rounded w-4/5" />
                      <div className="h-3 bg-white/20 rounded w-3/5" />
                    </div>
                  ) : insights ? (
                    (openInsight === 'arguments' ? ['pour', 'contre'] : ['concret']).map(f => insights[f] ? (
                      <div key={f}>
                        {f !== 'concret' && (
                          <p className="text-xs font-bold text-white/60 uppercase tracking-wide mb-1">
                            {f === 'pour' ? 'Pour' : 'Contre'}
                          </p>
                        )}
                        <p className="text-xs text-white/90 leading-relaxed">{insights[f]}</p>
                      </div>
                    ) : null)
                  ) : (
                    <p className="text-xs text-white/50 italic">Informations non disponibles.</p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Answer buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleAnswer('contre')}
            disabled={summaryLoading}
            className={`flex-1 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-red-500 text-white shadow-sm transition-all hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed ${clicked === 'contre' ? 'btn-pop' : ''}`}
          >
            <ThumbsDown size={22} />
            <span className="text-sm font-bold">Contre</span>
          </button>

          <button
            onClick={() => handleAnswer('je_ne_sais_pas')}
            disabled={summaryLoading}
            className={`w-20 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-white border-2 border-slate-300 text-slate-500 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed ${clicked === 'je_ne_sais_pas' ? 'btn-pop' : ''}`}
          >
            <Minus size={18} />
            <span className="text-xs font-medium leading-tight text-center">Sans<br />avis</span>
          </button>

          <button
            onClick={() => handleAnswer('pour')}
            disabled={summaryLoading}
            className={`flex-1 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-emerald-500 text-white shadow-sm transition-all hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed ${clicked === 'pour' ? 'btn-pop' : ''}`}
          >
            <ThumbsUp size={22} />
            <span className="text-sm font-bold">Pour</span>
          </button>
        </div>

        <div className="pb-safe">
          <div className="border-t border-slate-200 pt-3 flex justify-end">
            <button
              onClick={() => setConfirmAbandon(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <LogOut size={13} />
              Abandonner la partie
            </button>
          </div>
        </div>

        {/* Modale de confirmation */}
        {confirmAbandon && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
              <h3 className="text-base font-bold text-slate-800 mb-2">Abandonner la partie ?</h3>
              <p className="text-sm text-slate-500 mb-5">Ta progression sera perdue.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAbandon(false)}
                  className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Continuer
                </button>
                <button
                  onClick={onAbandon}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                >
                  Abandonner
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
