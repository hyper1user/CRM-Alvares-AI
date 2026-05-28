import { useEffect, useState } from 'react'
import { HashRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import SplashScreen from './components/layout/SplashScreen'

const SPLASH_MIN_MS = 5000
const SPLASH_LEAVE_MS = 320

function App(): JSX.Element {
  const [phase, setPhase] = useState<'splash' | 'leaving' | 'ready'>('splash')

  useEffect(() => {
    const start = Date.now()
    Promise.all([window.api.dbHealth(), window.api.appVersion()])
      .catch(() => undefined)
      .finally(() => {
        const elapsed = Date.now() - start
        const wait = Math.max(0, SPLASH_MIN_MS - elapsed)
        setTimeout(() => {
          setPhase('leaving')
          setTimeout(() => setPhase('ready'), SPLASH_LEAVE_MS)
        }, wait)
      })
  }, [])

  return (
    <>
      {phase !== 'ready' && <SplashScreen leaving={phase === 'leaving'} />}
      {phase !== 'splash' && (
        <HashRouter>
          <AppLayout />
        </HashRouter>
      )}
    </>
  )
}

export default App
