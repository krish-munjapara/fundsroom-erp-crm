import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/print.css'
import App from './App.tsx'
import { AuthProvider, ToastProvider, SearchProvider } from './context'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PrintProvider } from './components/print/PrintProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <SearchProvider>
          <PrintProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </PrintProvider>
        </SearchProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
