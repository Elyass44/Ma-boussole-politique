import { useState, useEffect } from 'react'
import { Sparkles, ThumbsUp, ThumbsDown, Minus, ExternalLink, LogOut } from 'lucide-react'
import confetti from 'canvas-confetti'
import { getSummary } from '../services/ai.js'

export default function Quiz({ scrutin, currentIndex, total, onAnswer, onAbandon }) {
  const [clicked, setClicked] = useState(null)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [confirmAbandon, setConfirmAbandon] = useState(false)

  useEffect(() => {
    setClicked(null)
    setSummary(null)
    setSummaryLoading(true)
    getSummary(scrutin).then(result => {
      setSummary(result)
      setSummaryLoading(false)
    })
  }, [scrutin.uid])

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
  const dossierUrl = dossierRef
    ? `https://www.assemblee-nationale.fr/dyn/17/dossiers/${dossierRef}`
    : null
  const amendNum = scrutin.titre.match(/n°\s*(\d+)/i)?.[1] ?? null

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

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {amendNum && (
                <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Amdt n°{amendNum}
                </span>
              )}
              <span className="text-xs text-slate-400">{date}</span>
              <div className="flex-1" />
              {dossierUrl && (
                <a
                  href={dossierUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-2.5 py-1 rounded-lg"
                >
                  Dossier <ExternalLink size={11} />
                </a>
              )}
            </div>

            {/* Proposition */}
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

          {/* Contexte IA */}
          {(summaryLoading || summary?.resume) && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                {summaryLoading ? (
                  <svg className="animate-spin text-indigo-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <Sparkles size={13} className="text-indigo-400" />
                )}
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                  {summaryLoading ? 'Génération en cours…' : 'Contexte'}
                </span>
              </div>
              {summaryLoading ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-indigo-200 rounded w-full" />
                  <div className="h-3 bg-indigo-200 rounded w-5/6" />
                  <div className="h-3 bg-indigo-200 rounded w-3/5" />
                </div>
              ) : (
                <p className="text-sm text-slate-600 leading-relaxed">{summary.resume}</p>
              )}
            </div>
          )}

        </div>

        {/* Answer buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleAnswer('contre')}
            className={`flex-1 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600 ${clicked === 'contre' ? 'btn-pop' : ''}`}
          >
            <ThumbsDown size={22} />
            <span className="text-sm font-bold">Contre</span>
          </button>

          <button
            onClick={() => handleAnswer('je_ne_sais_pas')}
            className={`w-20 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-white border-2 border-slate-300 text-slate-500 transition-colors hover:bg-slate-50 ${clicked === 'je_ne_sais_pas' ? 'btn-pop' : ''}`}
          >
            <Minus size={18} />
            <span className="text-xs font-medium leading-tight text-center">Sans<br />avis</span>
          </button>

          <button
            onClick={() => handleAnswer('pour')}
            className={`flex-1 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-emerald-500 text-white shadow-sm transition-colors hover:bg-emerald-600 ${clicked === 'pour' ? 'btn-pop' : ''}`}
          >
            <ThumbsUp size={22} />
            <span className="text-sm font-bold">Pour</span>
          </button>
        </div>

        <div className="pb-4">
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
