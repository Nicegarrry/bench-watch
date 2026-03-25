import { Outlet, useLocation } from 'react-router'
import './App.css'
import { AppLayout } from './shared/components/AppLayout'

// Routes that use the sidebar+topbar layout
const APP_ROUTES = ['/intelligence', '/archive', '/settings', '/dashboard']

export function App() {
  const location = useLocation()
  const useAppLayout = APP_ROUTES.some((r) => location.pathname.startsWith(r))

  if (useAppLayout) {
    return (
      <AppLayout>
        <Outlet />
      </AppLayout>
    )
  }

  // Public pages: landing, login, signup, onboarding, auth pages
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
      <Outlet />
    </div>
  )
}
