import { useAuth } from '../context';
import { PageHeader } from '../components/ui';

export default function Settings() {
  const { user } = useAuth();

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    sales: 'Sales',
    warehouse: 'Warehouse',
    accounts: 'Accounts',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        title="Settings"
        subtitle="Account and application configuration"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Your Profile</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-navy-500 uppercase tracking-wide">Full Name</dt>
              <dd className="text-sm font-medium text-navy-900 mt-1">{user?.first_name} {user?.last_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-navy-500 uppercase tracking-wide">Email</dt>
              <dd className="text-sm text-navy-900 mt-1">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-navy-500 uppercase tracking-wide">Role</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                  {roleLabels[user?.role || ''] || user?.role}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-navy-500 uppercase tracking-wide">Account Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user?.is_active ? 'bg-success-100 text-success-700' : 'bg-navy-100 text-navy-600'}`}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Application</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium text-navy-500 uppercase tracking-wide">Product</dt>
              <dd className="text-sm font-medium text-navy-900 mt-1">FUNDSROOM ERP + CRM</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-navy-500 uppercase tracking-wide">Environment</dt>
              <dd className="text-sm text-navy-900 mt-1">Development</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-navy-500 uppercase tracking-wide">API</dt>
              <dd className="text-sm text-navy-900 mt-1">REST · PostgreSQL · JWT Authentication</dd>
            </div>
          </dl>
          <p className="text-xs text-navy-500 mt-6 border-t border-navy-100 pt-4">
            Organization settings and user management are configured by administrators through the backend API.
          </p>
        </div>
      </div>
    </div>
  );
}
