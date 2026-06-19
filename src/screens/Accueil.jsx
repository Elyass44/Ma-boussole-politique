import { useState, useEffect } from 'react'

const COUNTS = [
  { value: 15, duration: '~2 min', desc: 'Rapide' },
  { value: 30, duration: '~4 min', desc: 'Précis' },
  { value: 50, duration: '~7 min', desc: 'Très précis' },
]

export default function Accueil({ onStart, error }) {
  const [count, setCount] = useState(15)
  const [agreed, setAgreed] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  const misAJour = stats?.mis_a_jour
    ? new Date(stats.mis_a_jour).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-6 text-white animate-fade-up">
      <div className="max-w-md w-full space-y-6">

        {/* Titre */}
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Ma boussole politique</h1>
          <p className="text-blue-200 text-lg leading-relaxed">
            Votez sur des lois réelles de l'Assemblée nationale et découvrez quel groupe parlementaire est le plus proche de vos convictions.
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex justify-center gap-6 py-1">
            {[
              { value: stats.nb_lois, label: 'lois' },
              { value: stats.nb_groupes, label: 'groupes' },
              { value: `17e`, label: 'législature' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-black text-white">{s.value}</p>
                <p className="text-xs text-blue-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Question count */}
        <div className="space-y-3">
          <p className="text-sm text-blue-300 font-medium">Nombre de questions</p>
          <div className="grid grid-cols-3 gap-2">
            {COUNTS.map(c => (
              <button
                key={c.value}
                onClick={() => setCount(c.value)}
                className={`flex flex-col items-center py-4 px-2 rounded-xl border-2 transition-all ${
                  count === c.value
                    ? 'bg-white text-blue-900 border-white'
                    : 'bg-transparent text-white border-blue-700 hover:border-blue-400'
                }`}
              >
                <span className="text-2xl font-bold">{c.value}</span>
                <span className={`text-xs mt-1 ${count === c.value ? 'text-blue-500' : 'text-blue-400'}`}>{c.duration}</span>
                <span className={`text-xs font-medium mt-0.5 ${count === c.value ? 'text-blue-700' : 'text-blue-300'}`}>{c.desc}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-400">
            Plus vous répondez de questions, plus le résultat est fiable.
          </p>
        </div>

        {/* Privacy */}
        <div className="bg-blue-800/40 border border-blue-700/50 rounded-xl p-4 space-y-3">
          <p className="text-sm text-blue-200 leading-relaxed">
            Aucune donnée personnelle n'est collectée ni transmise. Vos réponses et votre progression restent uniquement dans votre navigateur.
          </p>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="w-5 h-5 flex-shrink-0 accent-blue-400"
            />
            <span className="text-sm text-white font-medium">J'ai compris</span>
          </label>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <button
          onClick={() => onStart(count)}
          disabled={!agreed}
          className={`w-full bg-white text-blue-900 font-bold text-lg py-4 rounded-xl transition-all ${
            agreed ? 'hover:bg-blue-50 active:scale-95' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          Commencer
        </button>

        <p className="text-center text-blue-500 text-xs leading-relaxed">
          Données issues de l'Assemblée nationale via{' '}
          <a href="https://civix.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
            CIVIX.fr
          </a>
          {misAJour && ` — mises à jour le ${misAJour}`}
        </p>

      </div>
    </div>
  )
}
