import { useEffect, useState } from 'react'
import { HashRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import SplashScreen from './components/layout/SplashScreen'

const SPLASH_MIN_MS = 5000

function App(): JSX.Element {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const start = Date.now()
    Promise.all([window.api.dbHealth(), window.api.appVersion()])
      .catch(() => undefined)
      .finally(() => {
        const elapsed = Date.now() - start
        const wait = Math.max(0, SPLASH_MIN_MS - elapsed)
        setTimeout(() => setReady(true), wait)
      })
  }, [])

  if (!ready) return <SplashScreen />

  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  )
}

export default App
