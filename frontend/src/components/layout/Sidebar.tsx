import { FundsroomLogo } from '../ui';
import type { PageId } from '../../utils/permissions';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onLogout?: () => void;
  allowedPages: PageId[];
  canAccessSettings: boolean;
}

export default function Sidebar({ currentPage, onPageChange, collapsed, onToggle, mobileOpen, onMobileClose, onLogout, allowedPages, canAccessSettings }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'customers', label: 'Customers', icon: CustomersIcon },
    { id: 'products', label: 'Products', icon: ProductsIcon },
    { id: 'inventory', label: 'Inventory', icon: InventoryIcon },
    { id: 'challans', label: 'Sales Challans', icon: ChallansIcon },
    { id: 'orders', label: 'Orders', icon: OrdersIcon },
    { id: 'reports', label: 'Reports', icon: ReportsIcon },
  ].filter((item) => allowedPages.includes(item.id as PageId));

  const bottomItems = [
    ...(canAccessSettings ? [{ id: 'settings', label: 'Settings', icon: SettingsIcon }] : []),
    { id: 'help', label: 'Help & Support', icon: HelpIcon },
  ].filter((item) => allowedPages.includes(item.id as PageId));

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}
      
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-navy-200 transition-all duration-300 z-50 ${
          collapsed ? 'w-16' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-premium`}
      >
      {/* Branding */}
      <div className="h-16 flex items-center px-4 border-b border-navy-200 bg-gradient-to-r from-navy-50 to-white">
        {!collapsed && (
          <FundsroomLogo size="md" variant="full" />
        )}
        {collapsed && (
          <FundsroomLogo size="md" variant="icon-only" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  onPageChange(item.id);
                  onMobileClose();
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  currentPage === item.id
                    ? 'bg-primary-50 text-primary-700 shadow-sm-premium'
                    : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${currentPage === item.id ? 'text-primary-600' : 'text-navy-400 group-hover:text-navy-600'} ${collapsed ? 'mx-auto' : ''}`} />
                {!collapsed && <span className="ml-3 text-sm font-medium tracking-tight">{item.label}</span>}
                {currentPage === item.id && !collapsed && (
                  <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full" />
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="my-4 border-t border-navy-200 mx-3" />

        {/* Bottom Items */}
        <ul className="space-y-1 px-3">
          {bottomItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => {
                  onPageChange(item.id);
                  onMobileClose();
                }}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  currentPage === item.id
                    ? 'bg-primary-50 text-primary-700 shadow-sm-premium'
                    : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${currentPage === item.id ? 'text-primary-600' : 'text-navy-400 group-hover:text-navy-600'} ${collapsed ? 'mx-auto' : ''}`} />
                {!collapsed && <span className="ml-3 text-sm font-medium tracking-tight">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-navy-200 bg-navy-50/50">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-3 py-2.5 rounded-lg text-danger-600 hover:bg-danger-50 transition-all duration-200 group"
        >
          <LogoutIcon className={`w-5 h-5 flex-shrink-0 text-danger-500 group-hover:text-danger-600 ${collapsed ? 'mx-auto' : ''}`} />
          {!collapsed && <span className="ml-3 text-sm font-medium tracking-tight">Logout</span>}
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-navy-200 rounded-full flex items-center justify-center shadow-premium hover:bg-navy-50 hover:border-navy-300 transition-all duration-200 hidden lg:block z-10"
      >
        {collapsed ? (
          <ChevronRightIcon className="w-4 h-4 text-navy-500" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 text-navy-500" />
        )}
      </button>
    </aside>
    </>
  );
}

// SVG Icons
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function CustomersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ProductsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function InventoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function ChallansIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
