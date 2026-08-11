import { useState, useEffect } from 'react';
import { useAuth } from '../context';
import { dashboardService } from '../services/dashboardService';
import { formatCurrency } from '../utils/formatters';

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

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadDashboardData();
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, ordersRes, activitiesRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentOrders(5),
        dashboardService.getRecentActivities(5),
      ]);

      if (statsRes.success && statsRes.data) {
        const normalizedStats = {
          total_customers: Number(statsRes.data.total_customers ?? 0),
          total_products: Number(statsRes.data.total_products ?? 0),
          total_orders: Number(statsRes.data.total_orders ?? 0),
          total_sales: Number(statsRes.data.total_sales ?? 0),
          low_stock_count: Number(statsRes.data.low_stock_count ?? 0),
          pending_orders: Number(statsRes.data.pending_orders ?? 0),
          confirmed_orders: Number(statsRes.data.confirmed_orders ?? 0),
          delivered_orders: Number(statsRes.data.delivered_orders ?? 0),
          cancelled_orders: Number(statsRes.data.cancelled_orders ?? 0),
        };
        setStats(normalizedStats);
      }
      if (ordersRes.success) {
        const normalizedOrders = (ordersRes.data || []).map((order: any) => ({
          ...order,
          total_amount: Number(order.total_amount ?? 0),
        }));
        setRecentOrders(normalizedOrders);
      }
      if (activitiesRes.success) setRecentActivities(activitiesRes.data || []);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to view the dashboard</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Customers"
            value={stats?.total_customers || 0}
            color="blue"
          />
          <StatCard
            title="Total Products"
            value={stats?.total_products || 0}
            color="green"
          />
          <StatCard
            title="Total Orders"
            value={stats?.total_orders || 0}
            color="purple"
          />
          <StatCard
            title="Total Sales"
            value={formatCurrency(stats?.total_sales)}
            color="yellow"
          />
        </div>

        {/* Order Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.pending_orders || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.confirmed_orders || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{stats?.delivered_orders || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Low Stock</p>
            <p className="text-2xl font-bold text-red-600">{stats?.low_stock_count || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="border-b pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                        <p className="text-sm text-gray-600 capitalize">{order.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
            {recentActivities.length === 0 ? (
              <p className="text-gray-500">No recent activities</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="border-b pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{activity.subject}</p>
                        <p className="text-sm text-gray-600">{activity.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm capitalize text-gray-600">{activity.activity_type}</p>
                        <p className="text-sm text-gray-500 capitalize">{activity.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600 mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <div className={`mt-4 h-2 ${colorClasses[color as keyof typeof colorClasses]} rounded`}></div>
    </div>
  );
}
