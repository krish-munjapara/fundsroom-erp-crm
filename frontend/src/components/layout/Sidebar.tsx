import { FundsroomLogo } from '../ui';
import type { PageId } from '../../utils/permissions';
import {
  DashboardIcon,
  CustomersIcon,
  ProductsIcon,
  InventoryIcon,
  ChallansIcon,
  OrdersIcon,
  ReportsIcon,
  SettingsIcon,
  HelpIcon,
  LogoutIcon,
} from '../icons/navIcons';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onLogout?: () => void;
  allowedPages: PageId[];
  canAccessSettings: boolean;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: typeof DashboardIcon;
}

function NavButton({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        title={collapsed ? item.label : undefined}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className={`w-full flex items-center rounded-lg transition-all duration-200 group ${
          collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
        } ${
          active
            ? 'bg-primary-50 text-primary-700 shadow-sm-premium'
            : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
        }`}
      >
        <Icon
          className={`w-5 h-5 shrink-0 ${
            active ? 'text-primary-600' : 'text-navy-400 group-hover:text-navy-600'
          }`}
        />
        {!collapsed && (
          <>
            <span className="ml-3 text-sm font-medium tracking-tight truncate">{item.label}</span>
            {active && <span className="ml-auto w-1.5 h-1.5 shrink-0 bg-primary-600 rounded-full" />}
          </>
        )}
      </button>
    </li>
  );
}

export default function Sidebar({
  currentPage,
  onPageChange,
  collapsed,
  mobileOpen,
  onMobileClose,
  onLogout,
  allowedPages,
  canAccessSettings,
}: SidebarProps) {
  const navItems: NavItem[] = (
    [
      { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
      { id: 'customers', label: 'Customers', icon: CustomersIcon },
      { id: 'products', label: 'Products', icon: ProductsIcon },
      { id: 'inventory', label: 'Inventory', icon: InventoryIcon },
      { id: 'challans', label: 'Sales Challans', icon: ChallansIcon },
      { id: 'orders', label: 'Orders', icon: OrdersIcon },
      { id: 'reports', label: 'Reports', icon: ReportsIcon },
    ] as NavItem[]
  ).filter((item) => allowedPages.includes(item.id));

  const bottomItems: NavItem[] = (
    [
      ...(canAccessSettings ? [{ id: 'settings' as const, label: 'Settings', icon: SettingsIcon }] : []),
      { id: 'help' as const, label: 'Help & Support', icon: HelpIcon },
    ] as NavItem[]
  ).filter((item) => allowedPages.includes(item.id));

  const handleNavigate = (pageId: string) => {
    onPageChange(pageId);
    onMobileClose();
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar-panel bg-white border-r border-navy-200 shadow-premium ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
          {/* Brand */}
          <div
            className={`h-16 flex items-center border-b border-navy-200 bg-gradient-to-r from-navy-50 to-white shrink-0 ${
              collapsed ? 'justify-center px-2' : 'px-4'
            }`}
          >
            {collapsed ? (
              <FundsroomLogo size="md" variant="icon-only" />
            ) : (
              <FundsroomLogo size="md" variant="full" className="min-w-0" />
            )}
          </div>

          {/* Main nav — internal scroll only if menu exceeds viewport */}
          <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar min-h-0">
            <ul className={`space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={currentPage === item.id}
                  collapsed={collapsed}
                  onClick={() => handleNavigate(item.id)}
                />
              ))}
            </ul>

            <div className={`my-4 border-t border-navy-200 ${collapsed ? 'mx-2' : 'mx-3'}`} />

            <ul className={`space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
              {bottomItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={currentPage === item.id}
                  collapsed={collapsed}
                  onClick={() => handleNavigate(item.id)}
                />
              ))}
            </ul>
          </nav>

          {/* Logout */}
          <div className={`shrink-0 border-t border-navy-200 bg-navy-50/50 ${collapsed ? 'p-2' : 'p-3'}`}>
            <button
              type="button"
              onClick={onLogout}
              title={collapsed ? 'Logout' : undefined}
              aria-label="Logout"
              className={`w-full flex items-center rounded-lg text-danger-600 hover:bg-danger-50 transition-all duration-200 group ${
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
              }`}
            >
              <LogoutIcon className="w-5 h-5 shrink-0 text-danger-500 group-hover:text-danger-600" />
              {!collapsed && <span className="ml-3 text-sm font-medium tracking-tight">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
