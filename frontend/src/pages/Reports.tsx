import { useState, useEffect } from 'react';
import { useAuth } from '../context';
import { apiService } from '../services/api';
import { EmptyState } from '../components/ui';
import { formatCurrency } from '../utils/formatters';

export default function Reports() {
  const { isAuthenticated } = useAuth();
  const [reportType, setReportType] = useState<'sales' | 'customers' | 'products' | 'inventory'>('sales');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      loadReport();
    }
  }, [reportType, startDate, endDate, isAuthenticated]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const queryString = params.toString();
      const endpoint = `/reports/${reportType}${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiService.get(endpoint);
      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        setError(response.message || 'Failed to load report');
      }
    } catch (err) {
      setError('An error occurred while loading report');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to view reports</p>
      </div>
    );
  }

  if (loading) return <ReportsSkeleton />;
  if (error) return (
    <div className="p-6">
      <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
        <p className="text-danger-700 mb-4">{error}</p>
        <button
          onClick={loadReport}
          className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
            <ReportsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Reports</h1>
            <p className="text-sm text-navy-500 mt-1">View analytics and business insights</p>
          </div>
        </div>
      </div>

      {/* Report Filters */}
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-navy-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full border border-navy-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="sales">Sales Report</option>
              <option value="customers">Customers Report</option>
              <option value="products">Products Report</option>
              <option value="inventory">Inventory Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-navy-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-navy-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadReport}
              className="bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 shadow-sm-premium transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              Generate Report
            </button>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-2.5 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && !loading && !error && (
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          {reportType === 'sales' && <SalesReport data={reportData} />}
          {reportType === 'customers' && <CustomerReport data={reportData} />}
          {reportType === 'products' && <ProductReport data={reportData} />}
          {reportType === 'inventory' && <InventoryReport data={reportData} />}
        </div>
      )}

      {!reportData && !loading && !error && (
        <EmptyState
          icon={<ReportsIcon />}
          title="No report data"
          description="Select a report type and generate a report to view analytics"
          action={
            <button
              onClick={loadReport}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Generate Report
            </button>
          }
        />
      )}
    </div>
  );
}

function SalesReport({ data }: { data: any }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-navy-900">Sales Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
          <p className="text-sm text-navy-600">Total Orders</p>
          <p className="text-2xl font-bold text-navy-900">{data.total_orders}</p>
        </div>
        <div className="bg-success-50 p-4 rounded-xl border border-success-100">
          <p className="text-sm text-navy-600">Total Revenue</p>
          <p className="text-2xl font-bold text-navy-900">{formatCurrency(data.total_revenue)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <p className="text-sm text-navy-600">Avg Order Value</p>
          <p className="text-2xl font-bold text-navy-900">{formatCurrency(data.average_order_value)}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2 text-navy-900">Orders by Status</h3>
      <div className="space-y-2">
        {Object.entries(data.orders_by_status || {}).map(([status, count]: [string, any]) => (
          <div key={status} className="flex justify-between border-b border-navy-200 pb-2">
            <span className="capitalize text-navy-700">{status}</span>
            <span className="font-medium text-navy-900">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerReport({ data }: { data: any }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-navy-900">Customer Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
          <p className="text-sm text-navy-600">Total Customers</p>
          <p className="text-2xl font-bold text-navy-900">{data.total_customers}</p>
        </div>
        <div className="bg-success-50 p-4 rounded-xl border border-success-100">
          <p className="text-sm text-navy-600">Active Customers</p>
          <p className="text-2xl font-bold text-navy-900">{data.active_customers}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <p className="text-sm text-navy-600">Total Credit Limit</p>
          <p className="text-2xl font-bold text-navy-900">{formatCurrency(data.total_credit_limit)}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2 text-navy-900">Top Customers</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-navy-200">
              <th className="text-left py-2 text-navy-600">Company</th>
              <th className="text-right py-2 text-navy-600">Orders</th>
              <th className="text-right py-2 text-navy-600">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {data.top_customers?.map((customer: any) => (
              <tr key={customer.customer_id} className="border-b border-navy-200">
                <td className="py-2 text-navy-900">{customer.company_name}</td>
                <td className="text-right py-2 text-navy-900">{customer.total_orders}</td>
                <td className="text-right py-2 text-navy-900">{formatCurrency(customer.total_spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductReport({ data }: { data: any }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-navy-900">Product Performance Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
          <p className="text-sm text-navy-600">Total Products</p>
          <p className="text-2xl font-bold text-navy-900">{data.total_products}</p>
        </div>
        <div className="bg-success-50 p-4 rounded-xl border border-success-100">
          <p className="text-sm text-navy-600">Active Products</p>
          <p className="text-2xl font-bold text-navy-900">{data.active_products}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2 text-navy-900">Top Selling Products</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-navy-200">
              <th className="text-left py-2 text-navy-600">Product</th>
              <th className="text-left py-2 text-navy-600">SKU</th>
              <th className="text-right py-2 text-navy-600">Quantity Sold</th>
              <th className="text-right py-2 text-navy-600">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.top_selling_products?.map((product: any) => (
              <tr key={product.product_id} className="border-b border-navy-200">
                <td className="py-2 text-navy-900">{product.product_name}</td>
                <td className="py-2 text-navy-900">{product.sku}</td>
                <td className="text-right py-2 text-navy-900">{product.total_quantity_sold}</td>
                <td className="text-right py-2 text-navy-900">{formatCurrency(product.total_revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryReport({ data }: { data: any }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-navy-900">Inventory Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
          <p className="text-sm text-navy-600">Total Products</p>
          <p className="text-2xl font-bold text-navy-900">{data.total_products}</p>
        </div>
        <div className="bg-warning-50 p-4 rounded-xl border border-warning-100">
          <p className="text-sm text-navy-600">Low Stock</p>
          <p className="text-2xl font-bold text-navy-900">{data.low_stock_count}</p>
        </div>
        <div className="bg-danger-50 p-4 rounded-xl border border-danger-100">
          <p className="text-sm text-navy-600">Out of Stock</p>
          <p className="text-2xl font-bold text-navy-900">{data.out_of_stock_count}</p>
        </div>
        <div className="bg-success-50 p-4 rounded-xl border border-success-100">
          <p className="text-sm text-navy-600">Total Value</p>
          <p className="text-2xl font-bold text-navy-900">{formatCurrency(data.total_inventory_value)}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2 text-navy-900">Stock Summary</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-navy-200">
              <th className="text-left py-2 text-navy-600">Product</th>
              <th className="text-left py-2 text-navy-600">SKU</th>
              <th className="text-right py-2 text-navy-600">Quantity</th>
              <th className="text-right py-2 text-navy-600">Available</th>
              <th className="text-right py-2 text-navy-600">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.stock_summary?.map((item: any) => (
              <tr key={item.product_id} className="border-b border-navy-200">
                <td className="py-2 text-navy-900">{item.product_name}</td>
                <td className="py-2 text-navy-900">{item.sku}</td>
                <td className="text-right py-2 text-navy-900">{item.quantity}</td>
                <td className="text-right py-2 text-navy-900">{item.available_quantity}</td>
                <td className="text-right py-2 text-navy-900">{formatCurrency(item.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Icon Components
function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-navy-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-navy-200 rounded w-64 animate-pulse"></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-4">
        <div className="h-10 bg-navy-200 rounded animate-pulse"></div>
      </div>

      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-navy-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
