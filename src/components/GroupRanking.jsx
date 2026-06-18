export default function GroupRanking({ scores }) {
  return (
    <div className="space-y-2">
      {scores.map((group, i) => (
        <div
          key={group.uid}
          className={`rounded-xl p-4 ${i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {i === 0 && (
                <span className="shrink-0 text-xs font-bold text-blue-600 uppercase tracking-wide bg-blue-100 px-2 py-0.5 rounded-full">
                  Le plus proche
                </span>
              )}
              <span className={`font-semibold truncate ${i === 0 ? 'text-blue-900' : 'text-slate-700'}`}>
                {group.libelle}
              </span>
              <span className="shrink-0 text-xs text-slate-500">({group.abbr})</span>
            </div>
            <span className={`shrink-0 font-bold ml-3 ${i === 0 ? 'text-blue-700' : 'text-slate-600'}`}>
              {Math.round(group.score * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${i === 0 ? 'bg-blue-500' : 'bg-slate-400'}`}
              style={{ width: `${group.score * 100}%` }}
            />
          </div>
          {i === 0 && group.urls?.page && (
            <a
              href={group.urls.page}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-blue-600 underline"
            >
              En savoir plus sur CIVIX
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
