import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getPermissions } from '../../utils/permissions';
import { readSidebarCollapsed, writeSidebarCollapsed } from './layoutConstants';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/navIcons';

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const permissions = getPermissions(user?.role);

  useEffect(() => {
    writeSidebarCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div
      className="app-shell bg-navy-50"
      data-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
    >
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onLogout={onLogout}
        allowedPages={permissions.pages}
        canAccessSettings={permissions.canAccessSettings}
      />

      {/* Toggle: fixed to viewport, positioned at sidebar right edge via CSS */}
      <button
        type="button"
        className="sidebar-toggle"
        onClick={handleToggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRightIcon className="w-4 h-4 text-navy-500" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 text-navy-500" />
        )}
      </button>

      <div className="app-main bg-navy-50">
        <Topbar
          pageTitle={pageTitle}
          user={user}
          onLogout={onLogout}
          onMobileMenuToggle={() => setMobileSidebarOpen((open) => !open)}
          onPageChange={onPageChange}
        />
        <main className="app-main-scroll">
          <div className="page-content w-full max-w-full box-border px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
