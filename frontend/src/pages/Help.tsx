import { PageHeader } from '../components/ui';

const modules = [
  { name: 'Customers', desc: 'Manage CRM records, follow-ups, and customer activities.' },
  { name: 'Products', desc: 'Maintain product catalog with SKU, pricing, and stock levels.' },
  { name: 'Inventory', desc: 'Track stock movements (IN/OUT) with audit history.' },
  { name: 'Orders', desc: 'Create pending orders; confirm to deduct stock atomically. Revenue is recognized on confirmation.' },
  { name: 'Sales Challans', desc: 'Independent dispatch documents; confirm to reduce inventory (separate from orders).' },
  { name: 'Reports', desc: 'Confirmed revenue analytics, filters, and CSV export from live data.' },
];

const workflow = [
  'Add customers and products to establish your catalog.',
  'Record stock IN movements or set opening stock on products.',
  'Create a pending order — stock is not deducted until confirmation.',
  'Confirm the order to validate stock and create OUT movements.',
  'Alternatively, create a draft challan for dispatch; confirm when goods leave the warehouse.',
  'Orders and challans are independent documents — confirming both for the same goods will deduct stock twice.',
  'Review Dashboard KPIs and Reports for business insights (revenue counts confirmed orders only).',
];

export default function Help() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="Help & Support"
        subtitle="System overview and operational guidance"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-3">Standard Workflow</h2>
          <ol className="space-y-2.5">
            {workflow.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-navy-700">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-3">Modules</h2>
          <ul className="space-y-3">
            {modules.map((m) => (
              <li key={m.name} className="border-b border-navy-100 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-navy-900">{m.name}</p>
                <p className="text-xs text-navy-500 mt-0.5">{m.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-2">Roles & Access</h2>
          <ul className="text-sm text-navy-700 space-y-2">
            <li><strong className="text-navy-900">Admin</strong> — Full access to all modules and settings.</li>
            <li><strong className="text-navy-900">Sales</strong> — Customers, orders, challans, and sales reports.</li>
            <li><strong className="text-navy-900">Warehouse</strong> — Products (view), inventory, and stock operations.</li>
            <li><strong className="text-navy-900">Accounts</strong> — Read-only operational data and financial reports.</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-2">API & Documentation</h2>
          <p className="text-sm text-navy-600">
            REST APIs are available under <code className="text-xs bg-navy-50 px-1.5 py-0.5 rounded">/api/*</code> with JWT authentication.
            Import the Postman collection from the project repository for endpoint testing.
          </p>
          <p className="text-sm text-navy-600 mt-3">
            For deployment or integration questions, refer to the project README or contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
