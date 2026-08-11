import { useState } from 'react';

interface TopbarProps {
  pageTitle: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  onLogout: () => void;
  onMobileMenuToggle: () => void;
}

export default function Topbar({ pageTitle, user, onLogout, onMobileMenuToggle }: TopbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-white border-b border-navy-200 z-40 shadow-sm-premium">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 text-navy-500 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        {/* Page Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-navy-900 tracking-tight">{pageTitle}</h1>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-4 sm:mx-8 hidden sm:block">
          <div className="relative group">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-navy-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search customers, orders, products..."
              className="w-full pl-10 pr-4 py-2.5 border border-navy-200 rounded-lg text-sm bg-navy-50/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200 placeholder-navy-400"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-navy-500 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition-colors group">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-white" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 sm:space-x-3 p-2 hover:bg-navy-100 rounded-lg transition-colors group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-sm-premium ring-2 ring-white">
                <span className="text-white text-sm font-medium">
                  {user?.first_name?.[0] || 'A'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-navy-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-navy-500">Admin</p>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-navy-400 transition-transform duration-200 hidden md:block ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg-premium border border-navy-200 py-1.5 z-20">
                  <div className="px-4 py-2 border-b border-navy-100">
                    <p className="text-sm font-medium text-navy-900">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-navy-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 flex items-center transition-colors"
                  >
                    <LogoutIcon className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// SVG Icons
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
