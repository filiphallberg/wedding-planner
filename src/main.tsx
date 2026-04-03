import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { RealtimeProvider } from '@upstash/realtime/client'
import './index.css'
import App from './App.tsx'
import { appUrl } from './lib/appUrl'

const clerkPk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const root = createRoot(document.getElementById('root')!)

const shell = (
  <RealtimeProvider api={{ url: appUrl('/api/realtime'), withCredentials: true }}>
    <App />
  </RealtimeProvider>
)

if (clerkPk) {
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={clerkPk}>{shell}</ClerkProvider>
    </StrictMode>,
  )
} else {
  root.render(<StrictMode>{shell}</StrictMode>)
}
