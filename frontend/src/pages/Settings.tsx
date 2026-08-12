import { useCallback, useEffect, useState } from 'react';
import { useAuth, usePermissions, useToast } from '../context';
import { PageHeader } from '../components/ui';
import { userService, type AppUser, type CreateUserPayload } from '../services';

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  sales: 'Sales',
  warehouse: 'Warehouse',
  accounts: 'Accounts',
};

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'accounts', label: 'Accounts' },
] as const;

export default function Settings() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [formData, setFormData] = useState<CreateUserPayload>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'sales',
  });

  const loadUsers = useCallback(async () => {
    if (!permissions.canManageUsers) return;
    setLoadingUsers(true);
    try {
      const response = await userService.getAllUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        showToast(response.message || 'Failed to load users', 'error');
      }
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoadingUsers(false);
    }
  }, [permissions.canManageUsers, showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'sales',
    });
    setEditingUser(null);
    setShowCreateForm(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await userService.createUser(formData);
    if (response.success) {
      showToast('User created successfully', 'success');
      resetForm();
      loadUsers();
    } else {
      showToast(response.message || 'Failed to create user', 'error');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const response = await userService.updateUser(editingUser.id, {
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
    });
    if (response.success) {
      showToast('User updated successfully', 'success');
      resetForm();
      loadUsers();
    } else {
      showToast(response.message || 'Failed to update user', 'error');
    }
  };

  const handleToggleStatus = async (target: AppUser) => {
    const response = await userService.updateUserStatus(target.id, !target.is_active);
    if (response.success) {
      showToast(target.is_active ? 'User deactivated' : 'User activated', 'success');
      loadUsers();
    } else {
      showToast(response.message || 'Failed to update user status', 'error');
    }
  };

  const startEdit = (target: AppUser) => {
    setEditingUser(target);
    setShowCreateForm(true);
    setFormData({
      email: target.email,
      password: '',
      first_name: target.first_name,
      last_name: target.last_name,
      role: target.role,
    });
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
        </div>
      </div>

      {permissions.canManageUsers && (
        <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-navy-900">User Management</h2>
              <p className="text-sm text-navy-500 mt-1">Create and manage Sales, Warehouse, and Accounts users</p>
            </div>
            {!showCreateForm && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm shadow-sm-premium transition-colors"
              >
                Add User
              </button>
            )}
          </div>

          {showCreateForm && (
            <form
              onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-navy-50 rounded-lg border border-navy-100"
            >
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">First Name</label>
                <input
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full border border-navy-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Last Name</label>
                <input
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full border border-navy-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-navy-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as CreateUserPayload['role'] })}
                  className="w-full border border-navy-300 rounded-lg px-3 py-2"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {!editingUser && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-navy-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-navy-300 rounded-lg px-3 py-2"
                    placeholder="Min 8 chars, upper, lower, number, special"
                  />
                </div>
              )}
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2 border border-navy-300 rounded-lg text-sm text-navy-700 hover:bg-white">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-navy-200 text-left text-navy-500">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td colSpan={5} className="py-6 text-center text-navy-500">Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-navy-500">No users found</td></tr>
                ) : (
                  users.map((item) => (
                    <tr key={item.id} className="border-b border-navy-100">
                      <td className="py-3 pr-4 text-navy-900">{item.first_name} {item.last_name}</td>
                      <td className="py-3 pr-4 text-navy-700">{item.email}</td>
                      <td className="py-3 pr-4 capitalize">{roleLabels[item.role] || item.role}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-success-100 text-success-700' : 'bg-navy-100 text-navy-600'}`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => startEdit(item)} className="text-primary-600 hover:text-primary-700 text-sm">
                            Edit
                          </button>
                          {item.id !== user?.id && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(item)}
                              className="text-navy-600 hover:text-navy-800 text-sm"
                            >
                              {item.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
