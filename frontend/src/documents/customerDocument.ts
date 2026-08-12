import type { Customer, Order } from '../services';
import { formatDate, displayOrDash } from './helpers';

export function buildCustomersCsvRows(customers: Customer[]): (string | number)[][] {
  return [
    [
      'Company',
      'Contact Person',
      'Email',
      'Phone',
      'City',
      'State',
      'Postal Code',
      'Country',
      'Tax ID',
      'Customer Type',
      'Status',
      'Credit Limit',
    ],
    ...customers.map((c) => [
      c.company_name,
      c.contact_person,
      c.email,
      displayOrDash(c.phone),
      displayOrDash(c.city),
      displayOrDash(c.state),
      displayOrDash(c.postal_code),
      c.country,
      displayOrDash(c.tax_id),
      displayOrDash(c.customer_type),
      c.is_active ? 'Active' : 'Inactive',
      c.credit_limit ?? 0,
    ]),
  ];
}

export function buildCustomerStatementCsvRows(customer: Customer, orders: Order[]): (string | number)[][] {
  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const rows: (string | number)[][] = [
    ['Company', customer.company_name],
    ['Contact Person', customer.contact_person],
    ['Email', customer.email],
    ['Phone', displayOrDash(customer.phone)],
    ['Tax ID', displayOrDash(customer.tax_id)],
    ['Customer Type', displayOrDash(customer.customer_type)],
    ['Status', customer.is_active ? 'Active' : 'Inactive'],
    ['Credit Limit', customer.credit_limit ?? 0],
    ['Total Orders', orders.length],
    ['Total Spent', totalSpent],
    [],
    ['Order #', 'Date', 'Status', 'Amount'],
  ];

  orders.forEach((order) => {
    rows.push([order.order_number, formatDate(order.order_date), order.status, order.total_amount]);
  });

  return rows;
}
