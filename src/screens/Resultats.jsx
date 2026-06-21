import { useState } from 'react'
import Hemicycle from '../components/Hemicycle.jsx'
import GroupRanking from '../components/GroupRanking.jsx'
import QuestionReview from '../components/QuestionReview.jsx'
import ShareButton from '../components/ShareButton.jsx'

const TABS = [
  { id: 'classement', label: 'Classement' },
  { id: 'questions',  label: 'Par question' },
]

export default function Resultats({ scores, axe, answeredCount, scrutins, reponses, onReplay }) {
  const top = scores[0]
  const [tab, setTab] = useState('classement')

  return (
    <div className="min-h-screen bg-slate-50 animate-fade-up">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold text-slate-800">Vos résultats</h1>
          <p className="text-slate-500 text-sm mt-1">
            Basé sur {answeredCount} question{answeredCount > 1 ? 's' : ''} répondue{answeredCount > 1 ? 's' : ''}
          </p>
        </div>

        {/* Groupe le plus proche */}
        <div className="bg-blue-600 rounded-2xl p-6 shadow-sm text-white">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-2">
            Groupe le plus proche
          </p>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-tight truncate">{top.libelle}</h2>
              <span className="text-blue-200 text-sm">{top.abbr}</span>
            </div>
            <span className="text-4xl font-black shrink-0">{Math.round(top.score * 100)}%</span>
          </div>
          {top.urls?.page && (
            <a
              href={top.urls.page}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-xs text-blue-200 underline"
            >
              En savoir plus sur CIVIX
            </a>
          )}
        </div>

        {/* Hémicycle */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <Hemicycle scores={scores} axe={axe} />
        </div>

        {/* Onglets classement / par question */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  tab === t.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {tab === 'classement'
              ? <GroupRanking scores={scores} />
              : <QuestionReview scrutins={scrutins} reponses={reponses} scores={scores} />
            }
          </div>
        </div>

        <ShareButton scores={scores} answeredCount={answeredCount} />

        <button
          onClick={onReplay}
          className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all"
        >
          Rejouer
        </button>

        <p className="text-center text-slate-500 text-xs pb-safe-lg">
          Données Assemblée nationale via{' '}
          <a
            href="https://civix.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            CIVIX.fr
          </a>{' '}
          — Licence Ouverte Etalab 2.0
        </p>
      </div>
    </div>
  )
}
