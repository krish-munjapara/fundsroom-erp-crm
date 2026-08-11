import { useState, useEffect, useCallback } from 'react';
import { orderService, customerService, productService } from '../services';
import type { Order, Customer, Product, OrderStats } from '../services';
import { formatCurrency, safeNumber, formatDate } from '../utils/formatters';
import { KPICard, StatusBadge, EmptyState } from '../components/ui';
import { usePermissions, useSearch, useToast } from '../context';

interface OrderFormItem {
  product_id: number;
  quantity: number;
}

export default function Orders() {
  const permissions = usePermissions();
  const canManageOrders = permissions.canManageOrders;
  const { consumePendingSearch } = useSearch();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersResponse, statsResponse] = await Promise.all([
        orderService.getAllOrders({ limit: 500 }),
        orderService.getOrderStats(),
      ]);

      if (ordersResponse.success && ordersResponse.data) {
        const normalizedOrders = ordersResponse.data.map((order) => ({
          ...order,
          total_amount: safeNumber(order.total_amount),
        }));
        setOrders(normalizedOrders);
      } else {
        setError(ordersResponse.message || 'Failed to load orders');
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch {
      setError('An error occurred while loading orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadCustomers();
    loadProducts();
  }, [loadOrders]);

  useEffect(() => {
    const term = consumePendingSearch('orders');
    if (term) setSearchTerm(term);
  }, [consumePendingSearch]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAllCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch {
      console.error('Failed to load customers');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      if (response.success && response.data) {
        setProducts(response.data);
      }
    } catch {
      console.error('Failed to load products');
    }
  };

  const handleViewDetails = async (order: Order) => {
    setShowDetailsModal(true);
    setLoadingDetails(true);
    setSelectedOrder(order);

    try {
      const response = await orderService.getOrderById(order.id);
      if (response.success && response.data) {
        setSelectedOrder({
          ...response.data,
          total_amount: safeNumber(response.data.total_amount),
        });
      }
    } catch {
      // Keep list data if detail fetch fails
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEditOrder = async (order: Order) => {
    setShowDetailsModal(false);
    setLoadingDetails(true);

    try {
      const response = await orderService.getOrderById(order.id);
      if (response.success && response.data) {
        setSelectedOrder({
          ...response.data,
          total_amount: safeNumber(response.data.total_amount),
        });
        setShowEditModal(true);
      }
    } catch {
      setError('Failed to load order for editing');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleConfirmOrder = async (order: Order) => {
    if (!window.confirm(`Confirm order ${order.order_number}? This will deduct stock from inventory.`)) {
      return;
    }

    try {
      const response = await orderService.confirmOrder(order.id);
      if (response.success) {
        showToast('Order confirmed successfully', 'success');
        setShowDetailsModal(false);
        setSelectedOrder(null);
        loadOrders();
      } else {
        return response.message || 'Failed to confirm order';
      }
    } catch (err: any) {
      return err?.response?.data?.message || err?.message || 'Failed to confirm order';
    }
    return null;
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchLower) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchLower)) ||
      (order.customer_contact && order.customer_contact.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = stats ? safeNumber(stats.total_orders) : orders.length;
  const pendingOrders = stats ? safeNumber(stats.pending_orders) : orders.filter((o) => o.status === 'pending').length;
  const confirmedOrders = stats ? safeNumber(stats.confirmed_orders) : orders.filter((o) => o.status === 'confirmed').length;
  const totalRevenue = stats ? safeNumber(stats.total_revenue) : orders.reduce((sum, order) => sum + order.total_amount, 0);

  if (loading) return <OrdersSkeleton />;
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
          <p className="text-danger-700 mb-4">{error}</p>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
            <OrdersIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Orders</h1>
            <p className="text-sm text-navy-500 mt-1">Manage customer orders and fulfillment</p>
          </div>
        </div>
        {canManageOrders && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Order
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Orders" value={totalOrders} subtitle="All orders" icon={<OrdersIcon />} color="blue" />
        <KPICard title="Pending" value={pendingOrders} subtitle="Awaiting action" icon={<ClockIcon />} color="amber" />
        <KPICard title="Confirmed" value={confirmedOrders} subtitle="Processing" icon={<CheckIcon />} color="green" />
        <KPICard title="Total Revenue" value={formatCurrency(totalRevenue)} subtitle="Order value" icon={<RevenueIcon />} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by order number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
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

      <div className="bg-white rounded-xl border border-navy-200 shadow-premium overflow-hidden">
        <div className="overflow-x-auto -mx-6 px-6 custom-scrollbar">
          <table className="min-w-[1000px] divide-y divide-navy-100">
            <thead className="bg-navy-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-navy-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-navy-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-navy-50 transition-colors cursor-pointer" onClick={() => handleViewDetails(order)}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-navy-900">{order.order_number}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-navy-700">{order.customer_name || `Customer ${order.customer_id}`}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-navy-700">{formatDate(order.order_date)}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-navy-900">{formatCurrency(order.total_amount)}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(order);
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && (
          <EmptyState
            icon={<OrdersIcon />}
            title="No orders found"
            description={searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Get started by creating your first order'}
            action={
              !searchTerm &&
              statusFilter === 'all' &&
              canManageOrders && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create Order
                </button>
              )
            }
          />
        )}
      </div>

      {showCreateModal && (
        <OrderFormModal
          mode="create"
          customers={customers}
          products={products}
          onClose={() => setShowCreateModal(false)}
          onSave={loadOrders}
        />
      )}

      {showEditModal && selectedOrder && (
        <OrderFormModal
          mode="edit"
          order={selectedOrder}
          customers={customers}
          products={products}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
          onSave={loadOrders}
        />
      )}

      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          loading={loadingDetails}
          canManage={canManageOrders}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
          onEdit={() => handleEditOrder(selectedOrder)}
          onConfirm={handleConfirmOrder}
        />
      )}
    </div>
  );
}

