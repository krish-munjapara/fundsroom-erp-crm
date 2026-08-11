import { useState, useEffect } from 'react';
import { productService } from '../services';
import type { Product, CreateProductData, UpdateProductData } from '../services';
import { formatCurrency } from '../utils/formatters';
import { KPICard, StatusBadge, EmptyState, StockStatusBadge } from '../components/ui';
import { usePermissions, useSearch, useToast } from '../context';
import ProductModal, { type ProductSaveResult } from '../components/products/ProductModal';
import { mapProductApiError } from '../utils/productFormValidation';
import {
  mapStockAdjustmentApiError,
  parsePositiveQuantityInput,
  validateStockAdjustment,
  type StockAdjustmentErrors,
} from '../utils/stockAdjustmentValidation';

export default function Products() {
  const permissions = usePermissions();
  const { consumePendingSearch } = useSearch();
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const term = consumePendingSearch('products');
    if (term) setSearchTerm(term);
  }, [consumePendingSearch]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts();
      if (response.success && response.data) {
        const normalizedProducts = response.data.map((product) => ({
          ...product,
          unit_price: Number(product.unit_price || 0),
          current_stock: Number(product.current_stock || 0),
          minimum_stock: Number(product.minimum_stock || 0),
        }));
        setProducts(normalizedProducts);
      } else {
        setError(response.message || 'Failed to load products');
      }
    } catch (err) {
      setError('An error occurred while loading products');
    } finally {
      setLoading(false);
    }
  };


  const handleCreate = async (data: CreateProductData): Promise<ProductSaveResult> => {
    try {
      const response = await productService.createProduct(data);
      if (response.success) {
        setShowModal(false);
        showToast('Product created successfully', 'success');
        loadProducts();
        return { success: true };
      }
      const mapped = mapProductApiError(response.message);
      return { success: false, message: mapped.message, field: mapped.field };
    } catch {
      return {
        success: false,
        message: 'Unable to save the product. Please check the entered details and try again.',
      };
    }
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
    setActionMenuOpen(null);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(false);
    setShowEditModal(true);
    setActionMenuOpen(null);
  };

  const handleUpdateProduct = async (data: UpdateProductData) => {
    if (!selectedProduct) return;
    try {
      const response = await productService.updateProduct(selectedProduct.id, data);
      if (response.success) {
        setShowEditModal(false);
        showToast('Product updated successfully', 'success');
        loadProducts();
      } else {
        setError(response.message || 'Failed to update product');
      }
    } catch (err) {
      setError('An error occurred while updating product');
    }
  };

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setShowStockAdjustModal(true);
    setActionMenuOpen(null);
  };

  const handleStockAdjust = async (data: { quantity: number; movement_type: 'in' | 'out'; notes: string }) => {
    if (!selectedProduct) {
      return { success: false as const, message: 'No product selected.' };
    }
    try {
      const response = await productService.adjustStock(selectedProduct.id, data);
      if (response.success) {
        setShowStockAdjustModal(false);
        showToast(
          data.movement_type === 'in' ? 'Stock added successfully' : 'Stock removed successfully',
          'success'
        );
        loadProducts();
        return { success: true as const };
      }
      const message = mapStockAdjustmentApiError(response.message);
      return {
        success: false as const,
        message,
        field: message.toLowerCase().includes('insufficient') || message.toLowerCase().includes('available')
          ? ('quantity' as const)
          : undefined,
      };
    } catch {
      return {
        success: false as const,
        message: 'Unable to save the stock movement. Please try again.',
      };
    }
  };

  const handleDuplicateProduct = async (product: Product) => {
    try {
      const duplicateData: CreateProductData = {
        sku: `${product.sku}-COPY`,
        name: `${product.name} (Copy)`,
        description: product.description,
        category: product.category,
        unit_price: product.unit_price,
        current_stock: 0,
        minimum_stock: product.minimum_stock,
        location: product.location,
        warehouse: product.warehouse,
      };
      const response = await productService.createProduct(duplicateData);
      if (response.success) {
        loadProducts();
      } else {
        setError(response.message || 'Failed to duplicate product');
      }
    } catch (err) {
      setError('An error occurred while duplicating product');
    }
    setActionMenuOpen(null);
  };

  const handleDeactivateProduct = async (product: Product) => {
    try {
      const response = await productService.updateProduct(product.id, { is_active: !product.is_active });
      if (response.success) {
        loadProducts();
      } else {
        setError(response.message || 'Failed to update product status');
      }
    } catch (err) {
      setError('An error occurred while updating product status');
    }
    setActionMenuOpen(null);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await productService.deleteProduct(productId);
      if (response.success) {
        loadProducts();
      } else {
        setError(response.message || 'Failed to delete product');
      }
    } catch (err) {
      setError('An error occurred while deleting product');
    }
    setActionMenuOpen(null);
  };

  // Calculate statistics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const inactiveProducts = products.filter(p => !p.is_active).length;
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const totalCategories = categories.length;

  // Get unique categories for filter
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Get inventory status for a product
  const getInventoryStatus = (product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' => {
    if (product.current_stock === 0) return 'out_of_stock';
    if (product.current_stock <= product.minimum_stock) return 'low_stock';
    return 'in_stock';
  };


  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && product.is_active) ||
      (statusFilter === 'inactive' && !product.is_active);
    
    const inventoryStatus = getInventoryStatus(product);
    const matchesInventoryStatus = 
      inventoryStatusFilter === 'all' || 
      inventoryStatus === inventoryStatusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesInventoryStatus;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'sku') {
      comparison = a.sku.localeCompare(b.sku);
    } else if (sortField === 'category') {
      comparison = a.category.localeCompare(b.category);
    } else if (sortField === 'unit_price') {
      comparison = a.unit_price - b.unit_price;
    } else if (sortField === 'stock') {
      comparison = a.current_stock - b.current_stock;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) return <ProductsSkeleton />;
  if (error) return (
    <div className="p-6">
      <div className="bg-danger-50 border border-danger-200 rounded-lg p-6 text-center">
        <p className="text-danger-700 mb-4">{error}</p>
        <button
          onClick={loadProducts}
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
            <ProductsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Products</h1>
            <p className="text-sm text-navy-500 mt-1">Manage your product catalog</p>
          </div>
        </div>
        {permissions.canManageProducts && (
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Products"
          value={totalProducts}
          subtitle="In catalog"
          icon={<ProductsIcon className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Active Products"
          value={activeProducts}
          subtitle="Available for sale"
          icon={<CheckIcon className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Inactive Products"
          value={inactiveProducts}
          subtitle="Not available"
          icon={<InactiveIcon className="w-6 h-6" />}
          color="amber"
        />
        <KPICard
          title="Categories"
          value={totalCategories}
          subtitle="Product categories"
          icon={<CategoryIcon className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by SKU, name, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm text-sm"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={inventoryStatusFilter}
              onChange={(e) => setInventoryStatusFilter(e.target.value as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock')}
              className="px-3 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all focus:shadow-sm text-sm"
            >
              <option value="all">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || inventoryStatusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setInventoryStatusFilter('all');
                }}
                className="px-3 py-2.5 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-all text-sm whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-navy-200 shadow-premium">
        <div className="table-wrapper">
          <table className="min-w-[900px] w-full divide-y divide-navy-100 lg:min-w-full">
            <thead className="bg-navy-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider cursor-pointer hover:bg-navy-100 transition-colors"
                  onClick={() => handleSort('sku')}
                >
                  SKU {sortField === 'sku' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider cursor-pointer hover:bg-navy-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  Product Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider cursor-pointer hover:bg-navy-100 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider cursor-pointer hover:bg-navy-100 transition-colors"
                  onClick={() => handleSort('unit_price')}
                >
                  Unit Price {sortField === 'unit_price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-navy-600 uppercase tracking-wider cursor-pointer hover:bg-navy-100 transition-colors"
                  onClick={() => handleSort('stock')}
                >
                  Current Stock {sortField === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-navy-600 uppercase tracking-wider">Min Stock</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-navy-600 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-navy-600 uppercase tracking-wider">Inventory Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-navy-600 uppercase tracking-wider">Product Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-navy-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-navy-100">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-navy-50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono text-navy-600 bg-navy-100 px-2 py-1 rounded">{product.sku}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-navy-900">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-navy-500 mt-1 truncate max-w-xs">{product.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-navy-700">{product.category || '-'}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-navy-900">{formatCurrency(product.unit_price)}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-semibold text-navy-900">{product.current_stock}</span>
                      <StockStatusBadge currentStock={product.current_stock} minimumStock={product.minimum_stock} />
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="text-sm text-navy-700">{product.minimum_stock}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-navy-700">
                      {product.location !== product.warehouse && product.warehouse ? (
                        <>
                          <div>{product.location}</div>
                          <div className="text-xs text-navy-500">{product.warehouse}</div>
                        </>
                      ) : (
                        <div>{product.location}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    {(() => {
                      const status = getInventoryStatus(product);
                      if (status === 'out_of_stock') {
                        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-danger-100 text-danger-700">Out of Stock</span>;
                      } else if (status === 'low_stock') {
                        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-700">Low Stock</span>;
                      }
                      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-700">In Stock</span>;
                    })()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === product.id ? null : product.id)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        Actions
                        <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {actionMenuOpen === product.id && (
                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-navy-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleViewDetails(product)}
                              className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                            >
                              View Details
                            </button>
                            {permissions.canManageProducts && (
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                            >
                              Edit Product
                            </button>
                            )}
                            {permissions.canManageInventory && (
                            <button
                              onClick={() => handleAdjustStock(product)}
                              className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                            >
                              Adjust Stock
                            </button>
                            )}
                            {permissions.canManageProducts && (
                            <>
                            <button
                              onClick={() => handleDuplicateProduct(product)}
                              className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition-colors"
                            >
                              Duplicate
                            </button>
                            <button
                              onClick={() => handleDeactivateProduct(product)}
                              className={`w-full text-left px-4 py-2 text-sm ${product.is_active ? 'text-warning-600 hover:bg-warning-50' : 'text-success-600 hover:bg-success-50'} transition-colors`}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            </>
                            )}
                            {permissions.canDeleteProducts && (
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
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
        {paginatedProducts.length === 0 && (
          <EmptyState
            icon={<ProductsIcon />}
            title="No products found"
            description={sortedProducts.length === 0
              ? 'No products found'
              : searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || inventoryStatusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first product'}
            action={sortedProducts.length === 0 && !searchTerm && categoryFilter === 'all' && statusFilter === 'all' && inventoryStatusFilter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add Product
              </button>
            )}
          />
        )}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-navy-200 flex items-center justify-between">
            <p className="text-sm text-navy-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedProducts.length)} of {sortedProducts.length} products
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-navy-300 rounded hover:bg-navy-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-navy-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-navy-300 rounded hover:bg-navy-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal onClose={() => setShowModal(false)} onSave={handleCreate} />
      )}
      {showEditModal && selectedProduct && (
        <EditProductModal 
          product={selectedProduct}
          onClose={() => setShowEditModal(false)} 
          onSave={handleUpdateProduct} 
        />
      )}
      {showDetailsModal && selectedProduct && (
        <ProductDetailsModal 
          product={selectedProduct} 
          onClose={() => setShowDetailsModal(false)} 
          onEdit={handleEditProduct}
        />
      )}
      {showStockAdjustModal && selectedProduct && (
        <StockAdjustModal 
          product={selectedProduct}
          onClose={() => setShowStockAdjustModal(false)}
          onAdjust={handleStockAdjust}
        />
      )}
    </div>
  );
}

// Icon Components
function ProductsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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

function CategoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function InactiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ProductsSkeleton() {
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

function ProductDetailsModal({ product, onClose, onEdit }: { product: Product; onClose: () => void; onEdit: (product: Product) => void }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getInventoryStatus = () => {
    if (product.current_stock === 0) return 'out_of_stock';
    if (product.current_stock <= product.minimum_stock) return 'low_stock';
    return 'in_stock';
  };

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-navy-900">{product.name}</h2>
              <p className="text-sm text-navy-500 mt-1">SKU: {product.sku}</p>
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
          {/* Product Information */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-4">Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Category</p>
                <p className="text-sm font-medium text-navy-900">{product.category || '-'}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Location</p>
                <p className="text-sm font-medium text-navy-900">{product.location}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Warehouse</p>
                <p className="text-sm font-medium text-navy-900">{product.warehouse || '-'}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Status</p>
                <StatusBadge status={product.is_active ? 'active' : 'inactive'} />
              </div>
            </div>
            {product.description && (
              <div className="mt-4 bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Description</p>
                <p className="text-sm text-navy-900">{product.description}</p>
              </div>
            )}
            <div className="mt-4 bg-navy-50 rounded-lg p-4">
              <p className="text-xs text-navy-500 mb-1">Created Date</p>
              <p className="text-sm font-medium text-navy-900">{formatDate(product.created_at)}</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Unit Price</p>
                <p className="text-lg font-semibold text-navy-900">{formatCurrency(product.unit_price)}</p>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-4">Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Current Stock</p>
                <p className="text-2xl font-bold text-navy-900">{product.current_stock}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Minimum Stock Level</p>
                <p className="text-2xl font-bold text-navy-900">{product.minimum_stock}</p>
              </div>
              <div className="bg-navy-50 rounded-lg p-4">
                <p className="text-xs text-navy-500 mb-1">Inventory Status</p>
                <div className="mt-1">
                  {(() => {
                    const status = getInventoryStatus();
                    if (status === 'out_of_stock') {
                      return <span className="px-2 py-1 text-sm font-medium rounded-full bg-danger-100 text-danger-700">Out of Stock</span>;
                    } else if (status === 'low_stock') {
                      return <span className="px-2 py-1 text-sm font-medium rounded-full bg-warning-100 text-warning-700">Low Stock</span>;
                    }
                    return <span className="px-2 py-1 text-sm font-medium rounded-full bg-success-100 text-success-700">In Stock</span>;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-navy-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(product)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors"
          >
            Edit Product
          </button>
        </div>
      </div>
    </div>
  );
}

function StockAdjustModal({
  product,
  onClose,
  onAdjust,
}: {
  product: Product;
  onClose: () => void;
  onAdjust: (data: { quantity: number; movement_type: 'in' | 'out'; notes: string }) => Promise<
    { success: true } | { success: false; message: string; field?: 'quantity' | 'notes' | 'submit' }
  >;
}) {
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [movementType, setMovementType] = useState<'in' | 'out'>('in');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<StockAdjustmentErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const currentStock = Number(product.current_stock ?? 0);
  const numericQuantity = quantity === '' ? 0 : quantity;
  const newStock = movementType === 'in' ? currentStock + numericQuantity : currentStock - numericQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateStockAdjustment({
      quantity: numericQuantity,
      movement_type: movementType,
      notes,
      availableStock: movementType === 'out' ? currentStock : undefined,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await onAdjust({
        quantity: numericQuantity,
        movement_type: movementType,
        notes: notes.trim(),
      });

      if (!result.success) {
        if (result.field) {
          setErrors({ [result.field]: result.message });
        } else {
          setErrors({ submit: result.message });
        }
      }
    } catch {
      setErrors({ submit: 'Unable to save the stock movement. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
      hasError ? 'border-danger-300' : 'border-navy-300'
    }`;

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg-premium border border-navy-200">
        <div className="p-6 border-b border-navy-200">
          <h2 className="text-xl font-semibold text-navy-900">Adjust Stock</h2>
          <p className="text-sm text-navy-500 mt-1">{product.name} ({product.sku})</p>
        </div>
        <div className="p-6">
          <form id="product-stock-adjust-form" onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
                {errors.submit}
              </div>
            )}
            <div className="bg-navy-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-navy-500 mb-1">Current Stock</p>
              <p className="text-2xl font-bold text-navy-900">{currentStock}</p>
            </div>
            <div className="bg-navy-100 rounded-lg p-4 mb-4">
              <p className="text-xs text-navy-600 mb-1">New Stock Preview</p>
              <p className={`text-2xl font-bold ${newStock < 0 ? 'text-danger-600' : 'text-navy-900'}`}>
                {newStock < 0 ? 'Insufficient' : newStock}
              </p>
            </div>
            <div>
              <label htmlFor="product-adjust-movement-type" className="block text-sm font-medium text-navy-700 mb-1">
                Adjustment Type
              </label>
              <select
                id="product-adjust-movement-type"
                name="movement_type"
                value={movementType}
                onChange={(e) => {
                  setMovementType(e.target.value as 'in' | 'out');
                  setErrors((prev) => {
                    if (!prev.quantity) return prev;
                    const next = { ...prev };
                    delete next.quantity;
                    return next;
                  });
                }}
                className={inputClass(false)}
              >
                <option value="in">Stock In (Add)</option>
                <option value="out">Stock Out (Remove)</option>
              </select>
            </div>
            <div>
              <label htmlFor="product-adjust-quantity" className="block text-sm font-medium text-navy-700 mb-1">
                Quantity
              </label>
              <input
                id="product-adjust-quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => {
                  setQuantity(parsePositiveQuantityInput(e.target.value));
                  setErrors((prev) => {
                    if (!prev.quantity) return prev;
                    const next = { ...prev };
                    delete next.quantity;
                    return next;
                  });
                }}
                className={inputClass(!!errors.quantity)}
                placeholder="Enter quantity"
              />
              {errors.quantity && <p className="text-danger-600 text-xs mt-1">{errors.quantity}</p>}
              {movementType === 'out' && (
                <p className="text-xs text-navy-500 mt-1">Available stock: {currentStock} units</p>
              )}
            </div>
            <div>
              <label htmlFor="product-adjust-notes" className="block text-sm font-medium text-navy-700 mb-1">
                Reason / Notes
              </label>
              <textarea
                id="product-adjust-notes"
                name="notes"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setErrors((prev) => {
                    if (!prev.notes) return prev;
                    const next = { ...prev };
                    delete next.notes;
                    return next;
                  });
                }}
                rows={3}
                className={inputClass(!!errors.notes)}
                placeholder="e.g., New purchase, Damaged goods, Correction..."
              />
              {errors.notes && <p className="text-danger-600 text-xs mt-1">{errors.notes}</p>}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
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
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-w-[120px]"
              >
                {isSubmitting ? 'Saving...' : 'Adjust Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function EditProductModal({ product, onClose, onSave }: { product: Product; onClose: () => void; onSave: (data: UpdateProductData) => void }) {
  const [formData, setFormData] = useState<UpdateProductData>({
    sku: product.sku,
    name: product.name,
    description: product.description || '',
    category: product.category,
    unit_price: product.unit_price,
    minimum_stock: product.minimum_stock,
    location: product.location,
    warehouse: product.warehouse || '',
    is_active: product.is_active,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku?.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.category?.trim()) {
      newErrors.category = 'Category is required';
    }
    if (formData.unit_price !== undefined && formData.unit_price < 0) {
      newErrors.unit_price = 'Unit price cannot be negative';
    }
    if (formData.minimum_stock !== undefined && formData.minimum_stock < 0) {
      newErrors.minimum_stock = 'Minimum stock cannot be negative';
    }
    if (!formData.location?.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const cleanedData: UpdateProductData = {
      sku: formData.sku?.trim(),
      name: formData.name?.trim(),
      description: (formData.description || '').trim() || undefined,
      category: formData.category?.trim(),
      unit_price: formData.unit_price !== undefined ? Number(formData.unit_price) : undefined,
      minimum_stock: formData.minimum_stock !== undefined ? Number(formData.minimum_stock) : undefined,
      location: formData.location?.trim(),
      warehouse: (formData.warehouse || '').trim() || undefined,
      is_active: formData.is_active,
    };
    onSave(cleanedData);
  };

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-lg-premium border border-navy-200 flex flex-col">
        <div className="p-6 border-b border-navy-200">
          <h2 className="text-xl font-semibold text-navy-900">Edit Product</h2>
          <p className="text-sm text-navy-500 mt-1">Update product details below</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  {errors.sku && <p className="text-danger-600 text-xs mt-1">{errors.sku}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  {errors.name && <p className="text-danger-600 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  {errors.category && <p className="text-danger-600 text-xs mt-1">{errors.category}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-navy-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Unit Price *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  {errors.unit_price && <p className="text-danger-600 text-xs mt-1">{errors.unit_price}</p>}
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div>
              <h3 className="text-sm font-medium text-navy-500 uppercase tracking-wider mb-3">Inventory Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Minimum Stock Alert Quantity *</label>
                  <input
                    type="number"
                    required
                    step="1"
                    min="0"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
                    className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  {errors.minimum_stock && <p className="text-danger-600 text-xs mt-1">{errors.minimum_stock}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                  {errors.location && <p className="text-danger-600 text-xs mt-1">{errors.location}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Warehouse (Optional)</label>
                  <input
                    type="text"
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Status</label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full border border-navy-300 rounded-lg shadow-sm-premium p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 bg-navy-50 rounded-lg p-4">
                <p className="text-sm text-navy-600">
                  <strong>Note:</strong> Current stock cannot be edited directly. Use the "Adjust Stock" action to modify inventory levels.
                </p>
              </div>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-navy-200 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-navy-300 rounded-lg hover:bg-navy-50 transition-colors">Cancel</button>
          <button type="submit" form="edit-product-form" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm-premium transition-colors">Update Product</button>
        </div>
      </div>
    </div>
  );
}
