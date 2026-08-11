import { useState, useEffect } from 'react';
import { challanService, customerService, productService } from '../services';
import type { Challan, Customer, Product } from '../services';
import { KPICard, EmptyState } from '../components/ui';
import { formatDate, formatCurrency } from '../utils/formatters';
import { usePermissions, useSearch, useToast } from '../context';

export default function Challans() {
  const permissions = usePermissions();
  const { consumePendingSearch } = useSearch();
  const { showToast } = useToast();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'confirmed' | 'cancelled'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChallan, setEditingChallan] = useState<Challan | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleViewChallanDetails = async (challan: Challan) => {
    setShowDetailsModal(true);
    setSelectedChallan(challan);
    setLoadingDetails(true);
    try {
      const response = await challanService.getChallanById(challan.id);
      if (response.success && response.data) {
        setSelectedChallan(response.data);
      }
    } catch {
      // keep list data if fetch fails
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadChallans();
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    const term = consumePendingSearch('challans');
    if (term) setSearchTerm(term);
  }, [consumePendingSearch]);

  const loadChallans = async () => {
    try {
      setLoading(true);
      const response = await challanService.getAllChallans({ limit: 100 });
      if (response.success && response.data) {
        setChallans(response.data);
      } else {
        setError(response.message || 'Failed to load challans');
      }
    } catch (err) {
      setError('An error occurred while loading challans');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAllCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (err) {
      console.error('Failed to load customers');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch (err) {
      console.error('Failed to load products');
    }
  };

  const handleEditChallan = async (challan: Challan) => {
    try {
      const response = await challanService.getChallanById(challan.id);
      if (response.success && response.data) {
        setEditingChallan(response.data);
        setShowEditModal(true);
      } else {
        setError(response.message || 'Failed to load challan for editing');
      }
    } catch {
      setError('An error occurred while loading challan');
    }
  };

  const handleConfirmChallan = async (challan: Challan) => {
    if (!confirm('Confirm this challan? Once confirmed, stock will be deducted from inventory.')) {
      return;
    }
    try {
      const response = await challanService.confirmChallan(challan.id);
      if (response.success) {
        showToast('Challan confirmed successfully', 'success');
        loadChallans();
        loadProducts();
      } else {
        setError(response.message || 'Failed to confirm challan');
      }
    } catch (err) {
      setError('An error occurred while confirming challan');
    }
  };

  const handleCancelChallan = async (challan: Challan) => {
    if (!confirm('Are you sure you want to cancel this challan?')) {
      return;
    }
    try {
      const response = await challanService.cancelChallan(challan.id);
      if (response.success) {
        loadChallans();
      } else {
        setError(response.message || 'Failed to cancel challan');
      }
    } catch (err) {
      setError('An error occurred while cancelling challan');
    }
  };

  // Calculate statistics
  const totalChallans = challans.length;
  const draftCount = challans.filter(c => c.status === 'draft').length;
  const confirmedCount = challans.filter(c => c.status === 'confirmed').length;
  const totalQuantity = challans.reduce((sum, c) => sum + c.total_quantity, 0);

  // Filter challans
  const filteredChallans = challans.filter(challan => {
    const matchesSearch = 
      (challan.challan_number && challan.challan_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (challan.customer_name && challan.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || challan.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <ChallansSkeleton />;
  if (error) return (
    <div className="p-6">
      <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
        <p className="text-danger-700 mb-4">{error}</p>
        <button
          onClick={loadChallans}
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
            <ChallanIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Sales Challans</h1>
            <p className="text-sm text-navy-500 mt-1">Manage sales challans and product dispatch</p>
          </div>
        </div>
        {permissions.canManageChallans && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Challan
        </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Challans"
          value={totalChallans}
          subtitle="All challans"
          icon={<ClipboardListIcon className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Draft"
          value={draftCount}
          subtitle="Awaiting confirmation"
          icon={<FileEditIcon className="w-6 h-6" />}
          color="amber"
        />
        <KPICard
          title="Confirmed"
          value={confirmedCount}
          subtitle="Stock deducted"
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Total Quantity"
          value={totalQuantity}
          subtitle="Units dispatched"
          icon={<PackageCheckIcon className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by challan number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'confirmed' | 'cancelled')}
              className="px-4 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
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

      {/* Challans Table */}
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] divide-y divide-navy-100">
            <thead className="bg-navy-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Challan #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Total Items</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Total Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Created By</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-navy-100">
              {filteredChallans.map((challan) => (
                <tr key={challan.id} className="hover:bg-navy-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-navy-600 bg-navy-100 px-2 py-1 rounded">{challan.challan_number}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-navy-900">{challan.customer_name || `Customer ${challan.customer_id}`}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-navy-700">{formatDate(challan.created_at)}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-navy-900">{challan.total_items}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-navy-900">{challan.total_quantity}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      challan.status === 'draft' 
                        ? 'bg-amber-100 text-amber-700' 
                        : challan.status === 'confirmed'
                        ? 'bg-success-100 text-success-700'
                        : 'bg-danger-100 text-danger-700'
                    }`}>
                      {challan.status.charAt(0).toUpperCase() + challan.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-navy-700">User {challan.created_by}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewChallanDetails(challan)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        View Details
                      </button>
                      {challan.status === 'draft' && permissions.canManageChallans && (
                        <>
                          <button
                            onClick={() => handleEditChallan(challan)}
                            className="text-sm text-navy-600 hover:text-navy-900 font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleConfirmChallan(challan)}
                            className="text-sm text-success-600 hover:text-success-700 font-medium transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleCancelChallan(challan)}
                            className="text-sm text-danger-600 hover:text-danger-700 font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredChallans.length === 0 && (
          <EmptyState
            icon={<ChallanIcon />}
            title="No sales challans found"
            description={searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first sales challan to start tracking product dispatch'}
          />
        )}
      </div>

      {showCreateModal && (
        <CreateChallanModal
          customers={customers}
          products={products}
          onClose={() => setShowCreateModal(false)}
          onSave={loadChallans}
        />
      )}

      {showEditModal && editingChallan && (
        <CreateChallanModal
          customers={customers}
          products={products}
          challan={editingChallan}
          onClose={() => {
            setShowEditModal(false);
            setEditingChallan(null);
          }}
          onSave={loadChallans}
        />
      )}

      {showDetailsModal && selectedChallan && (
        <ChallanDetailsModal
          challan={selectedChallan}
          loading={loadingDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedChallan(null);
          }}
          onConfirm={handleConfirmChallan}
          onCancel={handleCancelChallan}
        />
      )}
    </div>
  );
}

// Icon Components
function ChallanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function FileEditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

function PackageCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4M9 5h6M9 12h6M9 19h6" />
    </svg>
  );
}

function ChallansSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 bg-navy-200 rounded w-48 animate-pulse"></div>
          <div className="h-4 bg-navy-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-10 bg-navy-200 rounded w-32 animate-pulse"></div>
      </div>

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

function CreateChallanModal({ customers, products, challan, onClose, onSave }: { customers: Customer[]; products: Product[]; challan?: Challan; onClose: () => void; onSave: () => void }) {
  const isEditing = !!challan;
  const [formData, setFormData] = useState({
    customer_id: challan?.customer_id || 0,
    items: (challan?.items?.map(item => ({ product_id: item.product_id, quantity: item.quantity })) || []) as Array<{ product_id: number; quantity: number }>,
    notes: challan?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: 0, quantity: 1 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: 'product_id' | 'quantity', value: number) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (confirm: boolean = false) => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) newErrors.customer_id = 'Customer is required';
    if (formData.items.length === 0) newErrors.items = 'At least one product is required';
    
    formData.items.forEach((item, index) => {
      if (!item.product_id) newErrors[`item_${index}_product`] = 'Product is required';
      if (!item.quantity || item.quantity <= 0) newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      
      // Stock validation for confirm
      if (confirm) {
        const product = products.find(p => p.id === item.product_id);
        if (product && item.quantity > product.current_stock) {
          newErrors[`item_${index}_quantity`] = `Insufficient stock. Available: ${product.current_stock}`;
        }
      }
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (confirm) {
      setIsConfirming(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      const response = isEditing && challan
        ? await challanService.updateChallan(challan.id, formData)
        : await challanService.createChallan(formData);
      if (response.success && response.data) {
        const challanId = response.data.id;
        // If confirming, call confirm endpoint
        if (confirm) {
          const confirmResponse = await challanService.confirmChallan(challanId);
          if (confirmResponse.success) {
            onSave();
            onClose();
          } else {
            setErrors({ submit: confirmResponse.message || 'Failed to confirm challan' });
          }
        } else {
          onSave();
          onClose();
        }
      } else {
        setErrors({ submit: response.message || `Failed to ${isEditing ? 'update' : 'create'} challan` });
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || `An error occurred while ${isEditing ? 'updating' : 'creating'} challan`;
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200">
          <h2 className="text-xl font-semibold text-navy-900">{isEditing ? 'Edit Sales Challan' : 'Create Sales Challan'}</h2>
          <p className="text-sm text-navy-500 mt-1">{isEditing ? `Update draft challan ${challan?.challan_number}` : 'Create a challan for customer product dispatch'}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Customer Information</h3>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Customer *</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
                  className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.contact_person})</option>
                  ))}
                </select>
                {errors.customer_id && <p className="text-danger-600 text-xs mt-1">{errors.customer_id}</p>}
              </div>
              {selectedCustomer && (
                <div className="mt-3 bg-navy-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Contact Person</p>
                    <p className="text-sm text-navy-900">{selectedCustomer.contact_person}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Email</p>
                    <p className="text-sm text-navy-900">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Phone</p>
                    <p className="text-sm text-navy-900">{selectedCustomer.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">GST/Tax ID</p>
                    <p className="text-sm text-navy-900">{selectedCustomer.tax_id || '-'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Products */}
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Products</h3>
              {formData.items.map((item, index) => {
                const product = products.find(p => p.id === item.product_id);
                const availableStock = product?.current_stock || 0;
                const insufficientStock = item.quantity > availableStock;

                return (
                  <div key={index} className="bg-navy-50 rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Product *</label>
                        <select
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', parseInt(e.target.value))}
                          className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        >
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                        {errors[`item_${index}_product`] && <p className="text-danger-600 text-xs mt-1">{errors[`item_${index}_product`]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Quantity *</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                        {errors[`item_${index}_quantity`] && <p className="text-danger-600 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>}
                        {insufficientStock && (
                          <p className="text-danger-600 text-xs mt-1">Insufficient stock. Only {availableStock} units available.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Available Stock</label>
                        <p className="text-sm text-navy-900 py-2.5">{availableStock}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Unit Price</label>
                        <p className="text-sm text-navy-900 py-2.5">{product ? formatCurrency(product.unit_price) : '-'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="mt-2 text-sm text-danger-600 hover:text-danger-700 font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
              <button
                onClick={handleAddItem}
                className="w-full py-2 border-2 border-dashed border-navy-300 rounded-lg text-navy-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
              >
                + Add Product
              </button>
              {errors.items && <p className="text-danger-600 text-xs mt-2">{errors.items}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <p className="text-danger-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Totals */}
            {formData.items.length > 0 && (
              <div className="bg-navy-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Total Items</p>
                    <p className="text-lg font-semibold text-navy-900">{formData.items.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Total Quantity</p>
                    <p className="text-lg font-semibold text-navy-900">{formData.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Total Amount</p>
                    <p className="text-lg font-semibold text-navy-900">
                      {formatCurrency(formData.items.reduce((sum, item) => {
                        const product = products.find(p => p.id === item.product_id);
                        return sum + (product ? product.unit_price * item.quantity : 0);
                      }, 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-navy-200 flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            disabled={isSubmitting || isConfirming}
            className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button 
            onClick={() => handleSubmit(false)} 
            disabled={isSubmitting || isConfirming}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow-sm-premium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </button>
          <button 
            onClick={() => handleSubmit(true)} 
            disabled={isSubmitting || isConfirming}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming ? 'Confirming...' : 'Save & Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChallanDetailsModal({ challan, loading, onClose, onConfirm, onCancel }: { challan: Challan; loading?: boolean; onClose: () => void; onConfirm: (c: Challan) => void; onCancel: (c: Challan) => void }) {
  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200">
          <h2 className="text-xl font-semibold text-navy-900">Sales Challan</h2>
          <p className="text-sm text-navy-500 mt-1">{challan.challan_number}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-navy-600">Loading challan details...</span>
            </div>
          ) : (
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Customer</h3>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-sm font-medium text-navy-900">{challan.customer_name || `Customer ${challan.customer_id}`}</p>
                <p className="text-sm text-navy-700 mt-1">{challan.customer_email || '-'}</p>
                <p className="text-sm text-navy-700">{challan.customer_phone || '-'}</p>
              </div>
            </div>

            {/* Challan Information */}
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Challan Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-navy-50 rounded-lg p-4">
                  <p className="text-xs text-navy-500 mb-1">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    challan.status === 'draft' 
                      ? 'bg-amber-100 text-amber-700' 
                      : challan.status === 'confirmed'
                      ? 'bg-success-100 text-success-700'
                      : 'bg-danger-100 text-danger-700'
                  }`}>
                    {challan.status.charAt(0).toUpperCase() + challan.status.slice(1)}
                  </span>
                </div>
                <div className="bg-navy-50 rounded-lg p-4">
                  <p className="text-xs text-navy-500 mb-1">Created Date</p>
                  <p className="text-sm text-navy-900">{formatDate(challan.created_at)}</p>
                </div>
                <div className="bg-navy-50 rounded-lg p-4">
                  <p className="text-xs text-navy-500 mb-1">Created By</p>
                  <p className="text-sm text-navy-900">User {challan.created_by}</p>
                </div>
                {challan.confirmed_at && (
                  <div className="bg-navy-50 rounded-lg p-4">
                    <p className="text-xs text-navy-500 mb-1">Confirmed Date</p>
                    <p className="text-sm text-navy-900">{formatDate(challan.confirmed_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Products</h3>
              <div className="bg-white border border-navy-200 rounded-lg overflow-hidden">
                <table className="w-full divide-y divide-navy-100">
                  <thead className="bg-navy-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase">SKU</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {challan.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-navy-900">{item.product_name}</td>
                        <td className="px-4 py-3 text-sm text-navy-600">{item.sku}</td>
                        <td className="px-4 py-3 text-sm text-navy-900 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-sm text-navy-900 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-navy-900 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-navy-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-navy-500 mb-1">Total Items</p>
                  <p className="text-lg font-semibold text-navy-900">{challan.total_items}</p>
                </div>
                <div>
                  <p className="text-xs text-navy-500 mb-1">Total Quantity</p>
                  <p className="text-lg font-semibold text-navy-900">{challan.total_quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-navy-500 mb-1">Grand Total</p>
                  <p className="text-lg font-semibold text-navy-900">{formatCurrency(challan.total_amount)}</p>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
        <div className="p-6 border-t border-navy-200 flex justify-between">
          {challan.status === 'draft' && !loading && (
            <div className="flex space-x-3">
              <button
                onClick={() => onCancel(challan)}
                className="px-4 py-2 border border-danger-300 text-danger-600 rounded-lg hover:bg-danger-50 transition-colors"
              >
                Cancel Challan
              </button>
              <button
                onClick={() => onConfirm(challan)}
                className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 shadow-sm-premium transition-colors"
              >
                Confirm Challan
              </button>
            </div>
          )}
          <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors ml-auto">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
