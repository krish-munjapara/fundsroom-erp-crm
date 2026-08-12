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

export type ReportTypeId = 'sales' | 'customers' | 'products' | 'inventory';

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
  canManageUsers: boolean;
  allowedReportTypes: ReportTypeId[];
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

const ALL_REPORT_TYPES: ReportTypeId[] = ['sales', 'customers', 'products', 'inventory'];
const SALES_REPORT_TYPES: ReportTypeId[] = ['sales', 'customers', 'products'];
const INVENTORY_REPORT_TYPES: ReportTypeId[] = ['inventory'];

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
    canManageUsers: true,
    allowedReportTypes: ALL_REPORT_TYPES,
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
    canManageUsers: false,
    allowedReportTypes: SALES_REPORT_TYPES,
  },
  warehouse: {
    pages: ['dashboard', 'products', 'inventory', 'challans', 'orders', 'reports', 'help'],
    canManageCustomers: false,
    canDeleteCustomers: false,
    canManageCustomerActivities: false,
    canManageProducts: false,
    canDeleteProducts: false,
    canManageInventory: true,
    canManageOrders: false,
    canManageChallans: false,
    canViewReports: true,
    canExportReports: true,
    canAccessSettings: false,
    canManageUsers: false,
    allowedReportTypes: INVENTORY_REPORT_TYPES,
  },
  accounts: {
    pages: ['dashboard', 'customers', 'products', 'inventory', 'challans', 'orders', 'reports', 'help'],
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
    canManageUsers: false,
    allowedReportTypes: SALES_REPORT_TYPES,
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

export function canAccessReportType(role: string | undefined, reportType: ReportTypeId): boolean {
  return getPermissions(role).allowedReportTypes.includes(reportType);
}
