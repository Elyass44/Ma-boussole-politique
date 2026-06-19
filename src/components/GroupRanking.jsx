export default function GroupRanking({ scores }) {
  return (
    <div className="space-y-2">
      {scores.map((group, i) => (
        <div key={group.uid} className="rounded-xl p-4 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold truncate text-slate-700">{group.libelle}</span>
              <span className="shrink-0 text-xs text-slate-500">({group.abbr})</span>
            </div>
            <span className="shrink-0 font-bold ml-3 text-slate-600">
              {Math.round(group.score * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-400 transition-all duration-500"
              style={{ width: `${group.score * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
