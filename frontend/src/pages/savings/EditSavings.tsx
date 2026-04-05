import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, ArrowLeft } from 'lucide-react';
import { updateSavingsAccount, getSavingsAccounts } from '../../lib/api/savings';

type SavingsAccountDetail = {
  _id: string;
  accountNumber: string;
  borrowerId: {
    name?: string;
    userId?: { name?: string };
  };
  productName: string;
  balance: number;
  interestRate: number;
  status: 'Active' | 'Dormant' | 'Closed';
};

const EditSavings = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [account, setAccount] = useState<SavingsAccountDetail | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    balance: '',
    interestRate: '',
    status: 'Active' as 'Active' | 'Dormant' | 'Closed'
  });

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get account details from API
        const response = await getSavingsAccounts({ limit: 100 });
        const found = response.data.find((acc) => acc.id === id);
        
        if (found) {
          setAccount(found as any);
          setFormData({
            productName: found.productName,
            balance: String(found.balance),
            interestRate: String(found.interestRate),
            status: found.status
          });
        } else {
          setError('Account not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error loading account details');
        console.error('Error loading account:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAccount();
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.productName.trim()) {
      setError('Product name is required');
      return false;
    }
    const balance = Number(formData.balance);
    if (isNaN(balance) || balance < 0) {
      setError('Balance must be a non-negative number');
      return false;
    }
    const rate = Number(formData.interestRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Interest rate must be between 0 and 100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !validateForm()) return;

    setSubmitting(true);

    try {
      await updateSavingsAccount(id, {
        productName: formData.productName,
        balance: Number(formData.balance),
        interestRate: Number(formData.interestRate),
        status: formData.status
      });

      setSuccess('Account updated successfully!');
      setError('');

      setTimeout(() => {
        navigate('/savings/view');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error updating account');
      setSuccess('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500 dark:text-gray-400">Loading account details...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/savings/view')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Account</h1>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error || 'Account not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/savings/view')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Savings Account</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{account.accountNumber}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/savings/view')}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X size={24} />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 dark:text-red-400 font-bold">×</button>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded-lg shadow-sm space-y-6"
      >
        {/* Account Info (Read-only) */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Account Number</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{account.accountNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Account Holder</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {account.borrowerId?.userId?.name || account.borrowerId?.name || 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Product Name *
          </label>
          <input
            name="productName"
            type="text"
            value={formData.productName}
            onChange={handleChange}
            required
            className="w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Balance and Interest Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Balance
            </label>
            <input
              name="balance"
              type="number"
              value={formData.balance}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Interest Rate (%) *
            </label>
            <input
              name="interestRate"
              type="number"
              value={formData.interestRate}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              required
              className="w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="Active">Active</option>
            <option value="Dormant">Dormant</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/savings/view')}
            className="px-4 py-2 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSavings;
