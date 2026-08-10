import { useState } from 'react'
import { AuthProvider, useAuth } from './context'
import { Customers, Products, Inventory, Orders } from './pages'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}

function MainApp() {
  const { user, isAuthenticated, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Fundsroom ERP CRM</h1>
            </div>
            <nav className="flex space-x-4">
              <span className="text-gray-600 text-sm">Welcome, {user?.first_name} {user?.last_name}</span>
              <button
                onClick={logout}
                className="text-red-600 text-sm hover:text-red-800"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentPage === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('customers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentPage === 'customers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setCurrentPage('products')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentPage === 'products' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setCurrentPage('inventory')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentPage === 'inventory' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Inventory
            </button>
            <button
              onClick={() => setCurrentPage('orders')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentPage === 'orders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Orders
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'customers' && <Customers />}
        {currentPage === 'products' && <Products />}
        {currentPage === 'inventory' && <Inventory />}
        {currentPage === 'orders' && <Orders />}
      </main>
    </div>
  )
}

function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Customers</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">-</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Products</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">-</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Orders</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">-</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Revenue</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">₹-</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 text-left">
            <div className="font-medium">Add Customer</div>
            <div className="text-sm opacity-90">Create new customer record</div>
          </button>
          <button className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 text-left">
            <div className="font-medium">Add Product</div>
            <div className="text-sm opacity-90">Create new product</div>
          </button>
          <button className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 text-left">
            <div className="font-medium">Create Order</div>
            <div className="text-sm opacity-90">Create new sales order</div>
          </button>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Phase 3 Status</h3>
        <p className="text-blue-800">
          Core business modules are now available. You can manage customers, products, inventory, and orders through the navigation menu above.
        </p>
      </div>
    </div>
  )
}

function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await login(email, password)
    } catch (err) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Fundsroom ERP CRM</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Default admin: admin@fundsroom.com / Admin@123</p>
        </div>
      </div>
    </div>
  )
}

export default App
