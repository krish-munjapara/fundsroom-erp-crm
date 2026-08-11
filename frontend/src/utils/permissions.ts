export type AppRole = 'admin' | 'sales' | 'warehouse' | 'accounts';

export type PageId =
  | 'dashboard'
  | 'customers'
  | 'products'
  | 'inventory'
  | 'challans'
  | 'orders'
  | 'reports'
  | 'settings'
  | 'help';

export interface PermissionSet {
  pages: PageId[];
  canManageCustomers: boolean;
  canDeleteCustomers: boolean;
  canManageCustomerActivities: boolean;
  canManageProducts: boolean;
  canDeleteProducts: boolean;
  canManageInventory: boolean;
  canManageOrders: boolean;
  canManageChallans: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
  canAccessSettings: boolean;
}

const ALL_PAGES: PageId[] = [
  'dashboard',
  'customers',
  'products',
  'inventory',
  'challans',
  'orders',
  'reports',
  'settings',
  'help',
];

const ROLE_PERMISSIONS: Record<AppRole, PermissionSet> = {
  admin: {
    pages: ALL_PAGES,
    canManageCustomers: true,
    canDeleteCustomers: true,
    canManageCustomerActivities: true,
    canManageProducts: true,
    canDeleteProducts: true,
    canManageInventory: true,
    canManageOrders: true,
    canManageChallans: true,
    canViewReports: true,
    canExportReports: true,
    canAccessSettings: true,
  },
  sales: {
    pages: ['dashboard', 'customers', 'products', 'inventory', 'challans', 'orders', 'reports', 'help'],
    canManageCustomers: true,
    canDeleteCustomers: false,
    canManageCustomerActivities: true,
    canManageProducts: false,
    canDeleteProducts: false,
    canManageInventory: false,
    canManageOrders: true,
    canManageChallans: true,
    canViewReports: true,
    canExportReports: true,
    canAccessSettings: false,
  },
  warehouse: {
    pages: ['dashboard', 'products', 'inventory', 'challans', 'orders', 'help'],
    canManageCustomers: false,
    canDeleteCustomers: false,
    canManageCustomerActivities: false,
    canManageProducts: false,
    canDeleteProducts: false,
    canManageInventory: true,
    canManageOrders: false,
    canManageChallans: false,
    canViewReports: false,
    canExportReports: false,
    canAccessSettings: false,
  },
  accounts: {
    pages: ['dashboard', 'customers', 'products', 'inventory', 'orders', 'reports', 'help'],
    canManageCustomers: false,
    canDeleteCustomers: false,
    canManageCustomerActivities: false,
    canManageProducts: false,
    canDeleteProducts: false,
    canManageInventory: false,
    canManageOrders: false,
    canManageChallans: false,
    canViewReports: true,
    canExportReports: true,
    canAccessSettings: false,
  },
};

export function getPermissions(role?: string): PermissionSet {
  const key = role as AppRole;
  if (key && ROLE_PERMISSIONS[key]) {
    return ROLE_PERMISSIONS[key];
  }
  return ROLE_PERMISSIONS.sales;
}

export function canAccessPage(role: string | undefined, page: string): boolean {
  return getPermissions(role).pages.includes(page as PageId);
}

export function getDefaultPageForRole(role?: string): PageId {
  const pages = getPermissions(role).pages;
  return pages[0] || 'dashboard';
}
