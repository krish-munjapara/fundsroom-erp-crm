import { useState, useEffect } from 'react';
import { inventoryService, productService } from '../services';
import type { StockMovement, Product } from '../services';
import { KPICard, EmptyState } from '../components/ui';
import { formatDate } from '../utils/formatters';
import { usePermissions, useSearch, useToast } from '../context';
import StockAdjustModal, { type StockAdjustmentSaveResult } from '../components/inventory/StockAdjustModal';
import { mapStockAdjustmentApiError } from '../utils/stockAdjustmentValidation';

export default function Inventory() {
  const permissions = usePermissions();
  const { consumePendingSearch } = useSearch();
  const { showToast } = useToast();
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  useEffect(() => {
    loadStockMovements();
    loadProducts();
  }, []);

  useEffect(() => {
    const term = consumePendingSearch('inventory');
    if (term) setSearchTerm(term);
  }, [consumePendingSearch]);

  const loadStockMovements = async () => {
    try {
      setLoading(true);
      const response = await inventoryService.getStockMovements(undefined, 100);
      if (response.success && response.data) {
        setStockMovements(response.data);
      } else {
        setError(response.message || 'Failed to load stock movements');
      }
    } catch (err) {
      setError('An error occurred while loading stock movements');
    } finally {
      setLoading(false);
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


  // Calculate statistics from products
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.current_stock, 0);
  const lowStockCount = products.filter(p => p.current_stock <= p.minimum_stock).length;
  const outOfStockCount = products.filter(p => p.current_stock === 0).length;

  // Filter stock movements
  const filteredMovements = stockMovements.filter(movement => {
    const matchesSearch = 
      (movement.product_name && movement.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (movement.sku && movement.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = movementTypeFilter === 'all' || movement.movement_type === movementTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleStockAdjust = async (data: {
    productId: number;
    quantity: number;
    movement_type: 'in' | 'out';
    notes: string;
  }): Promise<StockAdjustmentSaveResult> => {
    try {
      const response = await productService.adjustStock(data.productId, {
        quantity: data.quantity,
        movement_type: data.movement_type,
        notes: data.notes,
      });
      if (response.success) {
        setShowStockAdjustModal(false);
        showToast(
          data.movement_type === 'in' ? 'Stock added successfully' : 'Stock removed successfully',
          'success'
        );
        loadStockMovements();
        loadProducts();
        return { success: true };
      }

      const message = mapStockAdjustmentApiError(response.message);
      const field = message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('available')
        ? ('quantity' as const)
        : undefined;
      return { success: false, message, field };
    } catch {
      return {
        success: false,
        message: 'Unable to save the stock movement. Please try again.',
      };
    }
  };

  if (loading) return <InventorySkeleton />;
  if (error) return (
    <div className="p-6">
      <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
        <p className="text-danger-700 mb-4">{error}</p>
        <button
          onClick={loadStockMovements}
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
            <InventoryIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Stock Movements</h1>
            <p className="text-sm text-navy-500 mt-1">Track inventory adjustments and stock history</p>
          </div>
        </div>
        {permissions.canManageInventory && (
        <button
          onClick={() => setShowStockAdjustModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Stock Adjustment
        </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Products"
          value={totalProducts}
          subtitle="In catalog"
          icon={<BoxIcon className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Total Stock"
          value={totalStock}
          subtitle="Units across all products"
          icon={<LayersIcon className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Low Stock"
          value={lowStockCount}
          subtitle="Below minimum level"
          icon={<AlertTriangleIcon className="w-6 h-6" />}
          color="amber"
        />
        <KPICard
          title="Out of Stock"
          value={outOfStockCount}
          subtitle="Zero inventory"
          icon={<PackageXIcon className="w-6 h-6" />}
          color="red"
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
                placeholder="Search by product, SKU, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value as 'all' | 'in' | 'out')}
              className="px-4 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm"
            >
              <option value="all">All Movements</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
            {(searchTerm || movementTypeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setMovementTypeFilter('all');
                }}
                className="px-4 py-2.5 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-all"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Stock Movements Table */}
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium">
        <div className="table-wrapper">
          <table className="min-w-[1100px] w-full divide-y divide-navy-100">
            <thead className="bg-navy-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-navy-600 uppercase tracking-wider">Movement Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Created By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-navy-100">
              {filteredMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-navy-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-navy-900">{movement.product_name || `Product ${movement.product_id}`}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono text-navy-600 bg-navy-100 px-2 py-1 rounded">{movement.sku || '-'}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      movement.movement_type === 'in' 
                        ? 'bg-success-100 text-success-700' 
                        : 'bg-danger-100 text-danger-700'
                    }`}>
                      {movement.movement_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <span className={`text-sm font-semibold ${
                      movement.movement_type === 'in' ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-navy-700">{movement.notes || '-'}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-navy-700">User {movement.created_by || '-'}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-navy-700">{formatDate(movement.created_at)}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => {
                        setSelectedMovement(movement);
                        setShowDetailsModal(true);
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
        {filteredMovements.length === 0 && (
          <EmptyState
            icon={<InventoryIcon />}
            title="No stock movements found"
            description={searchTerm || movementTypeFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Stock movements will appear here when you adjust inventory'}
          />
        )}
      </div>

      {showStockAdjustModal && (
        <StockAdjustModal
          products={products}
          onClose={() => setShowStockAdjustModal(false)}
          onSave={handleStockAdjust}
        />
      )}

      {showDetailsModal && selectedMovement && (
        <MovementDetailsModal
          movement={selectedMovement}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  );
}

function MovementDetailsModal({ movement, onClose }: { movement: StockMovement; onClose: () => void }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200">
          <h2 className="text-xl font-semibold text-navy-900">Movement Details</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div className="bg-navy-50 rounded-lg p-4">
              <p className="text-xs text-navy-500 mb-1">Product</p>
              <p className="text-sm font-medium text-navy-900">{movement.product_name || `Product ${movement.product_id}`}</p>
            </div>
            <div className="bg-navy-50 rounded-lg p-4">
              <p className="text-xs text-navy-500 mb-1">SKU</p>
              <p className="text-sm font-medium text-navy-900">{movement.sku || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Movement Type</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  movement.movement_type === 'in' 
                    ? 'bg-success-100 text-success-700' 
                    : 'bg-danger-100 text-danger-700'
                }`}>
                  {movement.movement_type.toUpperCase()}
                </span>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Quantity</p>
                <p className={`text-sm font-semibold ${
                  movement.movement_type === 'in' ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {movement.movement_type === 'in' ? '+' : '-'}{movement.quantity}
                </p>
              </div>
            </div>
            <div className="bg-navy-50 rounded-lg p-4">
              <p className="text-xs text-navy-500 mb-1">Reason</p>
              <p className="text-sm text-navy-900">{movement.notes || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Created By</p>
                <p className="text-sm text-navy-900">User {movement.created_by || '-'}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Date</p>
                <p className="text-sm text-navy-900">{formatDate(movement.created_at)}</p>
              </div>
            </div>
            <div className="bg-navy-50 rounded-lg p-4">
              <p className="text-xs text-navy-500 mb-1">Time</p>
              <p className="text-sm text-navy-900">{formatTime(movement.created_at)}</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-navy-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

// Icon Components
function InventoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
    </svg>
  );
}

function PackageXIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4M9 5h6M9 12h6M9 19h6" />
    </svg>
  );
}

function InventorySkeleton() {
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

