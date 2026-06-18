export default function PoliticalAxis({ value }) {
  const pct = (value / 10) * 100

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Votre profil politique
      </h3>
      <div className="relative py-2">
        <div className="h-3 rounded-full bg-gradient-to-r from-rose-400 via-purple-300 to-blue-500" />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-slate-700 rounded-full shadow-md transition-all duration-500"
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>Gauche</span>
        <span>Centre</span>
        <span>Droite</span>
      </div>
      <p className="text-xs text-slate-500 mt-3 italic">
        Estimation indicative basée sur vos votes — pas un jugement de valeur.
      </p>
    </div>
  )
}
