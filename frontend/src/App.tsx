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
    <div className="h-full min-h-0 overflow-y-auto bg-[#F7F8FC] flex">
      {/* Left Brand Panel - 38-40% width on desktop */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#3730A3] to-[#4F46E5] relative overflow-hidden">
        {/* Subtle decorative shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/3 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/3 rounded-full translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/2 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          {/* Logo */}
          <div className="mb-6">
            <FundsroomLogo size="xl" variant="icon-only" className="opacity-90" />
          </div>
          
          {/* Brand Name */}
          <h1 className="text-3xl xl:text-4xl font-bold text-white mb-1">FUNDSROOM</h1>
          <p className="text-lg text-white/70 mb-2 font-medium">ERP + CRM Operations Portal</p>
          
          {/* Tagline */}
          <p className="text-white/90 text-xl mb-3 leading-tight font-medium">
            Run your business smarter.
          </p>
          
          {/* Description */}
          <p className="text-white/70 text-base mb-10 leading-relaxed max-w-md">
            Manage customers, orders, inventory and business operations from one powerful platform.
          </p>
          
          {/* Feature Highlights with checkmarks */}
          <div className="space-y-3 mb-auto">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white/80">Customers</span>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white/80">Orders</span>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white/80">Inventory</span>
            </div>
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-white/80">Reports</span>
            </div>
          </div>
          
          {/* Footer */}
          <div className="pt-10">
            <p className="text-white/40 text-sm">© 2026 Fundsroom</p>
          </div>
        </div>
      </div>

      {/* Right Login Panel - 60-62% width on desktop */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-[480px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-6">
            <FundsroomLogo size="lg" variant="icon-only" />
          </div>
          
          {/* Mobile Brand Name */}
          <div className="lg:hidden text-center mb-6">
            <h1 className="text-xl font-bold text-[#111827]">FUNDSROOM</h1>
            <p className="text-[#64748B] text-sm">ERP + CRM</p>
          </div>

          {/* Welcome Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#111827] mb-2">Welcome back</h2>
            <p className="text-[#64748B]">Sign in to your Fundsroom workspace</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Email address</label>
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-[13px] bg-white border border-[#E2E8F0] rounded-lg text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-[13px] bg-white border border-[#E2E8F0] rounded-lg text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#111827] transition-colors focus:outline-none"
                  tabIndex={-1}
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

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F46E5] text-white py-[13px] rounded-lg font-medium hover:bg-[#4338CA] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[#64748B] text-sm mt-8">
            © 2026 Fundsroom. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
