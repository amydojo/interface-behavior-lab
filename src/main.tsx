import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './workspace.css'
import './lab-dojo-v1-3.css'
import './lab-dojo-v1-3-fixes.css'
import './lab-dojo-v1-3-a11y.css'
import { SpecimenBoundary } from './components/SpecimenBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpecimenBoundary name="Interface Behavior Lab">
      <App />
    </SpecimenBoundary>
  </StrictMode>,
)
