import { useState, useEffect } from 'react';
import { customerService, customerActivityService, orderService } from '../services';
import type { Customer, CreateCustomerData, CustomerActivity } from '../services';
import type { Order } from '../services';
import { KPICard } from '../components/ui';
import { formatCurrency, formatDate } from '../utils/formatters';
import { usePermissions, useSearch, useToast } from '../context';
import CustomerModal, { type CustomerSaveResult } from '../components/customers/CustomerModal';

export default function Customers() {
  const permissions = usePermissions();
  const { consumePendingSearch } = useSearch();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Record<number, Order[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [selectedCustomerActivities, setSelectedCustomerActivities] = useState<CustomerActivity[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [showActivityFormModal, setShowActivityFormModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<CustomerActivity | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const term = consumePendingSearch('customers');
    if (term) setSearchTerm(term);
  }, [consumePendingSearch]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActionMenuOpen(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    // Load orders for each customer
    customers.forEach(customer => {
      loadCustomerOrders(customer.id);
    });
  }, [customers]);

  const loadCustomerOrders = async (customerId: number) => {
    try {
      const response = await orderService.getOrdersByCustomerId(customerId);
      if (response.success && response.data) {
        setCustomerOrders(prev => ({
          ...prev,
          [customerId]: response.data || []
        }));
      }
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    }
  };

  // Calculate summary stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.is_active).length;
  const inactiveCustomers = customers.filter(c => !c.is_active).length;
  const newCustomers = customers.filter(c => {
    const createdDate = new Date(c.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  }).length;

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && customer.is_active) ||
      (statusFilter === 'inactive' && !customer.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Helper functions for customer statistics
  const getCustomerTotalOrders = (customerId: number) => {
    return customerOrders[customerId]?.length || 0;
  };

  const getCustomerTotalSpent = (customerId: number) => {
    const orders = customerOrders[customerId] || [];
    return orders.reduce((sum, order) => sum + order.total_amount, 0);
  };

  const getCustomerLastOrder = (customerId: number) => {
    const orders = customerOrders[customerId] || [];
    if (orders.length === 0) return '-';
    const sortedOrders = [...orders].sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
    return formatDate(sortedOrders[0].order_date);
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAllCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      } else {
        setError(response.message || 'Failed to load customers');
      }
    } catch (err) {
      setError('An error occurred while loading customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateCustomerData): Promise<CustomerSaveResult> => {
    try {
      const response = await customerService.createCustomer(data);
      if (response.success) {
        setShowModal(false);
        showToast('Customer created successfully', 'success');
        loadCustomers();
        return { success: true };
      }
      return { success: false, message: response.message || 'Failed to create customer' };
    } catch {
      return { success: false, message: 'An error occurred while creating customer' };
    }
  };

  const handleUpdate = async (id: number, data: CreateCustomerData): Promise<CustomerSaveResult> => {
    try {
      const response = await customerService.updateCustomer(id, data);
      if (response.success) {
        setShowModal(false);
        setEditingCustomer(null);
        showToast('Customer updated successfully', 'success');
        loadCustomers();
        return { success: true };
      }
      return { success: false, message: response.message || 'Failed to update customer' };
    } catch {
      return { success: false, message: 'An error occurred while updating customer' };
    }
  };

  const handleDelete = async (id: number) => {
    const customer = customers.find(c => c.id === id);
    if (customer) {
      setCustomerToDelete(customer);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      const response = await customerService.deleteCustomer(customerToDelete.id);
      if (response.success) {
        setShowDeleteConfirm(false);
        setCustomerToDelete(null);
        loadCustomers();
      } else {
        setError(response.message || 'Failed to delete customer');
      }
    } catch (err) {
      setError('An error occurred while deleting customer');
    }
  };

  const handleViewActivities = async (customer: Customer) => {
    try {
      const response = await customerActivityService.getActivityTimeline(customer.id);
      if (response.success && response.data) {
        setSelectedCustomerActivities(response.data);
        setSelectedCustomerName(customer.company_name);
        setSelectedCustomerId(customer.id);
        setShowActivitiesModal(true);
      } else {
        setError(response.message || 'Failed to load activities');
      }
    } catch (err) {
      setError('An error occurred while loading activities');
    }
  };

  const handleViewDetails = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleCreateActivity = async (data: any) => {
    try {
      const response = await customerActivityService.createActivity(data);
      if (response.success) {
        setShowActivityFormModal(false);
        setEditingActivity(null);
        if (selectedCustomerId) {
          handleViewActivities({ id: selectedCustomerId, company_name: selectedCustomerName } as Customer);
        }
      } else {
        setError(response.message || 'Failed to create activity');
      }
    } catch (err) {
      setError('An error occurred while creating activity');
    }
  };

  const handleUpdateActivity = async (id: number, data: any) => {
    try {
      const response = await customerActivityService.updateActivity(id, data);
      if (response.success) {
        setShowActivityFormModal(false);
        setEditingActivity(null);
        if (selectedCustomerId) {
          handleViewActivities({ id: selectedCustomerId, company_name: selectedCustomerName } as Customer);
        }
      } else {
        setError(response.message || 'Failed to update activity');
      }
    } catch (err) {
      setError('An error occurred while updating activity');
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    
    try {
      const response = await customerActivityService.deleteActivity(id);
      if (response.success) {
        if (selectedCustomerId) {
          handleViewActivities({ id: selectedCustomerId, company_name: selectedCustomerName } as Customer);
        }
      } else {
        setError(response.message || 'Failed to delete activity');
      }
    } catch (err) {
      setError('An error occurred while deleting activity');
    }
  };

  if (loading) return <CustomersSkeleton />;
  if (error) return (
    <div className="p-6">
      <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
        <p className="text-danger-700 mb-4">{error}</p>
        <button
          onClick={loadCustomers}
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
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Customers</h1>
            <p className="text-sm text-navy-500 mt-1">Manage your customers and customer relationships</p>
          </div>
        </div>
        {permissions.canManageCustomers && (
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Customers" value={totalCustomers} subtitle="All customers" icon={<UsersIcon className="w-6 h-6" />} color="blue" />
        <KPICard title="Active Customers" value={activeCustomers} subtitle="Currently active" icon={<CheckIcon className="w-6 h-6" />} color="green" />
        <KPICard title="Inactive Customers" value={inactiveCustomers} subtitle="Not active" icon={<ClockIcon className="w-6 h-6" />} color="amber" />
        <KPICard title="New Customers" value={newCustomers} subtitle="Last 30 days" icon={<SparkleIcon className="w-6 h-6" />} color="purple" />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search customers by company, contact, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2.5 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-navy-100">
            <thead className="bg-navy-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">
                  Total Orders
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">
                  Last Order
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-navy-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-navy-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-xs text-navy-400 font-mono">#{customer.id}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-600">
                          {customer.company_name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-navy-900">{customer.company_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-navy-700">{customer.contact_person}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-navy-700">{customer.email}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-navy-700">{customer.phone || '-'}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge isActive={customer.is_active} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-navy-900">{getCustomerTotalOrders(customer.id)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-navy-900">{formatCurrency(getCustomerTotalSpent(customer.id))}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-navy-500">{getCustomerLastOrder(customer.id)}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuOpen(actionMenuOpen === customer.id ? null : customer.id);
                        }}
                        className="p-2 text-navy-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 012 0zm0 7a1 1 0 110-2 1 1 0 012 0zm0 7a1 1 0 110-2 1 1 0 012 0z" />
                        </svg>
                      </button>
                      {actionMenuOpen === customer.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-navy-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setActionMenuOpen(null);
                                handleViewDetails(customer);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                setActionMenuOpen(null);
                                handleViewActivities(customer);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                            >
                              View Activities
                            </button>
                            {permissions.canManageCustomers && (
                            <button
                              onClick={() => {
                                setActionMenuOpen(null);
                                setEditingCustomer(customer);
                                setShowModal(true);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                            >
                              Edit Customer
                            </button>
                            )}
                            {permissions.canDeleteCustomers && customer.is_active && (
                              <button
                                onClick={async () => {
                                  setActionMenuOpen(null);
                                  try {
                                    const response = await customerService.deactivateCustomer(customer.id);
                                    if (response.success) {
                                      showToast('Customer deactivated', 'success');
                                      loadCustomers();
                                    }
                                  } catch (err) {
                                    setError('Failed to deactivate customer');
                                  }
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-warning-600 hover:bg-warning-50 transition-colors"
                              >
                                Deactivate Customer
                              </button>
                            )}
                            {permissions.canDeleteCustomers && (
                            <button
                              onClick={() => {
                                setActionMenuOpen(null);
                                handleDelete(customer.id);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                            >
                              Delete
                            </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-navy-400" />
            </div>
            <p className="text-navy-500 font-medium">No customers found</p>
            <p className="text-sm text-navy-400 mt-1">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Get started by adding your first customer'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Customer
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <CustomerModal
          onClose={() => {
            setShowModal(false);
            setEditingCustomer(null);
          }}
          onSave={editingCustomer ? (data) => handleUpdate(editingCustomer.id, data) : handleCreate}
          customer={editingCustomer}
        />
      )}

      {showActivitiesModal && (
        <CustomerActivitiesModal
          onClose={() => setShowActivitiesModal(false)}
          activities={selectedCustomerActivities}
          customerName={selectedCustomerName}
          onAddActivity={() => {
            setEditingActivity(null);
            setShowActivityFormModal(true);
          }}
          onEditActivity={(activity) => {
            setEditingActivity(activity);
            setShowActivityFormModal(true);
          }}
          onDeleteActivity={handleDeleteActivity}
        />
      )}

      {showActivityFormModal && (
        <ActivityFormModal
          onClose={() => {
            setShowActivityFormModal(false);
            setEditingActivity(null);
          }}
          onSave={editingActivity ? (data) => handleUpdateActivity(editingActivity.id, data) : handleCreateActivity}
          activity={editingActivity}
          customerId={selectedCustomerId || 0}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && customerToDelete && (
        <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg-premium border border-navy-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
                <DeleteIcon className="w-6 h-6 text-danger-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-navy-900">Delete Customer</h2>
                <p className="text-sm text-navy-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-navy-700 mb-6">
              Are you sure you want to delete <strong>{customerToDelete.company_name}</strong>? This will permanently remove the customer and all associated data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCustomerToDelete(null);
                }}
                className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && editingCustomer && (
        <CustomerDetailsModal
          customer={editingCustomer}
          orders={customerOrders[editingCustomer.id] || []}
          onClose={() => {
            setShowDetailsModal(false);
            setEditingCustomer(null);
          }}
          onEdit={() => {
            setShowDetailsModal(false);
            setShowModal(true);
          }}
        />
      )}
    </div>
  );
}

function CustomerActivitiesModal({ 
  onClose, 
  activities, 
  customerName,
  onAddActivity,
  onEditActivity,
  onDeleteActivity 
}: { 
  onClose: () => void; 
  activities: CustomerActivity[]; 
  customerName: string;
  onAddActivity: () => void;
  onEditActivity: (activity: CustomerActivity) => void;
  onDeleteActivity: (id: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-navy-900">Activity History</h2>
              <p className="text-sm text-navy-500 mt-1">{customerName}</p>
            </div>
            <button
              onClick={onAddActivity}
              className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm shadow-sm-premium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Activity
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ActivityIcon className="w-8 h-8 text-navy-400" />
              </div>
              <p className="text-navy-500 font-medium">No activities recorded</p>
              <p className="text-sm text-navy-400 mt-1">Activities will appear here as you interact with this customer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="bg-navy-50 rounded-lg p-4 hover:bg-navy-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full capitalize">
                          {activity.activity_type}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          activity.status === 'completed' ? 'bg-success-100 text-success-700' :
                          activity.status === 'in_progress' ? 'bg-warning-100 text-warning-700' :
                          activity.status === 'cancelled' ? 'bg-danger-100 text-danger-700' :
                          'bg-navy-100 text-navy-700'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <p className="font-medium text-navy-900">{activity.subject}</p>
                      {activity.description && (
                        <p className="text-sm text-navy-600 mt-1">{activity.description}</p>
                      )}
                      <p className="text-xs text-navy-400 mt-2">
                        {new Date(activity.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => onEditActivity(activity)}
                        className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => onDeleteActivity(activity.id)}
                        className="p-2 text-danger-600 hover:text-danger-700 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-navy-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityFormModal({ 
  onClose, 
  onSave, 
  activity, 
  customerId 
}: { 
  onClose: () => void; 
  onSave: (data: any) => void; 
  activity?: CustomerActivity | null;
  customerId: number;
}) {
  const [formData, setFormData] = useState({
    activity_type: activity?.activity_type || 'call',
    subject: activity?.subject || '',
    description: activity?.description || '',
    status: activity?.status || 'pending',
    due_date: activity?.due_date ? activity.due_date.split('T')[0] : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      customer_id: customerId,
      ...formData,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg-premium border border-navy-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-navy-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-navy-900">{activity ? 'Edit Activity' : 'Add Activity'}</h2>
              <p className="text-sm text-navy-500 mt-1">{activity ? 'Update activity details' : 'Record a new customer activity'}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form id="activity-form" onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Activity Type</label>
            <select
              value={formData.activity_type}
              onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
              className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="visit">Visit</option>
              <option value="note">Note</option>
              <option value="task">Task</option>
              <option value="reminder">Reminder</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Subject *</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        </form>
        <div className="p-6 border-t border-navy-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="activity-form"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors"
          >
            Save Activity
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
      isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function CustomersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-navy-200 rounded w-48 animate-pulse"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-navy-200 rounded w-24 animate-pulse"></div>
                <div className="h-8 bg-navy-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="w-12 h-12 bg-navy-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-16 bg-white rounded-xl border border-navy-200 shadow-premium p-4 animate-pulse"></div>
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-navy-100 rounded-lg animate-pulse"></div>
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

function DeleteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CustomerDetailsModal({ customer, orders, onClose, onEdit }: { customer: Customer; orders: Order[]; onClose: () => void; onEdit: () => void }) {
  const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = orders.length;
  const lastOrder = orders.length > 0 ? orders.reduce((latest, order) => 
    new Date(order.order_date) > new Date(latest.order_date) ? order : latest
  ) : null;

  const displayName = customer.company_name || customer.contact_person || 'Individual Customer';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-navy-900">{displayName}</h2>
              <p className="text-sm text-navy-500 mt-1">Customer Details</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Company Name</p>
                <p className="text-sm font-medium text-navy-900">{customer.company_name || '-'}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Contact Person</p>
                <p className="text-sm font-medium text-navy-900">{customer.contact_person}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Email</p>
                <p className="text-sm font-medium text-navy-900">{customer.email}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Phone</p>
                <p className="text-sm font-medium text-navy-900">{customer.phone || '-'}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Status</p>
                <StatusBadge isActive={customer.is_active} />
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Customer Type</p>
                <p className="text-sm font-medium text-navy-900">{customer.customer_type || '-'}</p>
              </div>
            </div>
            {customer.address && (
              <div className="mt-4 bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Address</p>
                <p className="text-sm text-navy-900">
                  {customer.address}
                  {customer.city && `, ${customer.city}`}
                  {customer.state && `, ${customer.state}`}
                  {customer.postal_code && ` - ${customer.postal_code}`}
                  {customer.country && `, ${customer.country}`}
                </p>
              </div>
            )}
            {customer.tax_id && (
              <div className="mt-4 bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Tax ID</p>
                <p className="text-sm text-navy-900">{customer.tax_id}</p>
              </div>
            )}
            {customer.credit_limit !== undefined && customer.credit_limit > 0 && (
              <div className="mt-4 bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Credit Limit</p>
                <p className="text-sm font-medium text-navy-900">{formatCurrency(customer.credit_limit)}</p>
              </div>
            )}
            {customer.notes && (
              <div className="mt-4 bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Notes</p>
                <p className="text-sm text-navy-900">{customer.notes}</p>
              </div>
            )}
            <div className="mt-4 bg-navy-50 rounded-lg p-4">
              <p className="text-xs text-navy-500 mb-1">Created Date</p>
              <p className="text-sm font-medium text-navy-900">{formatDate(customer.created_at)}</p>
            </div>
          </div>

          {/* Order Statistics */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-4">Order Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-xs text-primary-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-primary-900">{totalOrders}</p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-xs text-primary-600 mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-primary-900">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-xs text-primary-600 mb-1">Last Order</p>
                <p className="text-sm font-semibold text-primary-900">{lastOrder ? formatDate(lastOrder.order_date) : '-'}</p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          {orders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-4">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-navy-100">
                  <thead className="bg-navy-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Order #</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-navy-50">
                        <td className="px-4 py-3 text-sm font-medium text-navy-900">{order.order_number}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-navy-900 text-right">{formatCurrency(order.total_amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <StatusBadge isActive={order.status !== 'cancelled'} />
                        </td>
                        <td className="px-4 py-3 text-sm text-navy-500 text-right">{formatDate(order.order_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-navy-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors"
          >
            Edit Customer
          </button>
        </div>
      </div>
    </div>
  );
}
