import { COMPANY, getGeneratedTimestamp } from '../../documents/branding';
import { formatCurrency, formatDate, formatDateTime, formatMovementQuantity, displayOrDash } from '../../documents/helpers';
import type { SalesReportExportData } from '../../documents/reportDocument';
import type { Challan, Customer, Order } from '../../services';
import type { Product, StockMovement } from '../../services';
import { getStockStatus } from '../../documents/helpers';

export function PrintDocumentHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <>
      <div className="doc-header">
        <div>
          <div className="doc-brand-name">{COMPANY.name}</div>
          <div className="doc-brand-tagline">{COMPANY.tagline}</div>
        </div>
        <div className="doc-company-meta">
          <div>{COMPANY.address}</div>
          <div>{COMPANY.email}</div>
          <div>{COMPANY.phone}</div>
        </div>
      </div>
      <h1 className="doc-title">{title}</h1>
      {subtitle ? <p className="doc-subtitle">{subtitle}</p> : null}
    </>
  );
}

export function SalesReportPrintView({
  data,
  reportType,
  dateRangeLabel,
}: {
  data: SalesReportExportData;
  reportType: string;
  dateRangeLabel: string;
}) {
  const byDate = data.sales_trend?.length
    ? data.sales_trend
    : (data.revenue_by_month || []).map((item) => ({
        date: item.month,
        revenue: item.revenue,
        orders: 0,
      }));

  const statusEntries = Object.entries(data.orders_by_status || {});

  return (
    <>
      <PrintDocumentHeader
        title="Sales Report"
        subtitle={`${reportType} · ${dateRangeLabel} · Generated ${getGeneratedTimestamp()}`}
      />
      <div className="doc-meta-grid">
        <div className="doc-meta-box">
          <div className="doc-meta-label">Total Orders</div>
          <div className="doc-meta-value">{data.total_orders}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Confirmed Revenue</div>
          <div className="doc-meta-value">{formatCurrency(data.total_revenue)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Avg Confirmed Order</div>
          <div className="doc-meta-value">{formatCurrency(data.average_order_value)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Pending Orders</div>
          <div className="doc-meta-value">{data.pending_orders ?? 0}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Pending Order Value</div>
          <div className="doc-meta-value">{formatCurrency(data.pending_order_value ?? 0)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Confirmed Orders</div>
          <div className="doc-meta-value">{data.confirmed_orders ?? 0}</div>
        </div>
      </div>

      <div className="doc-section-title">Orders by Status</div>
      {statusEntries.length ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Status</th>
              <th className="doc-text-right">Count</th>
            </tr>
          </thead>
          <tbody>
            {statusEntries.map(([status, count]) => (
              <tr key={status}>
                <td>{status}</td>
                <td className="doc-text-right">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty">No orders for this period.</div>
      )}

      <div className="doc-section-title">Sales by Date</div>
      {byDate.length ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Date</th>
              <th className="doc-text-right">Revenue</th>
              <th className="doc-text-right">Orders</th>
            </tr>
          </thead>
          <tbody>
            {byDate.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td className="doc-text-right">{formatCurrency(row.revenue)}</td>
                <td className="doc-text-right">{row.orders ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty">No sales trend data for this period.</div>
      )}

      <div className="doc-section-title">Sales by Customer</div>
      {data.sales_by_customer?.length ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th className="doc-text-right">Orders</th>
              <th className="doc-text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.sales_by_customer.map((row) => (
              <tr key={row.company_name}>
                <td>{row.company_name}</td>
                <td className="doc-text-right">{row.total_orders}</td>
                <td className="doc-text-right">{formatCurrency(row.total_revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty">No customer sales for this period.</div>
      )}

      <div className="doc-section-title">Sales by Product</div>
      {data.sales_by_product?.length ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th className="doc-text-right">Qty</th>
              <th className="doc-text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.sales_by_product.map((row) => (
              <tr key={`${row.product_name}-${row.sku}`}>
                <td>{row.product_name}</td>
                <td>{row.sku}</td>
                <td className="doc-text-right">{row.total_quantity}</td>
                <td className="doc-text-right">{formatCurrency(row.total_revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty">No product sales for this period.</div>
      )}

      <div className="doc-footer">
        <span>{COMPANY.name} Sales Report</span>
        <span>{dateRangeLabel}</span>
      </div>
    </>
  );
}

export function ChallanPrintView({ challan }: { challan: Challan }) {
  return (
    <>
      <PrintDocumentHeader
        title="Sales Challan"
        subtitle={`${challan.challan_number} · ${formatDate(challan.created_at)} · Generated ${getGeneratedTimestamp()}`}
      />
      <div className="doc-meta-grid">
        <div className="doc-meta-box">
          <div className="doc-meta-label">Challan Number</div>
          <div className="doc-meta-value">{challan.challan_number}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Date</div>
          <div className="doc-meta-value">{formatDate(challan.created_at)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Status</div>
          <div className="doc-meta-value">{challan.status}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Customer</div>
          <div className="doc-meta-value">{challan.customer_name || `Customer #${challan.customer_id}`}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Email</div>
          <div className="doc-meta-value">{displayOrDash(challan.customer_email)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Phone</div>
          <div className="doc-meta-value">{displayOrDash(challan.customer_phone)}</div>
        </div>
      </div>
      {challan.customer_address ? (
        <div className="doc-meta-box" style={{ marginBottom: 16 }}>
          <div className="doc-meta-label">Address</div>
          <div className="doc-meta-value">{challan.customer_address}</div>
        </div>
      ) : null}

      <div className="doc-section-title">Products</div>
      {challan.items?.length ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th className="doc-text-right">Qty</th>
              <th className="doc-text-right">Unit Price</th>
              <th className="doc-text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {challan.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td>{item.sku}</td>
                <td className="doc-text-right">{item.quantity}</td>
                <td className="doc-text-right">{formatCurrency(item.unit_price)}</td>
                <td className="doc-text-right">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty">No products on this challan.</div>
      )}

      <div className="doc-summary">
        <div className="doc-summary-row">
          <span>Total Items</span>
          <span>{challan.total_items}</span>
        </div>
        <div className="doc-summary-row">
          <span>Total Quantity</span>
          <span>{challan.total_quantity}</span>
        </div>
        <div className="doc-summary-row doc-summary-total">
          <span>Grand Total</span>
          <span>{formatCurrency(challan.total_amount)}</span>
        </div>
      </div>

      {challan.notes ? (
        <>
          <div className="doc-section-title">Notes</div>
          <div className="doc-notes">{challan.notes}</div>
        </>
      ) : null}

      <div className="doc-signature">
        <div>
          <div className="doc-signature-line">Prepared By</div>
        </div>
        <div>
          <div className="doc-signature-line">Authorized Signature</div>
        </div>
      </div>
    </>
  );
}

export function OrderPrintView({ order }: { order: Order }) {
  const subtotal = Number(order.subtotal ?? 0);
  const discount = Number(order.discount_amount ?? 0);
  const tax = Number(order.tax_amount ?? 0);
  const total = Number(order.total_amount ?? 0);

  return (
    <>
      <PrintDocumentHeader
        title="Order Document"
        subtitle={`${order.order_number} · ${formatDate(order.order_date)} · Status: ${order.status}`}
      />
      <div className="doc-meta-grid">
        <div className="doc-meta-box">
          <div className="doc-meta-label">Customer</div>
          <div className="doc-meta-value">{displayOrDash(order.customer_name)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Contact</div>
          <div className="doc-meta-value">{displayOrDash(order.customer_contact)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Phone</div>
          <div className="doc-meta-value">{displayOrDash(order.customer_phone)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Email</div>
          <div className="doc-meta-value">{displayOrDash(order.customer_email)}</div>
        </div>
      </div>

      <div className="doc-section-title">Products</div>
      {order.items?.length ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th className="doc-text-right">Qty</th>
              <th className="doc-text-right">Unit Price</th>
              <th className="doc-text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td>{item.product_sku || item.sku}</td>
                <td className="doc-text-right">{item.quantity}</td>
                <td className="doc-text-right">{formatCurrency(item.unit_price)}</td>
                <td className="doc-text-right">
                  {formatCurrency(item.line_total ?? item.total_amount ?? item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty">No order items.</div>
      )}

      <div className="doc-summary">
        <div className="doc-summary-row">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="doc-summary-row">
          <span>Discount</span>
          <span>{formatCurrency(discount)}</span>
        </div>
        <div className="doc-summary-row">
          <span>Tax</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="doc-summary-row doc-summary-total">
          <span>Grand Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {order.notes ? (
        <>
          <div className="doc-section-title">Notes</div>
          <div className="doc-notes">{order.notes}</div>
        </>
      ) : null}
    </>
  );
}

export function GenericReportPrintView({
  title,
  reportTypeLabel,
  dateRangeLabel,
  summaryItems,
  sections,
}: {
  title: string;
  reportTypeLabel: string;
  dateRangeLabel: string;
  summaryItems: Array<{ label: string; value: string | number }>;
  sections: Array<{
    heading: string;
    columns: string[];
    rows: Array<(string | number)[]>;
  }>;
}) {
  return (
    <>
      <PrintDocumentHeader
        title={title}
        subtitle={`${reportTypeLabel} · ${dateRangeLabel} · Generated ${getGeneratedTimestamp()}`}
      />
      <div className="doc-meta-grid">
        {summaryItems.map((item) => (
          <div key={item.label} className="doc-meta-box">
            <div className="doc-meta-label">{item.label}</div>
            <div className="doc-meta-value">{item.value}</div>
          </div>
        ))}
      </div>
      {sections.map((section) => (
        <div key={section.heading}>
          <div className="doc-section-title">{section.heading}</div>
          {section.rows.length ? (
            <table className="doc-table">
              <thead>
                <tr>
                  {section.columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={
                          cellIndex > 0 && typeof cell === 'number' ? 'doc-text-right' : undefined
                        }
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="doc-empty">No data available.</div>
          )}
        </div>
      ))}
    </>
  );
}

export function StockReportPrintView({ products }: { products: Product[] }) {
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.current_stock, 0);
  const lowStockCount = products.filter((p) => p.current_stock <= p.minimum_stock).length;
  const outOfStockCount = products.filter((p) => p.current_stock === 0).length;

  return (
    <>
      <PrintDocumentHeader
        title="Stock Report"
        subtitle={`Generated ${getGeneratedTimestamp()} · ${totalProducts} products`}
      />
      <div className="doc-meta-grid">
        <div className="doc-meta-box">
          <div className="doc-meta-label">Total Products</div>
          <div className="doc-meta-value">{totalProducts}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Total Stock</div>
          <div className="doc-meta-value">{totalStock}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Low Stock</div>
          <div className="doc-meta-value">{lowStockCount}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Out of Stock</div>
          <div className="doc-meta-value">{outOfStockCount}</div>
        </div>
      </div>

      <div className="doc-section-title">Product Stock</div>
      {products.length ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th className="doc-text-right">Current Stock</th>
              <th className="doc-text-right">Min Level</th>
              <th>Status</th>
              <th>Location</th>
              <th>Warehouse</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.category}</td>
                <td className="doc-text-right">{product.current_stock}</td>
                <td className="doc-text-right">{product.minimum_stock}</td>
                <td>{getStockStatus(product.current_stock, product.minimum_stock)}</td>
                <td>{displayOrDash(product.location)}</td>
                <td>{displayOrDash(product.warehouse)}</td>
                <td>{formatDate(product.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty">No stock data available.</div>
      )}

      <div className="doc-footer">
        <span>{COMPANY.name} Stock Report</span>
        <span>{getGeneratedTimestamp()}</span>
      </div>
    </>
  );
}

export function MovementHistoryPrintView({
  movements,
  filterLabel,
}: {
  movements: StockMovement[];
  filterLabel: string;
}) {
  return (
    <>
      <PrintDocumentHeader
        title="Stock Movement Report"
        subtitle={`${filterLabel} · Generated ${getGeneratedTimestamp()} · ${movements.length} records`}
      />

      <div className="doc-section-title">Movement History</div>
      {movements.length ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Type</th>
              <th className="doc-text-right">Quantity</th>
              <th>Reason</th>
              <th>Created By</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td>{movement.product_name || `Product ${movement.product_id}`}</td>
                <td>{displayOrDash(movement.sku)}</td>
                <td>{movement.movement_type.toUpperCase()}</td>
                <td className="doc-text-right">
                  {formatMovementQuantity(movement.movement_type, movement.quantity)}
                </td>
                <td>{displayOrDash(movement.notes)}</td>
                <td>{movement.created_by ? `User ${movement.created_by}` : '-'}</td>
                <td>{formatDateTime(movement.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty">No movement history available.</div>
      )}

      <div className="doc-footer">
        <span>{COMPANY.name} Stock Movement Report</span>
        <span>{filterLabel}</span>
      </div>
    </>
  );
}

export function StockMovementPrintView({
  movement,
  currentStock,
}: {
  movement: StockMovement;
  currentStock?: number;
}) {
  return (
    <>
      <PrintDocumentHeader
        title="Stock Movement"
        subtitle={`Generated ${getGeneratedTimestamp()}`}
      />
      <div className="doc-meta-grid">
        <div className="doc-meta-box">
          <div className="doc-meta-label">Product</div>
          <div className="doc-meta-value">{movement.product_name || `Product ${movement.product_id}`}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">SKU</div>
          <div className="doc-meta-value">{displayOrDash(movement.sku)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Movement Type</div>
          <div className="doc-meta-value">{movement.movement_type.toUpperCase()}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Quantity</div>
          <div className="doc-meta-value">
            {formatMovementQuantity(movement.movement_type, movement.quantity)}
          </div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Reason</div>
          <div className="doc-meta-value">{displayOrDash(movement.notes)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Created By</div>
          <div className="doc-meta-value">{movement.created_by ? `User ${movement.created_by}` : '-'}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Timestamp</div>
          <div className="doc-meta-value">{formatDateTime(movement.created_at)}</div>
        </div>
        {currentStock !== undefined ? (
          <div className="doc-meta-box">
            <div className="doc-meta-label">Current Stock</div>
            <div className="doc-meta-value">{currentStock}</div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function buildCustomerAddress(customer: Customer): string {
  return [customer.address, customer.city, customer.state, customer.postal_code, customer.country]
    .filter(Boolean)
    .join(', ');
}

export function CustomerPrintView({
  customer,
  orders,
}: {
  customer: Customer;
  orders: Order[];
}) {
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const lastOrder = orders.length
    ? orders.reduce((latest, order) =>
        new Date(order.order_date) > new Date(latest.order_date) ? order : latest
      )
    : null;

  return (
    <>
      <PrintDocumentHeader
        title="Customer Statement"
        subtitle={`Generated ${getGeneratedTimestamp()}`}
      />
      <div className="doc-meta-grid">
        <div className="doc-meta-box">
          <div className="doc-meta-label">Company</div>
          <div className="doc-meta-value">{customer.company_name}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Contact Person</div>
          <div className="doc-meta-value">{customer.contact_person}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Email</div>
          <div className="doc-meta-value">{customer.email}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Phone</div>
          <div className="doc-meta-value">{displayOrDash(customer.phone)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Tax ID</div>
          <div className="doc-meta-value">{displayOrDash(customer.tax_id)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Customer Type</div>
          <div className="doc-meta-value">{displayOrDash(customer.customer_type)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Status</div>
          <div className="doc-meta-value">{customer.is_active ? 'Active' : 'Inactive'}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Credit Limit</div>
          <div className="doc-meta-value">{formatCurrency(customer.credit_limit ?? 0)}</div>
        </div>
      </div>

      {buildCustomerAddress(customer) ? (
        <div className="doc-meta-box" style={{ marginBottom: 16 }}>
          <div className="doc-meta-label">Address</div>
          <div className="doc-meta-value">{buildCustomerAddress(customer)}</div>
        </div>
      ) : null}

      <div className="doc-meta-grid">
        <div className="doc-meta-box">
          <div className="doc-meta-label">Total Orders</div>
          <div className="doc-meta-value">{orders.length}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Total Spent</div>
          <div className="doc-meta-value">{formatCurrency(totalSpent)}</div>
        </div>
        <div className="doc-meta-box">
          <div className="doc-meta-label">Last Order</div>
          <div className="doc-meta-value">{lastOrder ? formatDate(lastOrder.order_date) : '-'}</div>
        </div>
      </div>

      <div className="doc-section-title">Order History</div>
      {orders.length ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Status</th>
              <th className="doc-text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.order_number}</td>
                <td>{formatDate(order.order_date)}</td>
                <td>{order.status}</td>
                <td className="doc-text-right">{formatCurrency(order.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty">No orders recorded for this customer.</div>
      )}
    </>
  );
}

export function ProductPriceListPrintView({ products }: { products: Product[] }) {
  return (
    <>
      <PrintDocumentHeader
        title="Product / Price List"
        subtitle={`${products.length} products · Generated ${getGeneratedTimestamp()}`}
      />

      {products.length ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Description</th>
              <th className="doc-text-right">Unit Price</th>
              <th className="doc-text-right">Stock</th>
              <th className="doc-text-right">Min</th>
              <th>Status</th>
              <th>Location</th>
              <th>Warehouse</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>{product.category}</td>
                <td>{displayOrDash(product.description)}</td>
                <td className="doc-text-right">{formatCurrency(product.unit_price)}</td>
                <td className="doc-text-right">{product.current_stock}</td>
                <td className="doc-text-right">{product.minimum_stock}</td>
                <td>{getStockStatus(product.current_stock, product.minimum_stock)}</td>
                <td>{displayOrDash(product.location)}</td>
                <td>{displayOrDash(product.warehouse)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="doc-empty">No products available.</div>
      )}

      <div className="doc-footer">
        <span>{COMPANY.name} Product Price List</span>
        <span>{getGeneratedTimestamp()}</span>
      </div>
    </>
  );
}
