import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { EmptyState } from '../ui';
import { formatCompactCurrency, formatCurrency } from '../../utils/formatters';
import { computeNiceAxisScale } from '../../utils/chartScale';

export interface SalesTrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface SalesReportData {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  pending_order_value?: number;
  pending_orders?: number;
  confirmed_orders?: number;
  orders_by_status?: Record<string, number>;
  revenue_by_month?: Array<{ month: string; revenue: number }>;
  sales_trend?: SalesTrendPoint[];
  sales_by_customer?: Array<{
    customer_id: number;
    company_name: string;
    total_orders: number;
    total_revenue: number;
  }>;
  sales_by_product?: Array<{
    product_id: number;
    product_name: string;
    sku: string;
    total_quantity: number;
    total_revenue: number;
  }>;
}

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[10rem] items-center justify-center rounded-lg border border-dashed border-navy-200 bg-navy-50/50 px-4 text-center">
      <p className="text-sm text-navy-500">{message}</p>
    </div>
  );
}

function parseChartDateValue(dateString: string) {
  if (dateString.includes('T')) {
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour = 0, minute = 0] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute);
  }
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

function buildStatusChartData(ordersByStatus: Record<string, number> = {}) {
  const confirmed =
    (ordersByStatus.confirmed || 0) +
    (ordersByStatus.processing || 0) +
    (ordersByStatus.shipped || 0);
  const pending = ordersByStatus.pending || 0;
  const delivered = ordersByStatus.delivered || 0;
  const cancelled = ordersByStatus.cancelled || 0;

  const segments = [
    { name: 'Confirmed', key: 'confirmed', value: confirmed, color: STATUS_COLORS.confirmed },
    { name: 'Pending', key: 'pending', value: pending, color: STATUS_COLORS.pending },
    { name: 'Delivered', key: 'delivered', value: delivered, color: STATUS_COLORS.delivered },
    { name: 'Cancelled', key: 'cancelled', value: cancelled, color: STATUS_COLORS.cancelled },
  ].filter((segment) => segment.value > 0);

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return { segments, total };
}

interface SalesReportViewProps {
  data: SalesReportData;
  loading?: boolean;
}

