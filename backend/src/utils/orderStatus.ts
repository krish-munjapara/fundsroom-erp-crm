/** Order statuses that count toward recognized revenue (confirmed sales). */
export const REVENUE_ORDER_STATUSES = [
  'confirmed',
  'processing',
  'shipped',
  'delivered',
] as const;

export const REVENUE_ORDER_STATUS_SQL = `status IN ('confirmed', 'processing', 'shipped', 'delivered')`;

export const REVENUE_ORDER_STATUS_O_SQL = `o.status IN ('confirmed', 'processing', 'shipped', 'delivered')`;
