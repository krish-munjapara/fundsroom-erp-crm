import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getPermissions } from '../../utils/permissions';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  pageTitle: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
  };
  onLogout: () => void;
}

export default function AppLayout({
  children,
  currentPage,
  onPageChange,
  pageTitle,
  user,
  onLogout,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const permissions = getPermissions(user?.role);

  return (
    <div className="min-h-screen bg-navy-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onLogout={onLogout}
        allowedPages={permissions.pages}
        canAccessSettings={permissions.canAccessSettings}
      />
      <Topbar 
        pageTitle={pageTitle} 
        user={user} 
        onLogout={onLogout}
        onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onPageChange={onPageChange}
      />
      <main
        className={`pt-20 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
