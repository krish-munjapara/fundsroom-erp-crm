import { useState, useEffect } from 'react';
import { orderService, customerService, productService, inventoryService } from '../services';
import type { Order, Customer, Product, Inventory } from '../services';
import { formatCurrency, safeNumber } from '../utils/formatters';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    loadOrders();
    loadCustomers();
    loadProducts();
    loadInventory();
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

  const loadInventory = async () => {
    try {
      const response = await inventoryService.getAllInventory();
      if (response.success && response.data) {
        setInventory(response.data);
      }
    } catch (err) {
      console.error('Failed to load inventory');
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
        loadInventory();
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-6">Loading orders...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Order
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customer_name || `Customer ${order.customer_id}`}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(order.order_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(order.total_amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <div className="text-center py-8 text-gray-500">No orders found</div>}
      </div>

      {showModal && (
        <OrderModal
          key="order-modal"
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
          customers={customers}
          products={products}
          inventory={inventory}
          creatingOrder={creatingOrder}
        />
      )}
    </div>
  );
}

function OrderModal({
  onClose,
  onSave,
  customers,
  products,
  inventory,
  creatingOrder,
}: {
  onClose: () => void;
  onSave: (data: any) => void;
  customers: Customer[];
  products: Product[];
  inventory: Inventory[];
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
  const inventoryRecord = inventory.find((i) => i.product_id === formData.product_id);
  const availableQuantity = inventoryRecord?.available_quantity || 0;
  const unitPrice = selectedProduct ? Number(selectedProduct.selling_price) : 0;
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

    if (!inventoryRecord) {
      setValidationError('No inventory record found for this product. Please create inventory first.');
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
          tax_rate: selectedProduct?.tax_rate || 0,
        },
      ],
      notes: formData.notes || undefined,
    };

    onSave(orderData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Order</h2>
        {validationError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {validationError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
            <label className="block text-sm font-medium text-gray-700">Product</label>
            <select
              required
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              required
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
            {formData.product_id > 0 && !inventoryRecord && (
              <p className="mt-1 text-sm text-red-600">
                No inventory available for this product.
              </p>
            )}
            {formData.product_id > 0 && inventoryRecord && (
              <p className="mt-1 text-sm text-gray-600">
                Available: {availableQuantity} units
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit Price</label>
            <input
              type="text"
              value={`₹${unitPrice.toFixed(2)}`}
              disabled
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total</label>
            <input
              type="text"
              value={`₹${total.toFixed(2)}`}
              disabled
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 font-semibold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={creatingOrder}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingOrder}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {creatingOrder ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
