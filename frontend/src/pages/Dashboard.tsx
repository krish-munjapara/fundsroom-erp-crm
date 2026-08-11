import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth, usePermissions } from '../context';
import { dashboardService } from '../services/dashboardService';
import { formatCompactCurrency, formatCurrency, formatDate } from '../utils/formatters';
import { computeNiceAxisScale } from '../utils/chartScale';
import { KPICard } from '../components/ui';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
} from 'recharts';

interface DashboardStats {
  total_customers: number;
  total_products: number;
  total_orders: number;
  total_sales: number;
  low_stock_count: number;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

interface DashboardProps {
  onPageChange?: (page: string) => void;
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  order_date: string;
}

interface RecentActivity {
  id: number;
  customer_name: string;
  activity_type: string;
  subject: string;
  status: string;
  created_at: string;
}

interface SalesTrendItem {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: number;
  name: string;
  sku: string;
  units_sold: number;
  revenue: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  needed: number;
}

export default function Dashboard({ onPageChange }: DashboardProps = {}) {
  const { isAuthenticated, user } = useAuth();
  const permissions = usePermissions();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrendItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | '3m' | '6m' | '1y' | 'custom'>('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [chartView, setChartView] = useState<'revenue' | 'orders'>('revenue');
  const hasLoadedRef = useRef(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleDateFilterChange = (filter: 'today' | '7d' | '30d' | '3m' | '6m' | '1y' | 'custom') => {
    setDateFilter(filter);
  };

  const getPeriodLabel = () => {
    const labels: Record<string, string> = {
      'today': 'Today',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '3m': 'Last 3 Months',
      '6m': 'Last 6 Months',
      '1y': 'Last Year',
      'custom': 'Custom Range'
    };
    return labels[dateFilter] || 'Today';
  };

  const isHourlyChart = useMemo(
    () => salesTrend.some((item) => String(item.date).includes('T')),
    [salesTrend]
  );

  const parseChartDateValue = (dateString: string) => {
    if (dateString.includes('T')) {
      const [datePart, timePart] = dateString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour = 0, minute = 0] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hour, minute);
    }
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

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

  const formatYAxisTick = (value: number) => {
    if (chartView === 'revenue') {
      return formatCompactCurrency(value);
    }
    return Number.isInteger(value) ? value.toString() : Math.round(value).toString();
  };

  const chartTotals = useMemo(() => ({
    revenue: salesTrend.reduce((sum, item) => sum + Number(item.revenue ?? 0), 0),
    orders: salesTrend.reduce((sum, item) => sum + Number(item.orders ?? 0), 0),
  }), [salesTrend]);

  const chartMetricKey = chartView === 'revenue' ? 'revenue' : 'orders';
  const chartMaxValue = useMemo(() => {
    if (salesTrend.length === 0) return 0;
    return Math.max(...salesTrend.map((item) => Number(item[chartMetricKey] ?? 0)));
  }, [salesTrend, chartMetricKey]);

  const yAxisScale = useMemo(
    () => computeNiceAxisScale(chartMaxValue, chartView),
    [chartMaxValue, chartView]
  );

  const xAxisInterval = salesTrend.length > 14 ? Math.ceil(salesTrend.length / 7) - 1 : 0;

  const hasChartData = salesTrend.length > 0;

  const getPeriodParams = useCallback(() => {
    const periodMap: Record<string, string> = {
      today: 'today',
      '7d': 'week',
      '30d': 'month',
      '3m': '3months',
      '6m': '6months',
      '1y': 'year',
      custom: 'all',
    };
    const chartPeriod = dateFilter === 'custom' ? 'all' : (periodMap[dateFilter] || 'month');
    const statsPeriod = dateFilter === 'custom' ? 'all' : (periodMap[dateFilter] || 'all');
    const startDate = dateFilter === 'custom' ? customStartDate : undefined;
    const endDate = dateFilter === 'custom' ? customEndDate : undefined;
    return { chartPeriod, statsPeriod, startDate, endDate };
  }, [dateFilter, customStartDate, customEndDate]);

  const normalizeTrend = (data: SalesTrendItem[]) =>
    data.map((item) => ({
      date: String(item.date).split('.')[0],
      revenue: Number(item.revenue ?? 0),
      orders: Number(item.orders ?? 0),
    }));

  const loadPeriodData = useCallback(async () => {
    const { chartPeriod, statsPeriod, startDate, endDate } = getPeriodParams();
    setChartLoading(true);
    setError(null);

    try {
      const [statsRes, trendRes] = await Promise.all([
        dashboardService.getStats(statsPeriod, startDate, endDate),
        dashboardService.getSalesTrend(chartPeriod, startDate, endDate),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats({
          total_customers: Number(statsRes.data.total_customers ?? 0),
          total_products: Number(statsRes.data.total_products ?? 0),
          total_orders: Number(statsRes.data.total_orders ?? 0),
          total_sales: Number(statsRes.data.total_sales ?? 0),
          low_stock_count: Number(statsRes.data.low_stock_count ?? 0),
          pending_orders: Number(statsRes.data.pending_orders ?? 0),
          confirmed_orders: Number(statsRes.data.confirmed_orders ?? 0),
          delivered_orders: Number(statsRes.data.delivered_orders ?? 0),
          cancelled_orders: Number(statsRes.data.cancelled_orders ?? 0),
        });
      }

      if (trendRes.success) {
        setSalesTrend(normalizeTrend(trendRes.data || []));
      }
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setChartLoading(false);
    }
  }, [getPeriodParams]);

  const loadDashboardData = useCallback(async () => {
    const { chartPeriod, statsPeriod, startDate, endDate } = getPeriodParams();

    try {
      setLoading(true);
      setError(null);

      const [statsRes, ordersRes, activitiesRes, trendRes, topProductsRes, lowStockRes] = await Promise.all([
        dashboardService.getStats(statsPeriod, startDate, endDate),
        dashboardService.getRecentOrders(5),
        dashboardService.getRecentActivities(5),
        dashboardService.getSalesTrend(chartPeriod, startDate, endDate),
        dashboardService.getTopProducts(5),
        dashboardService.getLowStockProducts(10),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats({
          total_customers: Number(statsRes.data.total_customers ?? 0),
          total_products: Number(statsRes.data.total_products ?? 0),
          total_orders: Number(statsRes.data.total_orders ?? 0),
          total_sales: Number(statsRes.data.total_sales ?? 0),
          low_stock_count: Number(statsRes.data.low_stock_count ?? 0),
          pending_orders: Number(statsRes.data.pending_orders ?? 0),
          confirmed_orders: Number(statsRes.data.confirmed_orders ?? 0),
          delivered_orders: Number(statsRes.data.delivered_orders ?? 0),
          cancelled_orders: Number(statsRes.data.cancelled_orders ?? 0),
        });
      }
      if (ordersRes.success) {
        setRecentOrders(
          (ordersRes.data || []).map((order: RecentOrder) => ({
            ...order,
            total_amount: Number(order.total_amount ?? 0),
          }))
        );
      }
      if (activitiesRes.success) setRecentActivities(activitiesRes.data || []);
      if (trendRes.success) setSalesTrend(normalizeTrend(trendRes.data || []));
      if (topProductsRes.success) setTopProducts(topProductsRes.data || []);
      if (lowStockRes.success) setLowStockProducts(lowStockRes.data || []);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [getPeriodParams]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !hasLoadedRef.current) return;
    if (dateFilter === 'custom' && (!customStartDate || !customEndDate)) return;
    loadPeriodData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, customStartDate, customEndDate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-navy-600">Please log in to view the dashboard</p>
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
          <p className="text-danger-700 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-5">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Dashboard</h1>
          <p className="text-sm text-navy-500 mt-1">{getGreeting()}, {user?.first_name || 'User'}</p>
          <p className="text-xs text-navy-400 mt-0.5">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDateFilterChange('today')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              dateFilter === 'today' ? 'bg-primary-600 text-white shadow-sm-premium' : 'bg-white text-navy-700 hover:bg-navy-50 border border-navy-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleDateFilterChange('7d')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              dateFilter === '7d' ? 'bg-primary-600 text-white shadow-sm-premium' : 'bg-white text-navy-700 hover:bg-navy-50 border border-navy-200'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => handleDateFilterChange('30d')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              dateFilter === '30d' ? 'bg-primary-600 text-white shadow-sm-premium' : 'bg-white text-navy-700 hover:bg-navy-50 border border-navy-200'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => handleDateFilterChange('3m')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              dateFilter === '3m' ? 'bg-primary-600 text-white shadow-sm-premium' : 'bg-white text-navy-700 hover:bg-navy-50 border border-navy-200'
            }`}
          >
            3 Months
          </button>
          <button
            onClick={() => handleDateFilterChange('6m')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              dateFilter === '6m' ? 'bg-primary-600 text-white shadow-sm-premium' : 'bg-white text-navy-700 hover:bg-navy-50 border border-navy-200'
            }`}
          >
            6 Months
          </button>
          <button
            onClick={() => handleDateFilterChange('1y')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              dateFilter === '1y' ? 'bg-primary-600 text-white shadow-sm-premium' : 'bg-white text-navy-700 hover:bg-navy-50 border border-navy-200'
            }`}
          >
            1 Year
          </button>
          <button
            onClick={() => handleDateFilterChange('custom')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              dateFilter === 'custom' ? 'bg-primary-600 text-white shadow-sm-premium' : 'bg-white text-navy-700 hover:bg-navy-50 border border-navy-200'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {dateFilter === 'custom' && (
        <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-navy-200 shadow-premium p-4">
          <div>
            <label className="block text-xs font-medium text-navy-500 mb-1">Start Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-navy-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-500 mb-1">End Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-navy-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {customStartDate && customEndDate && customStartDate > customEndDate && (
            <p className="text-sm text-danger-600 pb-2">Start date must be before end date.</p>
          )}
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
        <div onClick={() => onPageChange?.('customers')} className="cursor-pointer">
          <KPICard
            title="Total Customers"
            value={stats?.total_customers || 0}
            subtitle="Active customers"
            icon={<UsersIcon className="w-6 h-6" />}
            color="blue"
          />
        </div>
        <div onClick={() => onPageChange?.('products')} className="cursor-pointer">
          <KPICard
            title="Total Products"
            value={stats?.total_products || 0}
            subtitle={`${stats?.low_stock_count || 0} low-stock`}
            icon={<PackageIcon className="w-6 h-6" />}
            color="green"
          />
        </div>
        <div onClick={() => onPageChange?.('orders')} className="cursor-pointer">
          <KPICard
            title="Total Orders"
            value={stats?.total_orders || 0}
            subtitle={`${stats?.pending_orders || 0} pending`}
            icon={<ShoppingCartIcon className="w-6 h-6" />}
            color="purple"
          />
        </div>
        <div onClick={() => onPageChange?.('reports')} className="cursor-pointer">
          <KPICard
            title="Total Revenue"
            value={formatCompactCurrency(stats?.total_sales)}
            subtitle={dateFilter === 'custom' ? 'Confirmed sales in range' : 'Confirmed sales'}
            icon={<WalletIcon className="w-6 h-6" />}
            color="indigo"
            compactValue
          />
        </div>
      </div>

      {/* Secondary Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusCard
          title="Pending"
          value={stats?.pending_orders || 0}
          color="amber"
          icon={<ClockIcon className="w-4 h-4" />}
          onClick={() => onPageChange?.('orders')}
        />
        <StatusCard
          title="Confirmed"
          value={stats?.confirmed_orders || 0}
          color="blue"
          icon={<CheckCircleIcon className="w-4 h-4" />}
          onClick={() => onPageChange?.('orders')}
        />
        <StatusCard
          title="Delivered"
          value={stats?.delivered_orders || 0}
          color="green"
          icon={<TruckIcon className="w-4 h-4" />}
          onClick={() => onPageChange?.('orders')}
        />
        <StatusCard
          title="Low Stock"
          value={stats?.low_stock_count || 0}
          color="red"
          icon={<AlertTriangleIcon className="w-4 h-4" />}
          onClick={() => onPageChange?.('inventory')}
        />
      </div>

      {/* Sales Performance & Order Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0">
        {/* Sales Performance */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-navy-200 shadow-premium p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-navy-900">Sales Performance</h2>
              <p className="text-xs text-navy-500 mt-0.5">{getPeriodLabel()}</p>
            </div>
            <div className="flex items-center space-x-1 bg-navy-100 rounded-lg p-1">
              <button 
                onClick={() => setChartView('revenue')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartView === 'revenue' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                Revenue
              </button>
              <button 
                onClick={() => setChartView('orders')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartView === 'orders' ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-600 hover:text-navy-900'
                }`}
              >
                Orders
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="flex items-end gap-6 mb-4">
            <div>
              <p className="text-xs text-navy-500 mb-1">{chartView === 'revenue' ? 'Revenue' : 'Orders'}</p>
              <p className="text-2xl font-bold text-navy-900">
                {chartView === 'revenue'
                  ? formatCompactCurrency(chartTotals.revenue)
                  : chartTotals.orders}
              </p>
            </div>
          </div>

          {/* Chart Visualization */}
          <div className="h-44 w-full min-w-0 relative">
            {chartLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-lg">
                <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}
            {hasChartData ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  key={`${dateFilter}-${chartView}`}
                  data={salesTrend}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesPerformanceGradient" x1="0" y1="0" x2="0" y2="1">
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
                    width={chartView === 'revenue' ? 52 : 28}
                    domain={yAxisScale.domain}
                    ticks={yAxisScale.ticks}
                    allowDecimals={chartView === 'orders' ? false : true}
                  />
                  <Tooltip
                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    animationDuration={200}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const value = Number(payload[0].value ?? 0);
                      return (
                        <div className="bg-white border border-navy-200 rounded-lg shadow-sm-premium px-3 py-2.5 text-xs">
                          <p className="text-[11px] text-navy-500 mb-1">Date</p>
                          <p className="font-medium text-navy-900 mb-2">{formatTooltipDate(String(label))}</p>
                          <p className="text-[11px] text-navy-500 mb-0.5">
                            {chartView === 'revenue' ? 'Revenue' : 'Orders'}
                          </p>
                          <p className="font-semibold text-primary-700">
                            {chartView === 'revenue' ? formatCurrency(value) : value}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={chartMetricKey}
                    stroke="none"
                    fill="url(#salesPerformanceGradient)"
                    isAnimationActive
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                  <Line
                    type="monotone"
                    dataKey={chartMetricKey}
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', stroke: '#fff', strokeWidth: 2, r: 3.5 }}
                    activeDot={{
                      fill: '#6366f1',
                      stroke: '#fff',
                      strokeWidth: 2,
                      r: 7,
                    }}
                    connectNulls
                    isAnimationActive
                    animationDuration={500}
                    animationEasing="ease-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-navy-400 text-sm">
                No sales data for this period
              </div>
            )}
          </div>
        </div>

        {/* Order Pipeline */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-navy-200 shadow-premium p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900">Order Pipeline</h2>
            <span className="text-xs text-navy-500 bg-navy-100 px-2 py-1 rounded-full">{stats?.total_orders || 0} Total</span>
          </div>
          <div className="space-y-3">
            <OrderStatusItem label="Pending" count={stats?.pending_orders || 0} color="amber" percentage={stats?.total_orders ? ((stats.pending_orders / stats.total_orders) * 100).toFixed(0) : '0'} onClick={() => onPageChange?.('orders')} />
            <OrderStatusItem label="Confirmed" count={stats?.confirmed_orders || 0} color="blue" percentage={stats?.total_orders ? ((stats.confirmed_orders / stats.total_orders) * 100).toFixed(0) : '0'} onClick={() => onPageChange?.('orders')} />
            <OrderStatusItem label="Delivered" count={stats?.delivered_orders || 0} color="green" percentage={stats?.total_orders ? ((stats.delivered_orders / stats.total_orders) * 100).toFixed(0) : '0'} onClick={() => onPageChange?.('orders')} />
            {stats && stats.cancelled_orders > 0 && (
              <OrderStatusItem label="Cancelled" count={stats.cancelled_orders} color="red" percentage={stats.total_orders ? ((stats.cancelled_orders / stats.total_orders) * 100).toFixed(0) : '0'} onClick={() => onPageChange?.('orders')} />
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-w-0">
        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-navy-200 shadow-premium p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900">Recent Orders</h2>
            <button onClick={() => onPageChange?.('orders')} className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">View all</button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingCartIcon className="w-6 h-6 text-navy-400" />
              </div>
              <p className="text-sm text-navy-500 font-medium">No recent orders</p>
              <p className="text-xs text-navy-400 mt-1">Orders will appear here when created</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-navy-200">
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider pb-2">Order #</th>
                    <th className="text-left text-xs font-medium text-navy-500 uppercase tracking-wider pb-2">Customer</th>
                    <th className="text-right text-xs font-medium text-navy-500 uppercase tracking-wider pb-2">Amount</th>
                    <th className="text-right text-xs font-medium text-navy-500 uppercase tracking-wider pb-2">Status</th>
                    <th className="text-right text-xs font-medium text-navy-500 uppercase tracking-wider pb-2">Date</th>
                    <th className="text-right text-xs font-medium text-navy-500 uppercase tracking-wider pb-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {recentOrders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-navy-50 transition-colors">
                      <td className="py-2.5">
                        <p className="text-sm font-medium text-navy-900">{order.order_number}</p>
                      </td>
                      <td className="py-2.5">
                        <p className="text-sm text-navy-700">{order.customer_name}</p>
                      </td>
                      <td className="py-2.5 text-right">
                        <p className="text-sm font-semibold text-navy-900">{formatCompactCurrency(order.total_amount)}</p>
                      </td>
                      <td className="py-2.5 text-right">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="py-2.5 text-right">
                        <p className="text-xs text-navy-500">{formatDate(order.order_date)}</p>
                      </td>
                      <td className="py-2.5 text-right">
                        <button 
                          onClick={() => onPageChange?.('orders')}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-navy-200 shadow-premium p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900">Top Products</h2>
            <button onClick={() => onPageChange?.('products')} className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">View all</button>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product) => {
                const maxRevenue = Math.max(...topProducts.map(p => p.revenue));
                const percentage = (product.revenue / maxRevenue) * 100;
                return (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <PackageIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-navy-900">{product.name}</p>
                          <p className="text-sm font-semibold text-navy-900">{formatCompactCurrency(product.revenue)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-navy-500">{product.units_sold} sold</p>
                          <div className="w-24 h-1.5 bg-navy-200 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${percentage}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <PackageIcon className="w-6 h-6 text-navy-400" />
              </div>
              <p className="text-sm text-navy-500 font-medium">No products yet</p>
              <p className="text-xs text-navy-400 mt-1">Products will appear here when sold</p>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Low Stock Alerts */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-navy-200 shadow-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900">Low Stock Alerts</h2>
            {stats && stats.low_stock_count > 0 ? (
              <span className="text-xs text-warning-600 bg-warning-100 px-2 py-1 rounded-full font-medium">{stats.low_stock_count} items</span>
            ) : (
              <span className="text-xs text-success-600 bg-success-100 px-2 py-1 rounded-full font-medium">Healthy</span>
            )}
          </div>
          {stats && stats.low_stock_count > 0 ? (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 3).map((product) => (
                <div key={product.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                  product.current_stock === 0 
                    ? 'bg-danger-50 border-danger-200' 
                    : 'bg-warning-50 border-warning-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <AlertTriangleIcon className={`w-5 h-5 flex-shrink-0 ${
                      product.current_stock === 0 ? 'text-danger-600' : 'text-warning-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-medium ${
                        product.current_stock === 0 ? 'text-danger-900' : 'text-warning-900'
                      }`}>{product.name}</p>
                      <p className={`text-xs ${
                        product.current_stock === 0 ? 'text-danger-700' : 'text-warning-700'
                      }`}>
                        {product.current_stock === 0 ? 'OUT OF STOCK' : 'LOW STOCK'} • {product.current_stock} units (Min: {product.min_stock})
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {lowStockProducts.length > 3 && (
                <p className="text-xs text-warning-600 text-center">+{lowStockProducts.length - 3} more products</p>
              )}
              <button onClick={() => onPageChange?.('inventory')} className="w-full mt-3 text-sm text-warning-700 hover:text-warning-900 font-medium transition-colors">
                Review Inventory
              </button>
            </div>
          ) : (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircleIcon className="w-5 h-5 text-success-600" />
                <div>
                  <p className="text-sm font-medium text-success-900">All inventory levels are healthy</p>
                  <p className="text-xs text-success-700 mt-1">No products require immediate attention</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-navy-200 shadow-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-900">Recent Activity</h2>
            <span className="text-xs text-navy-500 bg-navy-100 px-2 py-1 rounded-full">Last 7 days</span>
          </div>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ActivityIcon className="w-6 h-6 text-navy-400" />
              </div>
              <p className="text-sm text-navy-500 font-medium">No recent activity</p>
              <p className="text-xs text-navy-400 mt-1">Activity will appear here as your team works</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ActivityIcon className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{activity.subject}</p>
                    <p className="text-xs text-navy-500 mt-0.5">{getRelativeTime(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-navy-900">Quick Actions</h2>
          <span className="text-xs text-navy-500">Common tasks</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {permissions.canManageCustomers && (
            <QuickActionButton icon={<UserPlusIcon className="w-5 h-5" />} label="Add Customer" onClick={() => onPageChange?.('customers')} />
          )}
          {permissions.canManageProducts && (
            <QuickActionButton icon={<PackagePlusIcon className="w-5 h-5" />} label="Add Product" onClick={() => onPageChange?.('products')} />
          )}
          {permissions.canManageInventory && (
            <QuickActionButton icon={<BoxesIcon className="w-5 h-5" />} label="Stock Adjustment" onClick={() => onPageChange?.('inventory')} />
          )}
          {permissions.canManageOrders && (
            <QuickActionButton icon={<ShoppingCartIcon className="w-5 h-5" />} label="Create Order" onClick={() => onPageChange?.('orders')} />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatusCard({ title, value, color, icon, onClick }: { title: string; value: number; color: string; icon?: React.ReactNode; onClick?: () => void }) {
  const colorClasses = {
    amber: { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700', icon: 'text-warning-500' },
    blue: { bg: 'bg-primary-50', border: 'border-primary-200', text: 'text-primary-700', icon: 'text-primary-500' },
    green: { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', icon: 'text-success-500' },
    red: { bg: 'bg-danger-50', border: 'border-danger-200', text: 'text-danger-700', icon: 'text-danger-500' },
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border ${colorClasses[color as keyof typeof colorClasses].bg} ${colorClasses[color as keyof typeof colorClasses].border} p-4 hover:shadow-sm transition-shadow cursor-pointer text-left w-full`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-navy-600">{title}</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{value}</p>
        </div>
        {icon && (
          <div className={`w-8 h-8 rounded-lg ${colorClasses[color as keyof typeof colorClasses].bg} flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses].icon}`}>
            {icon}
          </div>
        )}
      </div>
    </button>
  );
}

function OrderStatusItem({ label, count, color, percentage, onClick }: { label: string; count: number; color: string; percentage: string; onClick?: () => void }) {
  const colorClasses = {
    amber: { bg: 'bg-warning-100', text: 'text-warning-700', bar: 'bg-warning-500' },
    blue: { bg: 'bg-primary-100', text: 'text-primary-700', bar: 'bg-primary-500' },
    green: { bg: 'bg-success-100', text: 'text-success-700', bar: 'bg-success-500' },
    red: { bg: 'bg-danger-100', text: 'text-danger-700', bar: 'bg-danger-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', bar: 'bg-indigo-500' },
  };

  return (
    <div onClick={onClick} className={`flex items-center justify-between ${onClick ? 'cursor-pointer hover:bg-navy-50 rounded-lg p-2 -mx-2 transition-colors' : ''}`}>
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-lg ${colorClasses[color as keyof typeof colorClasses].bg} flex items-center justify-center`}>
          <div className={`w-2 h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses].bar}`}></div>
        </div>
        <div>
          <p className="text-sm font-medium text-navy-900">{label}</p>
          <p className={`text-xs ${colorClasses[color as keyof typeof colorClasses].text}`}>{count} orders</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`text-xs text-navy-500 bg-navy-100 px-2 py-0.5 rounded-full`}>{percentage}%</span>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center space-x-3 p-3 bg-navy-50 hover:bg-navy-100 rounded-lg transition-colors border border-navy-200 group">
      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
        <div className="text-primary-600">{icon}</div>
      </div>
      <span className="text-sm font-medium text-navy-900">{label}</span>
    </button>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-navy-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-navy-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-navy-200 rounded w-20 animate-pulse"></div>
          <div className="h-8 bg-navy-200 rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-navy-200 rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-navy-200 rounded-xl animate-pulse"></div>
              <div className="w-16 h-4 bg-navy-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 bg-navy-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-8 bg-navy-200 rounded w-24 mb-1 animate-pulse"></div>
            <div className="h-3 bg-navy-200 rounded w-20 animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Status Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-navy-100 rounded-xl border border-navy-200 animate-pulse"></div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-navy-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-navy-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="h-20 bg-navy-100 rounded-lg animate-pulse"></div>
            <div className="h-20 bg-navy-100 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-32 bg-navy-100 rounded-lg animate-pulse"></div>
        </div>
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-navy-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-navy-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-navy-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-navy-200 rounded w-8 animate-pulse"></div>
                </div>
                <div className="h-2 bg-navy-200 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-navy-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-navy-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-navy-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-navy-200 rounded w-32 animate-pulse"></div>
            <div className="h-4 bg-navy-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-navy-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-navy-200 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-navy-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-navy-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-navy-200 rounded w-16 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-navy-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Icons
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}


function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

function PackagePlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BoxesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-warning-100', text: 'text-warning-700', label: 'Pending' },
    confirmed: { bg: 'bg-primary-100', text: 'text-primary-700', label: 'Confirmed' },
    processing: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Processing' },
    shipped: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Shipped' },
    delivered: { bg: 'bg-success-100', text: 'text-success-700', label: 'Delivered' },
    cancelled: { bg: 'bg-danger-100', text: 'text-danger-700', label: 'Cancelled' },
  };

  const config = statusConfig[status] || { bg: 'bg-navy-100', text: 'text-navy-700', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
