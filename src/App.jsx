import { useState } from 'react'
import { loadGame } from './services/civix.js'
import * as gameState from './services/gameState.js'
import { computeScores, computeAxis } from './logic/scoring.js'
import Accueil from './screens/Accueil.jsx'
import Loading from './screens/Loading.jsx'
import Quiz from './screens/Quiz.jsx'
import Resultats from './screens/Resultats.jsx'

export default function App() {
  // Tout l'état initial est dérivé de la sauvegarde au premier render
  const [step, setStep] = useState(() => gameState.load() ? 'quiz' : 'accueil')
  const [game, setGame] = useState(() => {
    const s = gameState.load()
    return s ? { scrutins: s.scrutins, groupes: s.groupes } : null
  })
  const [currentIndex, setCurrentIndex] = useState(() => gameState.load()?.currentIndex ?? 0)
  const [reponses, setReponses] = useState(() => gameState.load()?.reponses ?? [])
  const [questionCount, setQuestionCount] = useState(() => gameState.load()?.questionCount ?? 15)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loadingSteps, setLoadingSteps] = useState([])

  async function handleStart(count) {
    gameState.clear()
    setQuestionCount(count)
    setStep('loading')
    setLoadingSteps([])
    setError(null)

    const onProgress = label => setLoadingSteps(prev => [...prev, label])

    try {
      const data = await loadGame(count, onProgress)
      setGame(data)
      setCurrentIndex(0)
      setReponses([])
      setStep('quiz')
    } catch (e) {
      setError(e.message)
      setStep('accueil')
    }
  }

  function handleAnswer(reponse) {
    const newReponses = [...reponses, reponse]
    setReponses(newReponses)

    if (newReponses.length === game.scrutins.length) {
      gameState.clear()
      const scores = computeScores(game.scrutins, newReponses, game.groupes)
      const axe = computeAxis(scores)
      const answeredCount = newReponses.filter(r => r !== 'je_ne_sais_pas').length
      setResults({ scores, axe, answeredCount })
      setStep('resultats')
    } else {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      gameState.save({
        scrutins: game.scrutins,
        groupes: game.groupes,
        reponses: newReponses,
        currentIndex: nextIndex,
        questionCount,
      })
    }
  }

  function handleReplay() {
    setGame(null)
    setResults(null)
    setCurrentIndex(0)
    setReponses([])
    handleStart(questionCount)
  }

  if (step === 'loading') return <Loading steps={loadingSteps} />

  function handleAbandon() {
    gameState.clear()
    setGame(null)
    setCurrentIndex(0)
    setReponses([])
    setStep('accueil')
  }

  if (step === 'quiz') {
    return (
      <Quiz
        scrutin={game.scrutins[currentIndex]}
        currentIndex={currentIndex}
        total={game.scrutins.length}
        onAnswer={handleAnswer}
        onAbandon={handleAbandon}
      />
    )
  }

  if (step === 'resultats') {
    return (
      <Resultats
        scores={results.scores}
        axe={results.axe}
        answeredCount={results.answeredCount}
        onReplay={handleReplay}
      />
    )
  }

  return <Accueil onStart={handleStart} error={error} />
}
