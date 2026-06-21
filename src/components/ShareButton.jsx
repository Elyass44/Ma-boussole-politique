import { useState } from 'react'
import { Share2, Download, Check, Loader } from 'lucide-react'
import { generateShareCard } from '../utils/shareCard.js'

export default function ShareButton({ scores, answeredCount }) {
  const [status, setStatus] = useState('idle') // idle | loading | done | error

  const top = scores[0]
  const pct = Math.round(top.score * 100)

  async function handleShare() {
    if (status === 'loading') return
    setStatus('loading')

    try {
      const blob = await generateShareCard(scores, answeredCount)
      const file = new File([blob], 'ma-boussole-politique.png', { type: 'image/png' })

      // Native share with image (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Ma boussole politique',
          text: `Je vote à ${pct}% comme ${top.libelle} ! Et toi ?`,
          files: [file],
        })
        setStatus('done')
        setTimeout(() => setStatus('idle'), 2500)
        return
      }

      // Fallback: download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ma-boussole-politique.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error(e)
        setStatus('error')
        setTimeout(() => setStatus('idle'), 2500)
      } else {
        setStatus('idle')
      }
    }
  }

  const canNativeShare =
    typeof navigator !== 'undefined' &&
    !!navigator.share &&
    !!navigator.canShare

  return (
    <button
      onClick={handleShare}
      disabled={status === 'loading'}
      className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold text-sm hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
    >
      {status === 'loading' && <Loader size={20} className="animate-spin" />}
      {status === 'done'    && <Check size={20} />}
      {status === 'error'   && <span className="text-red-400">Erreur — réessaie</span>}
      {status === 'idle' && (canNativeShare ? <Share2 size={20} /> : <Download size={20} />)}

      {status === 'loading' && '…'}
      {status === 'done'    && (canNativeShare ? 'Partagé !' : 'Téléchargé !')}
      {status === 'idle'    && (canNativeShare ? 'Partager' : 'Télécharger')}
    </button>
  )
}
