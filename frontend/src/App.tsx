import { useState, useEffect } from 'react'
import { useAuth, usePermissions, useToast } from './context'
import { Customers, Products, Inventory, Orders, Dashboard, Reports, Challans, Settings, Help } from './pages'
import AppLayout from './components/layout/AppLayout'
import { FundsroomLogo } from './components/ui'
import { canAccessPage, getDefaultPageForRole } from './utils/permissions'
import './App.css'

function App() {
  return <MainApp />
}

function MainApp() {
  const { user, isAuthenticated, logout, loading } = useAuth()
  const permissions = usePermissions()
  const [currentPage, setCurrentPage] = useState('dashboard')

  useEffect(() => {
    if (user && !canAccessPage(user.role, currentPage)) {
      setCurrentPage(getDefaultPageForRole(user.role))
    }
  }, [user, currentPage])

  const handlePageChange = (page: string) => {
    if (canAccessPage(user?.role, page)) {
      setCurrentPage(page)
    }
  }

  if (loading) {
    return (
      <div className="h-full bg-navy-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard'
      case 'customers': return 'Customers'
      case 'products': return 'Products'
      case 'inventory': return 'Inventory'
      case 'challans': return 'Sales Challans'
      case 'orders': return 'Orders'
      case 'reports': return 'Reports'
      case 'settings': return 'Settings'
      case 'help': return 'Help & Support'
      default: return 'Dashboard'
    }
  }

  return (
    <AppLayout
      currentPage={currentPage}
      onPageChange={handlePageChange}
      pageTitle={getPageTitle()}
      user={user ? { first_name: user.first_name, last_name: user.last_name, email: user.email, role: user.role } : undefined}
      onLogout={logout}
    >
      {currentPage === 'dashboard' && <Dashboard onPageChange={handlePageChange} />}
      {currentPage === 'customers' && <Customers />}
      {currentPage === 'products' && <Products />}
      {currentPage === 'inventory' && <Inventory />}
      {currentPage === 'challans' && <Challans />}
      {currentPage === 'orders' && <Orders />}
      {currentPage === 'reports' && permissions.canViewReports && <Reports />}
      {currentPage === 'settings' && permissions.canAccessSettings && <Settings />}
      {currentPage === 'help' && <Help />}
      {currentPage === 'reports' && !permissions.canViewReports && (
        <AccessDenied message="Your role does not have access to Reports." />
      )}
      {currentPage === 'settings' && !permissions.canAccessSettings && (
        <AccessDenied message="Settings are available to administrators only." />
      )}
    </AppLayout>
  )
}

function AccessDenied({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-8 text-center">
      <h2 className="text-lg font-semibold text-navy-900 mb-2">Access Restricted</h2>
      <p className="text-navy-600">{message}</p>
    </div>
  )
}

const LOGIN_FEATURES = [
  {
    title: 'Customers',
    description: 'Manage customer relationships',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Orders',
    description: 'Create and track orders',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Inventory',
    description: 'Track stock in real-time',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    title: 'Reports',
    description: 'Powerful analytics & insights',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
] as const

function LoginPage() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      showToast('Signed in successfully', 'success')
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full min-h-0 lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-[#F8F9FC]">
      {/* Left Brand Panel */}
      <div className="login-brand-panel hidden lg:flex lg:w-[45%] relative overflow-hidden shrink-0">
        <div className="absolute inset-0 login-dots-pattern pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 login-wave-lines pointer-events-none" aria-hidden="true" />
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/[0.04] rounded-full blur-2xl" aria-hidden="true" />
        <div className="absolute top-1/3 -right-16 w-64 h-64 bg-indigo-400/10 rounded-[2rem] rotate-12" aria-hidden="true" />
        <div className="absolute bottom-16 left-8 w-48 h-48 bg-violet-500/10 rounded-full blur-xl" aria-hidden="true" />

        <div className="relative z-10 flex flex-col h-full px-10 xl:px-14 py-8 xl:py-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm shadow-lg shadow-indigo-950/20">
            <FundsroomLogo size="lg" variant="icon-only" />
          </div>

          <div className="mt-8">
            <h1 className="text-2xl xl:text-3xl font-bold text-white tracking-wide">FUNDSROOM</h1>
            <p className="text-sm xl:text-base text-white/70 font-medium mt-1">ERP + CRM Operations Portal</p>
            <div className="mt-4 h-0.5 w-12 bg-gradient-to-r from-indigo-300 to-violet-400 rounded-full" />
          </div>

          <div className="mt-6 xl:mt-8">
            <h2 className="text-xl xl:text-2xl font-semibold text-white leading-snug">
              Run your business smarter.
            </h2>
            <p className="mt-3 text-sm xl:text-[15px] text-white/65 leading-relaxed max-w-md">
              Manage customers, orders, inventory and business operations from one powerful platform.
            </p>
          </div>

          <div className="mt-6 xl:mt-8 space-y-4">
            {LOGIN_FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white/80">
                  {feature.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{feature.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <div className="rounded-xl bg-white/[0.08] border border-white/10 backdrop-blur-sm px-4 py-3.5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-white/80">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">Secure. Reliable. Always Available.</p>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Your business data is protected with enterprise-grade security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-[55%] flex flex-col min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10 lg:py-8">
          <div className="w-full max-w-[420px]">
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#3730A3] shadow-md mb-3">
                <FundsroomLogo size="md" variant="icon-only" />
              </div>
              <h1 className="text-lg font-bold text-[#111827] tracking-wide">FUNDSROOM</h1>
              <p className="text-[#64748B] text-sm">ERP + CRM Operations Portal</p>
            </div>

            <div className="mb-6 lg:mb-7">
              <h2 className="text-2xl sm:text-[1.75rem] font-bold text-[#111827] mb-1.5">
                Welcome back <span aria-hidden="true">👋</span>
              </h2>
              <p className="text-[#64748B] text-sm sm:text-base">Sign in to your Fundsroom workspace</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-[#111827] mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#111827] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/25 focus:border-[#4F46E5] transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-[#111827] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-white border border-[#E2E8F0] rounded-xl text-[#111827] placeholder-[#94A3B8] text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/25 focus:border-[#4F46E5] transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#111827] transition-colors focus:outline-none focus:text-[#111827]"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 cursor-default select-none">
                  <input
                    type="checkbox"
                    defaultChecked={false}
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#4F46E5] focus:ring-[#4F46E5]/30 pointer-events-none"
                  />
                  <span className="text-sm text-[#64748B]">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-[#4F46E5] hover:text-[#4338CA] transition-colors focus:outline-none focus:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white py-3 rounded-xl font-medium hover:from-[#4338CA] hover:to-[#4F46E5] disabled:from-[#9CA3AF] disabled:to-[#9CA3AF] disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 shadow-md shadow-indigo-500/20"
              >
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <p className="text-center text-sm text-[#64748B] mt-6">
              Don&apos;t have an account?{' '}
              <span className="text-[#4F46E5] font-medium">Contact your administrator</span>
            </p>
          </div>
        </div>

        <p className="text-center text-[#94A3B8] text-xs pb-6 lg:pb-8 shrink-0">
          © 2026 Fundsroom. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default App