function OrderFormModal({
  mode,
  order,
  customers,
  products,
  onClose,
  onSave,
}: {
  mode: 'create' | 'edit';
  order?: Order;
  customers: Customer[];
  products: Product[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    customer_id: order?.customer_id || 0,
    items: (order?.items?.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })) || [{ product_id: 0, quantity: 1 }]) as OrderFormItem[],
    notes: order?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = () => {
    setFormData({ ...formData, items: [...formData.items, { product_id: 0, quantity: 1 }] });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const handleItemChange = (index: number, field: 'product_id' | 'quantity', value: number) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) newErrors.customer_id = 'Please select a customer';
    if (formData.items.length === 0) newErrors.items = 'At least one product is required';

    formData.items.forEach((item, index) => {
      if (!item.product_id) newErrors[`item_${index}_product`] = 'Please select a product';
      if (!item.quantity || item.quantity <= 0) newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    const payload = {
      customer_id: formData.customer_id,
      notes: formData.notes || undefined,
      items: formData.items.map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: product ? Number(product.unit_price) : 0,
        };
      }),
    };

    try {
      const response =
        mode === 'create'
          ? await orderService.createOrder(payload)
          : await orderService.updateOrder(order!.id, payload);

      if (response.success) {
        onSave();
        onClose();
      } else {
        setErrors({ submit: response.message || `Failed to ${mode} order` });
      }
    } catch (err: any) {
      setErrors({
        submit: err?.response?.data?.message || err?.message || `An error occurred while ${mode === 'create' ? 'creating' : 'updating'} order`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === formData.customer_id);
  const totalItems = formData.items.filter((item) => item.product_id > 0).length;
  const totalQuantity = formData.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = formData.items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.product_id);
    return sum + (product ? Number(product.unit_price) * item.quantity : 0);
  }, 0);

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200">
          <h2 className="text-xl font-semibold text-navy-900">{mode === 'create' ? 'Create Order' : 'Edit Order'}</h2>
          <p className="text-sm text-navy-500 mt-1">
            {mode === 'create' ? 'Create a new pending order' : `Editing ${order?.order_number}`}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Customer Information</h3>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1">Customer *</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
                  className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                >
                  <option value={0}>Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.contact_person})
                    </option>
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

            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Order Items</h3>
              {formData.items.map((item, index) => {
                const product = products.find((p) => p.id === item.product_id);
                const availableStock = product?.current_stock ?? 0;

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
                          <option value={0}>Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                        {errors[`item_${index}_product`] && (
                          <p className="text-danger-600 text-xs mt-1">{errors[`item_${index}_product`]}</p>
                        )}
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
                        {errors[`item_${index}_quantity`] && (
                          <p className="text-danger-600 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Available Stock</label>
                        <p className="text-sm text-navy-900 py-2.5">{item.product_id ? availableStock : '-'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">Unit Price</label>
                        <p className="text-sm text-navy-900 py-2.5">
                          {product ? formatCurrency(product.unit_price) : '-'}
                        </p>
                        {product && item.quantity > 0 && (
                          <p className="text-xs text-navy-500">
                            Line: {formatCurrency(Number(product.unit_price) * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="mt-2 text-sm text-danger-600 hover:text-danger-700 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 border-2 border-dashed border-navy-300 rounded-lg text-navy-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
              >
                + Add Product
              </button>
              {errors.items && <p className="text-danger-600 text-xs mt-2">{errors.items}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>

            {errors.submit && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <p className="text-danger-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {formData.items.length > 0 && (
              <div className="bg-navy-50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Total Items</p>
                    <p className="text-lg font-semibold text-navy-900">{totalItems}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Total Quantity</p>
                    <p className="text-lg font-semibold text-navy-900">{totalQuantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Total Amount</p>
                    <p className="text-lg font-semibold text-navy-900">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-navy-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Order' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderDetailsModal({
  order,
  loading,
  canManage,
  onClose,
  onEdit,
  onConfirm,
}: {
  order: Order;
  loading: boolean;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onConfirm: (order: Order) => Promise<string | null>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const isPending = order.status === 'pending';
  const isConfirmed = order.status === 'confirmed';

  const handleConfirm = async () => {
    setConfirmError(null);
    setConfirming(true);
    const error = await onConfirm(order);
    if (error) setConfirmError(error);
    setConfirming(false);
  };

  const totalItems = order.total_items ?? order.items?.length ?? 0;
  const totalQuantity =
    order.total_quantity ?? order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-navy-900">Order Details</h2>
              <p className="text-sm text-navy-500 mt-1">{order.order_number}</p>
            </div>
            <button onClick={onClose} className="p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-navy-600">Loading order details...</span>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Order Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-navy-50 rounded-lg p-4">
                    <p className="text-xs text-navy-500 mb-1">Order Number</p>
                    <p className="text-sm font-medium text-navy-900">{order.order_number}</p>
                  </div>
                  <div className="bg-navy-50 rounded-lg p-4">
                    <p className="text-xs text-navy-500 mb-1">Status</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="bg-navy-50 rounded-lg p-4">
                    <p className="text-xs text-navy-500 mb-1">Order Date</p>
                    <p className="text-sm text-navy-900">{formatDate(order.order_date)}</p>
                  </div>
                  <div className="bg-navy-50 rounded-lg p-4">
                    <p className="text-xs text-navy-500 mb-1">Created By</p>
                    <p className="text-sm text-navy-900">{order.created_by_name || (order.created_by ? `User ${order.created_by}` : '-')}</p>
                  </div>
                  <div className="bg-navy-50 rounded-lg p-4">
                    <p className="text-xs text-navy-500 mb-1">Created At</p>
                    <p className="text-sm text-navy-900">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="bg-navy-50 rounded-lg p-4">
                    <p className="text-xs text-navy-500 mb-1">Updated At</p>
                    <p className="text-sm text-navy-900">{formatDate(order.updated_at)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Customer Information</h3>
                <div className="bg-navy-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Customer Name</p>
                    <p className="text-sm font-medium text-navy-900">{order.customer_contact || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Business Name</p>
                    <p className="text-sm text-navy-900">{order.customer_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Mobile</p>
                    <p className="text-sm text-navy-900">{order.customer_phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Email</p>
                    <p className="text-sm text-navy-900">{order.customer_email || '-'}</p>
                  </div>
                  {order.customer_tax_id && (
                    <div>
                      <p className="text-xs text-navy-500 mb-1">GST Number</p>
                      <p className="text-sm text-navy-900">{order.customer_tax_id}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Order Items</h3>
                <div className="bg-white border border-navy-200 rounded-lg overflow-hidden">
                  <table className="w-full divide-y divide-navy-100">
                    <thead className="bg-navy-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase">Product</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase">SKU</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm text-navy-900">{item.product_name}</td>
                            <td className="px-4 py-3 text-sm text-navy-600">{item.product_sku || item.sku}</td>
                            <td className="px-4 py-3 text-sm text-navy-900 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-navy-900 text-right">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-sm text-navy-900 text-right">
                              {formatCurrency(item.line_total ?? item.total_amount ?? item.subtotal)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-sm text-navy-500">
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-navy-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Total Items</p>
                    <p className="text-lg font-semibold text-navy-900">{totalItems}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Total Quantity</p>
                    <p className="text-lg font-semibold text-navy-900">{totalQuantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-navy-500 mb-1">Total Amount</p>
                    <p className="text-lg font-semibold text-navy-900">{formatCurrency(order.total_amount)}</p>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div>
                  <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-2">Notes</h3>
                  <p className="text-sm text-navy-900 bg-navy-50 p-3 rounded-lg">{order.notes}</p>
                </div>
              )}

              {isConfirmed && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">Confirmed orders cannot be edited.</p>
                </div>
              )}

              {confirmError && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                  <p className="text-danger-700 text-sm">{confirmError}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-navy-200 flex justify-between">
          {isPending && canManage && !loading && (
            <div className="flex space-x-3">
              <button
                onClick={onEdit}
                disabled={confirming}
                className="px-4 py-2 border border-primary-300 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors disabled:opacity-50"
              >
                Edit Order
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 shadow-sm-premium transition-colors disabled:opacity-50"
              >
                {confirming ? 'Confirming...' : 'Confirm Order'}
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            disabled={confirming}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors ml-auto disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function RevenueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function OrdersSkeleton() {
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
