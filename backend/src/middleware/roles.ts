/** Business roles supported by the application */
export const APP_ROLES = ['admin', 'sales', 'warehouse', 'accounts'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ALL_APP_ROLES: AppRole[] = [...APP_ROLES];

export const DASHBOARD_ROLES: AppRole[] = [...APP_ROLES];

export const CUSTOMER_READ_ROLES: AppRole[] = ['admin', 'sales', 'accounts'];
export const CUSTOMER_WRITE_ROLES: AppRole[] = ['admin', 'sales'];

export const ACTIVITY_READ_ROLES: AppRole[] = ['admin', 'sales', 'accounts'];
export const ACTIVITY_WRITE_ROLES: AppRole[] = ['admin', 'sales'];

export const SALES_REPORT_ROLES: AppRole[] = ['admin', 'sales', 'accounts'];
export const INVENTORY_REPORT_ROLES: AppRole[] = ['admin', 'warehouse'];
