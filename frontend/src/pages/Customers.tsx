import { useState, useEffect } from 'react';
import { customerService, customerActivityService } from '../services';
import type { Customer, CreateCustomerData, CustomerActivity } from '../services';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
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

  useEffect(() => {
    loadCustomers();
  }, []);

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

  const handleCreate = async (data: CreateCustomerData) => {
    try {
      const response = await customerService.createCustomer(data);
      if (response.success) {
        setShowModal(false);
        loadCustomers();
      } else {
        setError(response.message || 'Failed to create customer');
      }
    } catch (err) {
      setError('An error occurred while creating customer');
    }
  };

  const handleUpdate = async (id: number, data: CreateCustomerData) => {
    try {
      const response = await customerService.updateCustomer(id, data);
      if (response.success) {
        setShowModal(false);
        setEditingCustomer(null);
        loadCustomers();
      } else {
        setError(response.message || 'Failed to update customer');
      }
    } catch (err) {
      setError('An error occurred while updating customer');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const response = await customerService.deleteCustomer(id);
      if (response.success) {
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

  if (loading) return <div className="p-6">Loading customers...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Customer
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{customer.company_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{customer.contact_person}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{customer.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{customer.phone || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setEditingCustomer(customer);
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleViewActivities(customer)}
                    className="text-green-600 hover:text-green-900 mr-4"
                  >
                    Activities
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="text-center py-8 text-gray-500">No customers found</div>
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
    </div>
  );
}

function CustomerModal({ onClose, onSave, customer }: { onClose: () => void; onSave: (data: CreateCustomerData) => void; customer?: Customer | null }) {
  const [formData, setFormData] = useState<CreateCustomerData>({
    company_name: customer?.company_name || '',
    contact_person: customer?.contact_person || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    postal_code: customer?.postal_code || '',
    country: customer?.country || 'India',
    credit_limit: customer?.credit_limit || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{customer ? 'Edit Customer' : 'Add Customer'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Person</label>
            <input
              type="text"
              required
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Activity History - {customerName}</h2>
          <button
            onClick={onAddActivity}
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
          >
            Add Activity
          </button>
        </div>
        {activities.length === 0 ? (
          <p className="text-gray-500">No activities recorded</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="border-b pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{activity.subject}</p>
                    <p className="text-sm text-gray-600 capitalize">{activity.activity_type}</p>
                    {activity.description && (
                      <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm capitalize text-gray-600">{activity.status}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <button
                      onClick={() => onEditActivity(activity)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteActivity(activity.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{activity ? 'Edit Activity' : 'Add Activity'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Activity Type</label>
            <select
              value={formData.activity_type}
              onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
