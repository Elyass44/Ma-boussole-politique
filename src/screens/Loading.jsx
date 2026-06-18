export default function Loading({ steps }) {
  return (
    <div className="min-h-screen bg-blue-900 flex flex-col items-center justify-center p-6 text-white animate-fade-up">
      <div className="max-w-sm w-full space-y-8">

        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white font-semibold text-lg">Chargement de votre partie</p>
        </div>

        <div className="space-y-3">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-3">
              {i < steps.length - 1 ? (
                <span className="text-emerald-400 font-bold flex-shrink-0">✓</span>
              ) : (
                <span className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin flex-shrink-0 block" />
              )}
              <span className={`text-sm ${i < steps.length - 1 ? 'text-blue-400' : 'text-white font-medium'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
