export default function Help() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Help & Support</h1>
          <p className="text-sm text-navy-500 mt-1">Guidance for using the FUNDSROOM ERP + CRM portal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-2">Getting Started</h2>
          <ul className="text-sm text-navy-700 space-y-2 list-disc list-inside">
            <li>Add customers and products first</li>
            <li>Create pending orders, then confirm to deduct stock</li>
            <li>Use Sales Challans for dispatch documentation</li>
            <li>Review Reports for sales and inventory insights</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-2">Support</h2>
          <p className="text-sm text-navy-600">For technical issues, contact your system administrator or Fundsroom support team.</p>
          <p className="text-sm text-navy-900 mt-3 font-medium">support@fundsroom.com</p>
        </div>
      </div>
    </div>
  );
}
