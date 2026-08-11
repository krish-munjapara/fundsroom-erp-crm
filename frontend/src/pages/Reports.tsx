import { useState, useEffect } from 'react';
import { useAuth } from '../context';
import { apiService } from '../services/api';
import { formatCurrency } from '../utils/formatters';

export default function Reports() {
  const { isAuthenticated } = useAuth();
  const [reportType, setReportType] = useState<'sales' | 'customers' | 'products' | 'inventory'>('sales');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await apiService.get(`/api/reports/${reportType}${params.toString() ? `?${params.toString()}` : ''}`);

      if (response.success) {
        setReportData(response.data);
      } else {
        setError(response.message || 'Failed to load report');
      }
    } catch (err) {
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadReport();
    }
  }, [reportType, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to view reports</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>

        {/* Report Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
            className="border border-gray-300 rounded-md p-2 w-full md:w-64"
          >
            <option value="sales">Sales Report</option>
            <option value="customers">Customer Report</option>
            <option value="products">Product Performance</option>
            <option value="inventory">Inventory Report</option>
          </select>
        </div>

        {/* Date Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {loading && <p className="text-gray-600">Loading report...</p>}

        {error && <p className="text-red-600">{error}</p>}

        {reportData && !loading && (
          <div className="bg-white rounded-lg shadow p-6">
            {reportType === 'sales' && <SalesReport data={reportData} />}
            {reportType === 'customers' && <CustomerReport data={reportData} />}
            {reportType === 'products' && <ProductReport data={reportData} />}
            {reportType === 'inventory' && <InventoryReport data={reportData} />}
          </div>
        )}
      </div>
    </div>
  );
}

function SalesReport({ data }: { data: any }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Sales Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold">{data.total_orders}</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(data.total_revenue)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <p className="text-sm text-gray-600">Avg Order Value</p>
          <p className="text-2xl font-bold">{formatCurrency(data.average_order_value)}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Orders by Status</h3>
      <div className="space-y-2">
        {Object.entries(data.orders_by_status || {}).map(([status, count]: [string, any]) => (
          <div key={status} className="flex justify-between border-b pb-2">
            <span className="capitalize">{status}</span>
            <span className="font-medium">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomerReport({ data }: { data: any }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Customer Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Customers</p>
          <p className="text-2xl font-bold">{data.total_customers}</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Active Customers</p>
          <p className="text-2xl font-bold">{data.active_customers}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Credit Limit</p>
          <p className="text-2xl font-bold">{formatCurrency(data.total_credit_limit)}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Top Customers</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Company</th>
              <th className="text-right py-2">Orders</th>
              <th className="text-right py-2">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {data.top_customers?.map((customer: any) => (
              <tr key={customer.customer_id} className="border-b">
                <td className="py-2">{customer.company_name}</td>
                <td className="text-right py-2">{customer.total_orders}</td>
                <td className="text-right py-2">{formatCurrency(customer.total_spent)}</td>
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
      <h2 className="text-xl font-semibold mb-4">Product Performance Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold">{data.total_products}</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Active Products</p>
          <p className="text-2xl font-bold">{data.active_products}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Top Selling Products</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Product</th>
              <th className="text-left py-2">SKU</th>
              <th className="text-right py-2">Quantity Sold</th>
              <th className="text-right py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.top_selling_products?.map((product: any) => (
              <tr key={product.product_id} className="border-b">
                <td className="py-2">{product.product_name}</td>
                <td className="py-2">{product.sku}</td>
                <td className="text-right py-2">{product.total_quantity_sold}</td>
                <td className="text-right py-2">{formatCurrency(product.total_revenue)}</td>
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
      <h2 className="text-xl font-semibold mb-4">Inventory Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold">{data.total_products}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-sm text-gray-600">Low Stock</p>
          <p className="text-2xl font-bold">{data.low_stock_count}</p>
        </div>
        <div className="bg-red-50 p-4 rounded">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold">{data.out_of_stock_count}</p>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold">{formatCurrency(data.total_inventory_value)}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Stock Summary</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Product</th>
              <th className="text-left py-2">SKU</th>
              <th className="text-right py-2">Quantity</th>
              <th className="text-right py-2">Available</th>
              <th className="text-right py-2">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.stock_summary?.map((item: any) => (
              <tr key={item.product_id} className="border-b">
                <td className="py-2">{item.product_name}</td>
                <td className="py-2">{item.sku}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">{item.available_quantity}</td>
                <td className="text-right py-2">{formatCurrency(item.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
