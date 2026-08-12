import { useState, useEffect, useCallback } from 'react';
import { useAuth, usePermissions } from '../context';
import { reportingService } from '../services';
import { EmptyState, DocumentActions } from '../components/ui';
import SalesReportView, { type SalesReportData } from '../components/reports/SalesReportView';
import { formatCurrency } from '../utils/formatters';
import { buildReportCsv, downloadCsv } from '../utils/exportCsv';
import { useDocumentExport } from '../hooks/useDocumentExport';
import { usePrint } from '../components/print/PrintProvider';
import {
  GenericReportPrintView,
  SalesReportPrintView,
} from '../components/print/PrintViews';
import {
  buildDateRangeLabel,
  type SalesReportExportData,
} from '../documents';
import {
  DATE_RANGE_PRESET_LABELS,
  getDateRangeForPreset,
  isValidDateRange,
  type DateRangePreset,
} from '../utils/dateRangePresets';

type ReportType = 'sales' | 'customers' | 'products' | 'inventory';

const PRESET_OPTIONS: DateRangePreset[] = ['today', '7d', '30d', '3m', '6m', '1y', 'custom'];

const defaultRange = getDateRangeForPreset('7d');

export default function Reports() {
  const { isAuthenticated } = useAuth();
  const permissions = usePermissions();
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DateRangePreset>('7d');
  const [startDate, setStartDate] = useState<string>(defaultRange.start);
  const [endDate, setEndDate] = useState<string>(defaultRange.end);
  const { runExport } = useDocumentExport();
  const { print } = usePrint();

  const applyPreset = useCallback((preset: DateRangePreset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const range = getDateRangeForPreset(preset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  }, []);

  const loadReport = useCallback(async () => {
    if (!isValidDateRange(startDate, endDate)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const filters: Record<string, string> = {};
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      let response;
      switch (reportType) {
        case 'sales':
          response = await reportingService.getSalesReport(filters);
          break;
        case 'customers':
          response = await reportingService.getCustomerReport(filters);
          break;
        case 'products':
          response = await reportingService.getProductPerformanceReport(filters);
          break;
        case 'inventory':
          response = await reportingService.getInventoryReport(filters);
          break;
      }

      if (response.success && response.data) {
        setReportData(response.data as Record<string, unknown>);
      } else {
        setReportData(null);
        setError(response.message || 'Failed to load report');
      }
    } catch {
      setReportData(null);
      setError('Unable to load report. Please try again.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [reportType, startDate, endDate, datePreset]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (startDate && endDate && !isValidDateRange(startDate, endDate)) {
      return;
    }
    loadReport();
  }, [isAuthenticated, loadReport, datePreset, startDate, endDate]);

  const handleStartDateChange = (value: string) => {
    setDatePreset('custom');
    setStartDate(value);
  };

  const handleEndDateChange = (value: string) => {
    setDatePreset('custom');
    setEndDate(value);
  };

  const handleClearDates = () => {
    applyPreset('7d');
  };

  const dateRangeLabel = buildDateRangeLabel(startDate, endDate);

  const handlePrintReport = () => {
    if (!reportData) throw new Error('No report data available to print.');

    const reportTypeLabels: Record<ReportType, string> = {
      sales: 'Sales Report',
      customers: 'Customers Report',
      products: 'Products Report',
      inventory: 'Inventory Report',
    };

    if (reportType === 'sales') {
      print(
        <SalesReportPrintView
          data={reportData as unknown as SalesReportExportData}
          reportType={reportTypeLabels.sales}
          dateRangeLabel={dateRangeLabel}
        />
      );
      return;
    }

    if (reportType === 'customers') {
      const rows =
        (reportData.top_customers as Array<{ company_name: string; total_orders: number; total_spent: number }>) ||
        [];
      print(
        <GenericReportPrintView
          title="Customer Report"
          reportTypeLabel={reportTypeLabels.customers}
          dateRangeLabel={dateRangeLabel}
          summaryItems={[
            { label: 'Total Customers', value: Number(reportData.total_customers ?? 0) },
            { label: 'Active Customers', value: Number(reportData.active_customers ?? 0) },
            { label: 'Total Credit Limit', value: formatCurrency(Number(reportData.total_credit_limit ?? 0)) },
          ]}
          sections={[
            {
              heading: 'Top Customers',
              columns: ['Company', 'Orders', 'Total Spent'],
              rows: rows.map((row) => [row.company_name, row.total_orders, row.total_spent]),
            },
          ]}
        />
      );
      return;
    }

    if (reportType === 'products') {
      const rows =
        (reportData.top_selling_products as Array<{
          product_name: string;
          sku: string;
          total_quantity_sold: number;
          total_revenue: number;
        }>) || [];
      print(
        <GenericReportPrintView
          title="Product Performance Report"
          reportTypeLabel={reportTypeLabels.products}
          dateRangeLabel={dateRangeLabel}
          summaryItems={[
            { label: 'Total Products', value: Number(reportData.total_products ?? 0) },
            { label: 'Active Products', value: Number(reportData.active_products ?? 0) },
          ]}
          sections={[
            {
              heading: 'Top Selling Products',
              columns: ['Product', 'SKU', 'Qty Sold', 'Revenue'],
              rows: rows.map((row) => [
                row.product_name,
                row.sku,
                row.total_quantity_sold,
                row.total_revenue,
              ]),
            },
          ]}
        />
      );
      return;
    }

    const rows =
      (reportData.stock_summary as Array<{
        product_name: string;
        sku: string;
        quantity: number;
        available_quantity: number;
        value: number;
      }>) || [];
    print(
      <GenericReportPrintView
        title="Inventory Report"
        reportTypeLabel={reportTypeLabels.inventory}
        dateRangeLabel={dateRangeLabel}
        summaryItems={[
          { label: 'Total Products', value: Number(reportData.total_products ?? 0) },
          { label: 'Low Stock', value: Number(reportData.low_stock_count ?? 0) },
          { label: 'Out of Stock', value: Number(reportData.out_of_stock_count ?? 0) },
          { label: 'Total Value', value: formatCurrency(Number(reportData.total_inventory_value ?? 0)) },
        ]}
        sections={[
          {
            heading: 'Stock Summary',
            columns: ['Product', 'SKU', 'Qty', 'Available', 'Value'],
            rows: rows.map((row) => [
              row.product_name,
              row.sku,
              row.quantity,
              row.available_quantity,
              row.value,
            ]),
          },
        ]}
      />
    );
  };

  const handleExportCsv = () => {
    if (!reportData) throw new Error('No report data available to export.');
    downloadCsv(`${reportType}-report.csv`, buildReportCsv(reportType, reportData));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-navy-600">Please log in to view reports</p>
      </div>
    );
  }

  if (initialLoading) return <ReportsSkeleton />;

  return (
    <div className="space-y-6">
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

      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_OPTIONS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                datePreset === preset
                  ? 'bg-primary-600 text-white shadow-sm-premium'
                  : 'bg-white text-navy-700 hover:bg-navy-50 border border-navy-200'
              }`}
            >
              {DATE_RANGE_PRESET_LABELS[preset]}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 min-w-[12rem]">
            <label className="block text-sm font-medium text-navy-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
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
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="border border-navy-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="border border-navy-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadReport}
              disabled={loading || !isValidDateRange(startDate, endDate)}
              className="bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 shadow-sm-premium transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Generating…' : 'Generate Report'}
            </button>
            <button
              type="button"
              onClick={handleClearDates}
              className="px-4 py-2.5 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-all"
            >
              Clear
            </button>
            {permissions.canExportReports && reportData && (
              <DocumentActions
                disabled={loading}
                onPrint={() => runExport(handlePrintReport)}
                onExportCsv={() => runExport(handleExportCsv, 'Report exported as CSV')}
                printLabel="Print Report"
              />
            )}
          </div>
        </div>

        {startDate && endDate && startDate > endDate && (
          <p className="text-sm text-danger-600">Start date must be on or before the end date.</p>
        )}
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
          <p className="text-danger-700 mb-4">{error}</p>
          <button
            type="button"
            onClick={loadReport}
            className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!error && reportData && (
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6 relative min-w-0">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 rounded-xl">
              <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          )}
          {reportType === 'sales' && (
            <SalesReportView data={reportData as unknown as SalesReportData} loading={loading} />
          )}
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
              type="button"
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

function CustomerReport({ data }: { data: Record<string, unknown> }) {
  const topCustomers =
    (data.top_customers as Array<{
      customer_id: number;
      company_name: string;
      total_orders: number;
      total_spent: number;
    }>) || [];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-navy-900">Customer Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
          <p className="text-sm text-navy-600">Total Customers</p>
          <p className="text-2xl font-bold text-navy-900">{Number(data.total_customers ?? 0)}</p>
        </div>
        <div className="bg-success-50 p-4 rounded-xl border border-success-100">
          <p className="text-sm text-navy-600">Active Customers</p>
          <p className="text-2xl font-bold text-navy-900">{Number(data.active_customers ?? 0)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <p className="text-sm text-navy-600">Total Credit Limit</p>
          <p className="text-2xl font-bold text-navy-900">
            {formatCurrency(Number(data.total_credit_limit ?? 0))}
          </p>
        </div>
      </div>

      <h3 className="font-semibold mb-2 text-navy-900">Top Customers</h3>
      {topCustomers.length > 0 ? (
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
              {topCustomers.map((customer) => (
                <tr key={customer.customer_id} className="border-b border-navy-200">
                  <td className="py-2 text-navy-900">{customer.company_name}</td>
                  <td className="text-right py-2 text-navy-900">{customer.total_orders}</td>
                  <td className="text-right py-2 text-navy-900">
                    {formatCurrency(customer.total_spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-navy-500">No customer data available.</p>
      )}
    </div>
  );
}

function ProductReport({ data }: { data: Record<string, unknown> }) {
  const topProducts =
    (data.top_selling_products as Array<{
      product_id: number;
      product_name: string;
      sku: string;
      total_quantity_sold: number;
      total_revenue: number;
    }>) || [];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-navy-900">Product Performance Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
          <p className="text-sm text-navy-600">Total Products</p>
          <p className="text-2xl font-bold text-navy-900">{Number(data.total_products ?? 0)}</p>
        </div>
        <div className="bg-success-50 p-4 rounded-xl border border-success-100">
          <p className="text-sm text-navy-600">Active Products</p>
          <p className="text-2xl font-bold text-navy-900">{Number(data.active_products ?? 0)}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2 text-navy-900">Top Selling Products</h3>
      {topProducts.length > 0 ? (
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
              {topProducts.map((product) => (
                <tr key={product.product_id} className="border-b border-navy-200">
                  <td className="py-2 text-navy-900">{product.product_name}</td>
                  <td className="py-2 text-navy-900">{product.sku}</td>
                  <td className="text-right py-2 text-navy-900">{product.total_quantity_sold}</td>
                  <td className="text-right py-2 text-navy-900">
                    {formatCurrency(product.total_revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-navy-500">No product performance data available.</p>
      )}
    </div>
  );
}

function InventoryReport({ data }: { data: Record<string, unknown> }) {
  const stockSummary =
    (data.stock_summary as Array<{
      product_id: number;
      product_name: string;
      sku: string;
      quantity: number;
      available_quantity: number;
      value: number;
    }>) || [];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-navy-900">Inventory Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
          <p className="text-sm text-navy-600">Total Products</p>
          <p className="text-2xl font-bold text-navy-900">{Number(data.total_products ?? 0)}</p>
        </div>
        <div className="bg-warning-50 p-4 rounded-xl border border-warning-100">
          <p className="text-sm text-navy-600">Low Stock</p>
          <p className="text-2xl font-bold text-navy-900">{Number(data.low_stock_count ?? 0)}</p>
        </div>
        <div className="bg-danger-50 p-4 rounded-xl border border-danger-100">
          <p className="text-sm text-navy-600">Out of Stock</p>
          <p className="text-2xl font-bold text-navy-900">{Number(data.out_of_stock_count ?? 0)}</p>
        </div>
        <div className="bg-success-50 p-4 rounded-xl border border-success-100">
          <p className="text-sm text-navy-600">Total Value</p>
          <p className="text-2xl font-bold text-navy-900">
            {formatCurrency(Number(data.total_inventory_value ?? 0))}
          </p>
        </div>
      </div>

      <h3 className="font-semibold mb-2 text-navy-900">Stock Summary</h3>
      {stockSummary.length > 0 ? (
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
              {stockSummary.map((item) => (
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
      ) : (
        <p className="text-sm text-navy-500">No inventory records available.</p>
      )}
    </div>
  );
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-navy-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-navy-200 rounded w-64 animate-pulse" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-4 space-y-4">
        <div className="h-9 bg-navy-100 rounded animate-pulse" />
        <div className="h-10 bg-navy-200 rounded animate-pulse" />
      </div>

      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-navy-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