export default function SalesReportView({ data, loading = false }: SalesReportViewProps) {
  const [trendView, setTrendView] = useState<'revenue' | 'orders'>('revenue');
  const [productView, setProductView] = useState<'revenue' | 'quantity'>('revenue');

  const salesTrend = useMemo(
    () =>
      (data.sales_trend || []).map((item) => ({
        date: String(item.date).split('.')[0],
        revenue: Number(item.revenue ?? 0),
        orders: Number(item.orders ?? 0),
      })),
    [data.sales_trend]
  );

  const isHourlyChart = useMemo(
    () => salesTrend.some((item) => String(item.date).includes('T')),
    [salesTrend]
  );

  const formatChartDate = (dateString: string) => {
    const date = parseChartDateValue(String(dateString));
    if (isHourlyChart) {
      return date.toLocaleTimeString('en-IN', { hour: 'numeric', hour12: true });
    }
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const formatTooltipDate = (dateString: string) => {
    const date = parseChartDateValue(String(dateString));
    if (isHourlyChart) {
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const trendMetricKey = trendView === 'revenue' ? 'revenue' : 'orders';
  const hasTrendData = salesTrend.some(
    (item) => Number(item.revenue ?? 0) > 0 || Number(item.orders ?? 0) > 0
  );

  const chartMaxValue = useMemo(() => {
    if (!hasTrendData) return 0;
    return Math.max(...salesTrend.map((item) => Number(item[trendMetricKey] ?? 0)));
  }, [salesTrend, trendMetricKey, hasTrendData]);

  const yAxisScale = useMemo(
    () => computeNiceAxisScale(chartMaxValue, trendView),
    [chartMaxValue, trendView]
  );

  const xAxisInterval = salesTrend.length > 14 ? Math.ceil(salesTrend.length / 7) - 1 : 0;

  const formatYAxisTick = (value: number) => {
    if (trendView === 'revenue') return formatCompactCurrency(value);
    return Number.isInteger(value) ? value.toString() : Math.round(value).toString();
  };

  const { segments: statusSegments, total: statusTotal } = useMemo(
    () => buildStatusChartData(data.orders_by_status),
    [data.orders_by_status]
  );

  const customerChartData = useMemo(
    () =>
      (data.sales_by_customer || []).slice(0, 8).map((customer) => ({
        name:
          customer.company_name.length > 18
            ? `${customer.company_name.slice(0, 16)}…`
            : customer.company_name,
        fullName: customer.company_name,
        revenue: Number(customer.total_revenue ?? 0),
        orders: Number(customer.total_orders ?? 0),
      })),
    [data.sales_by_customer]
  );

  const productChartData = useMemo(
    () =>
      (data.sales_by_product || []).slice(0, 8).map((product) => ({
        name:
          product.product_name.length > 16
            ? `${product.product_name.slice(0, 14)}…`
            : product.product_name,
        fullName: product.product_name,
        revenue: Number(product.total_revenue ?? 0),
        quantity: Number(product.total_quantity ?? 0),
      })),
    [data.sales_by_product]
  );

  const hasCustomerData = customerChartData.some((item) => item.revenue > 0);
  const hasProductData = productChartData.some(
    (item) => item.revenue > 0 || item.quantity > 0
  );

  const productMetricKey = productView === 'revenue' ? 'revenue' : 'quantity';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-navy-900">Sales Report</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
          <p className="text-sm text-navy-600">Total Orders</p>
          <p className="text-2xl font-bold text-navy-900">{data.total_orders}</p>
        </div>
        <div className="bg-success-50 p-4 rounded-xl border border-success-100">
          <p className="text-sm text-navy-600">Confirmed Revenue</p>
          <p className="text-2xl font-bold text-navy-900">{formatCurrency(data.total_revenue)}</p>
          <p className="text-xs text-navy-500 mt-1">Excludes pending orders</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <p className="text-sm text-navy-600">Avg Confirmed Order</p>
          <p className="text-2xl font-bold text-navy-900">{formatCurrency(data.average_order_value)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
          <p className="text-sm text-navy-600">Pending Orders</p>
          <p className="text-2xl font-bold text-navy-900">
            {data.pending_orders ?? data.orders_by_status?.pending ?? 0}
          </p>
        </div>
        <div className="bg-navy-50 p-4 rounded-xl border border-navy-100">
          <p className="text-sm text-navy-600">Pending Order Value</p>
          <p className="text-2xl font-bold text-navy-900">
            {formatCurrency(data.pending_order_value ?? 0)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 min-w-0">
        <div className="bg-navy-50/40 rounded-xl border border-navy-200 p-5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-navy-900">Sales Trend</h3>
              <p className="text-xs text-navy-500 mt-0.5">Revenue and orders over time</p>
            </div>
            <div className="flex items-center space-x-1 bg-navy-100 rounded-lg p-1 self-start">
              <button
                type="button"
                onClick={() => setTrendView('revenue')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  trendView === 'revenue'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setTrendView('orders')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  trendView === 'orders'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                Orders
              </button>
            </div>
          </div>

          <div className="h-52 w-full min-w-0 relative">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-lg">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}
            {hasTrendData ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportsSalesTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    interval={xAxisInterval}
                    minTickGap={20}
                  />
                  <YAxis
                    tickFormatter={formatYAxisTick}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={trendView === 'revenue' ? 52 : 28}
                    domain={yAxisScale.domain}
                    ticks={yAxisScale.ticks}
                    allowDecimals={trendView !== 'orders'}
                  />
                  <Tooltip
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const value = Number(payload[0].value ?? 0);
                      return (
                        <div className="bg-white border border-navy-200 rounded-lg shadow-sm-premium px-3 py-2.5 text-xs">
                          <p className="text-[11px] text-navy-500 mb-1">Date</p>
                          <p className="font-medium text-navy-900 mb-2">
                            {formatTooltipDate(String(label))}
                          </p>
                          <p className="text-[11px] text-navy-500 mb-0.5">
                            {trendView === 'revenue' ? 'Revenue' : 'Orders'}
                          </p>
                          <p className="font-semibold text-primary-700">
                            {trendView === 'revenue' ? formatCurrency(value) : value}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={trendMetricKey}
                    stroke="none"
                    fill="url(#reportsSalesTrendGradient)"
                    isAnimationActive
                    animationDuration={400}
                  />
                  <Line
                    type="monotone"
                    dataKey={trendMetricKey}
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', stroke: '#fff', strokeWidth: 2, r: 3 }}
                    activeDot={{ fill: '#6366f1', stroke: '#fff', strokeWidth: 2, r: 6 }}
                    connectNulls
                    isAnimationActive
                    animationDuration={400}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty message="No sales trend data for the selected period" />
            )}
          </div>
        </div>

        <div className="bg-navy-50/40 rounded-xl border border-navy-200 p-5 min-w-0">
          <div className="mb-4">
            <h3 className="font-semibold text-navy-900">Orders by Status</h3>
            <p className="text-xs text-navy-500 mt-0.5">Distribution of order statuses</p>
          </div>

          {statusTotal > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
              <div className="h-52 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusSegments}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                      isAnimationActive
                    >
                      {statusSegments.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as (typeof statusSegments)[number];
                        const pct = statusTotal
                          ? ((item.value / statusTotal) * 100).toFixed(1)
                          : '0';
                        return (
                          <div className="bg-white border border-navy-200 rounded-lg shadow-sm-premium px-3 py-2 text-xs">
                            <p className="font-medium text-navy-900">{item.name}</p>
                            <p className="text-navy-600 mt-1">
                              {item.value} orders ({pct}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 min-w-[9rem]">
                {statusSegments.map((segment) => {
                  const pct = statusTotal
                    ? ((segment.value / statusTotal) * 100).toFixed(1)
                    : '0';
                  return (
                    <div key={segment.key} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="text-navy-700 truncate">{segment.name}</span>
                      </div>
                      <span className="font-medium text-navy-900 shrink-0">
                        {segment.value} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <ChartEmpty message="No orders recorded for the selected period" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 min-w-0">
        <div className="bg-navy-50/40 rounded-xl border border-navy-200 p-5 min-w-0">
          <div className="mb-4">
            <h3 className="font-semibold text-navy-900">Sales by Customer</h3>
            <p className="text-xs text-navy-500 mt-0.5">Top customers by confirmed revenue</p>
          </div>
          {hasCustomerData ? (
            <div className="h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={customerChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => formatCompactCurrency(Number(value))}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as (typeof customerChartData)[number];
                      return (
                        <div className="bg-white border border-navy-200 rounded-lg shadow-sm-premium px-3 py-2 text-xs">
                          <p className="font-medium text-navy-900 mb-1">{item.fullName}</p>
                          <p className="text-navy-600">Revenue: {formatCurrency(item.revenue)}</p>
                          <p className="text-navy-600">Orders: {item.orders}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty message="No customer sales for the selected period" />
          )}
        </div>

        <div className="bg-navy-50/40 rounded-xl border border-navy-200 p-5 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="font-semibold text-navy-900">Sales by Product</h3>
              <p className="text-xs text-navy-500 mt-0.5">Top products in the selected period</p>
            </div>
            <div className="flex items-center space-x-1 bg-navy-100 rounded-lg p-1 self-start">
              <button
                type="button"
                onClick={() => setProductView('revenue')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  productView === 'revenue'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                Revenue
              </button>
              <button
                type="button"
                onClick={() => setProductView('quantity')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  productView === 'quantity'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                Quantity
              </button>
            </div>
          </div>
          {hasProductData ? (
            <div className="h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tickFormatter={(value) =>
                      productView === 'revenue'
                        ? formatCompactCurrency(Number(value))
                        : String(value)
                    }
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={productView === 'quantity' ? false : true}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload as (typeof productChartData)[number];
                      return (
                        <div className="bg-white border border-navy-200 rounded-lg shadow-sm-premium px-3 py-2 text-xs">
                          <p className="font-medium text-navy-900 mb-1">{item.fullName}</p>
                          <p className="text-navy-600">Revenue: {formatCurrency(item.revenue)}</p>
                          <p className="text-navy-600">Quantity: {item.quantity}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey={productMetricKey}
                    fill="#8b5cf6"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty message="No product sales for the selected period" />
          )}
        </div>
      </div>

      <div className="space-y-6 pt-2 border-t border-navy-200">
        <h3 className="font-semibold text-navy-900">Detailed Data</h3>

        <div>
          <h4 className="text-sm font-medium text-navy-700 mb-2">Orders by Status</h4>
          {Object.keys(data.orders_by_status || {}).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.orders_by_status || {}).map(([status, count]) => (
                <div key={status} className="flex justify-between border-b border-navy-200 pb-2">
                  <span className="capitalize text-navy-700">{status}</span>
                  <span className="font-medium text-navy-900">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-navy-500">No status breakdown available.</p>
          )}
        </div>

        {data.revenue_by_month && data.revenue_by_month.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-navy-700 mb-2">Sales by Date</h4>
            <div className="space-y-2">
              {data.revenue_by_month.map((item) => (
                <div key={item.month} className="flex justify-between border-b border-navy-200 pb-2">
                  <span className="text-navy-700">{item.month}</span>
                  <span className="font-medium text-navy-900">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.sales_by_customer && data.sales_by_customer.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-navy-700 mb-2">Sales by Customer</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-navy-200">
                    <th className="text-left py-2 text-navy-600">Customer</th>
                    <th className="text-right py-2 text-navy-600">Orders</th>
                    <th className="text-right py-2 text-navy-600">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales_by_customer.map((customer) => (
                    <tr key={customer.customer_id} className="border-b border-navy-200">
                      <td className="py-2 text-navy-900">{customer.company_name}</td>
                      <td className="text-right py-2 text-navy-900">{customer.total_orders}</td>
                      <td className="text-right py-2 text-navy-900">
                        {formatCurrency(customer.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.sales_by_product && data.sales_by_product.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-navy-700 mb-2">Sales by Product</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-navy-200">
                    <th className="text-left py-2 text-navy-600">Product</th>
                    <th className="text-left py-2 text-navy-600">SKU</th>
                    <th className="text-right py-2 text-navy-600">Quantity</th>
                    <th className="text-right py-2 text-navy-600">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales_by_product.map((product) => (
                    <tr key={product.product_id} className="border-b border-navy-200">
                      <td className="py-2 text-navy-900">{product.product_name}</td>
                      <td className="py-2 text-navy-900">{product.sku}</td>
                      <td className="text-right py-2 text-navy-900">{product.total_quantity}</td>
                      <td className="text-right py-2 text-navy-900">
                        {formatCurrency(product.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.total_orders === 0 &&
          !data.sales_by_customer?.length &&
          !data.sales_by_product?.length && (
            <EmptyState
              title="No sales activity"
              description="There are no sales records for the selected date range."
            />
          )}
      </div>
    </div>
  );
}
