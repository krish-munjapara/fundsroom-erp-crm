import { useState, useEffect } from 'react';
import { orderService, customerService, productService } from '../services';
import type { Order, Customer, Product } from '../services';
import { formatCurrency, safeNumber, formatDate } from '../utils/formatters';
import { KPICard, StatusBadge, EmptyState } from '../components/ui';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOrders();
    loadCustomers();
    loadProducts();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders();
      if (response.success && response.data) {
        const normalizedOrders = response.data.map((order: any) => ({
          ...order,
          total_amount: safeNumber(order.total_amount),
        }));
        setOrders(normalizedOrders);
      } else {
        setError(response.message || 'Failed to load orders');
      }
    } catch (err) {
      setError('An error occurred while loading orders');
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


  const handleCreate = async (data: any) => {
    try {
      setCreatingOrder(true);
      setError(null);
      const response = await orderService.createOrder(data);
      if (response.success) {
        setShowModal(false);
        loadOrders();
      } else {
        setError(response.message || 'Failed to create order');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'An error occurred while creating order';
      setError(errorMessage);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) return <OrdersSkeleton />;
  if (error) return (
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
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
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Order
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Orders"
          value={totalOrders}
          subtitle="All orders"
          icon={<OrdersIcon />}
          color="blue"
        />
        <KPICard
          title="Pending"
          value={pendingOrders}
          subtitle="Awaiting action"
          icon={<ClockIcon />}
          color="amber"
        />
        <KPICard
          title="Confirmed"
          value={confirmedOrders}
          subtitle="Processing"
          icon={<CheckIcon />}
          color="green"
        />
        <KPICard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle="Order value"
          icon={<RevenueIcon />}
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
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
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

      {/* Orders Table */}
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
            description={searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first order'}
            action={!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Order
              </button>
            )}
          />
        )}
      </div>

      {showModal && (
        <OrderModal
          key="order-modal"
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
          customers={customers}
          products={products}
          creatingOrder={creatingOrder}
        />
      )}

      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}

// Icon Components
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

function OrderDetailsModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-lg-premium border border-navy-200 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-navy-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-navy-900">Order Details</h2>
              <p className="text-sm text-navy-500 mt-1">{order.order_number}</p>
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
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-navy-500">Customer</p>
              <p className="text-sm font-medium text-navy-900">{order.customer_name || `Customer ${order.customer_id}`}</p>
            </div>
            <div>
              <p className="text-sm text-navy-500">Order Date</p>
              <p className="text-sm font-medium text-navy-900">{new Date(order.order_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-sm text-navy-500">Status</p>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <p className="text-sm text-navy-500">Total Amount</p>
              <p className="text-sm font-semibold text-navy-900">{formatCurrency(order.total_amount)}</p>
            </div>
          </div>
          
          {order.notes && (
            <div>
              <p className="text-sm text-navy-500 mb-2">Notes</p>
              <p className="text-sm text-navy-900 bg-navy-50 p-3 rounded-lg">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderModal({
  onClose,
  onSave,
  customers,
  products,
  creatingOrder,
}: {
  onClose: () => void;
  onSave: (data: any) => void;
  customers: Customer[];
  products: Product[];
  creatingOrder: boolean;
}) {
  const [formData, setFormData] = useState({
    customer_id: 0,
    product_id: 0,
    quantity: 1,
    notes: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    setFormData({
      customer_id: 0,
      product_id: 0,
      quantity: 1,
      notes: '',
    });
    setValidationError(null);
  }, []);

  const selectedProduct = products.find((p) => p.id === formData.product_id);
  const availableQuantity = selectedProduct ? selectedProduct.current_stock : 0;
  const unitPrice = selectedProduct ? Number(selectedProduct.unit_price) : 0;
  const total = formData.quantity * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (formData.customer_id === 0) {
      setValidationError('Please select a customer');
      return;
    }

    if (formData.product_id === 0) {
      setValidationError('Please select a product');
      return;
    }

    if (formData.quantity <= 0) {
      setValidationError('Quantity must be greater than 0');
      return;
    }

    if (formData.quantity > availableQuantity) {
      setValidationError(`Insufficient inventory. Only ${availableQuantity} units are available.`);
      return;
    }

    const orderData = {
      customer_id: formData.customer_id,
      items: [
        {
          product_id: formData.product_id,
          quantity: formData.quantity,
          unit_price: unitPrice,
        },
      ],
      notes: formData.notes || undefined,
    };

    onSave(orderData);
  };

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg-premium border border-navy-200">
        <h2 className="text-xl font-bold mb-4 text-navy-900">Create Order</h2>
        {validationError && (
          <div className="mb-4 p-3 bg-danger-100 text-danger-700 rounded-lg text-sm border border-danger-200">
            {validationError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700">Customer</label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-navy-300 rounded-lg shadow-sm-premium p-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value={0}>Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.company_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700">Product</label>
            <select
              required
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-navy-300 rounded-lg shadow-sm-premium p-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <option value={0}>Select a product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} - {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700">Quantity</label>
            <input
              type="number"
              required
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-navy-300 rounded-lg shadow-sm-premium p-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            {formData.product_id > 0 && selectedProduct && (
              <p className="mt-1 text-sm text-navy-600">
                Available: {availableQuantity} units
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700">Unit Price</label>
            <input
              type="text"
              value={`₹${unitPrice.toFixed(2)}`}
              disabled
              className="mt-1 block w-full border border-navy-300 rounded-lg shadow-sm-premium p-2 bg-navy-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700">Total</label>
            <input
              type="text"
              value={`₹${total.toFixed(2)}`}
              disabled
              className="mt-1 block w-full border border-navy-300 rounded-lg shadow-sm-premium p-2 bg-navy-100 font-semibold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full border border-navy-300 rounded-lg shadow-sm-premium p-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={creatingOrder}
              className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingOrder}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 shadow-sm-premium transition-colors"
            >
              {creatingOrder ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
