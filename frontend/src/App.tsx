import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Fundsroom ERP CRM</h1>
            </div>
            <nav className="flex space-x-4">
              <span className="text-gray-600 text-sm">Phase 1 - Foundation</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Welcome to Fundsroom ERP CRM
          </h2>
          <p className="text-gray-600">
            This is a Mini ERP + CRM Operations Portal for wholesale/distribution companies.
            The project is being implemented phase-by-phase.
          </p>
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Current Status:</strong> Phase 1 - Project Foundation Complete
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
