import PoliticalAxis from '../components/PoliticalAxis.jsx'
import GroupRanking from '../components/GroupRanking.jsx'

export default function Resultats({ scores, axe, answeredCount, onReplay }) {
  return (
    <div className="min-h-screen bg-slate-50 animate-fade-up">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold text-slate-800">Vos résultats</h1>
          <p className="text-slate-500 text-sm mt-1">
            Basé sur {answeredCount} question{answeredCount > 1 ? 's' : ''} répondue{answeredCount > 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <PoliticalAxis value={axe} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Classement des groupes
          </h3>
          <GroupRanking scores={scores} />
        </div>

        <button
          onClick={onReplay}
          className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all"
        >
          Rejouer
        </button>

        <p className="text-center text-slate-500 text-xs pb-6">
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
