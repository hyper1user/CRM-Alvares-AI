import { HashRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'

function App(): JSX.Element {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  )
}

export default App
