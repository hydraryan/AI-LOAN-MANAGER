import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import API from '../../lib/api/api';
import { createSavingsAccount } from '../../lib/api/savings';

type Borrower = {
  _id: string;
  name?: string;
  userId?: {
    name?: string;
  };
};

const AddSavings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    borrowerId: '',
    accountNumber: '',
    productName: 'Savings Account',
    balance: '0',
    interestRate: ''
  });

  useEffect(() => {
    const fetchBorrowers = async () => {
      try {
        const res = await API.get('/borrowers');
        setBorrowers(res.data || []);
      } catch (err) {
        console.error('Error fetching borrowers:', err);
        setError('Failed to load borrowers');
      }
    };

    fetchBorrowers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.borrowerId) {
      setError('Please select a borrower');
      return false;
    }
    if (!formData.accountNumber.trim()) {
      setError('Account number is required');
      return false;
    }
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
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      await createSavingsAccount({
        borrowerId: formData.borrowerId,
        accountNumber: formData.accountNumber,
        balance: Number(formData.balance),
        interestRate: Number(formData.interestRate),
        productName: formData.productName
      });

      setSuccess('Savings account created successfully!');
      setError('');
      
      // Reset form
      setFormData({
        borrowerId: '',
        accountNumber: '',
        productName: 'Savings Account',
        balance: '0',
        interestRate: ''
      });

      // Navigate after 2 seconds
      setTimeout(() => {
        navigate('/savings/view');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creating savings account');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Savings Account</h1>
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
        {/* Borrower Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Select Borrower *
          </label>
          <select
            name="borrowerId"
            value={formData.borrowerId}
            onChange={handleChange}
            required
            className="w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Choose Borrower --</option>
            {borrowers.map((b) => (
              <option key={b._id} value={b._id}>
                {b.userId?.name || b.name || 'Unknown'}
              </option>
            ))}
          </select>
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Account Number *
          </label>
          <input
            name="accountNumber"
            type="text"
            placeholder="e.g., SAV-001234"
            value={formData.accountNumber}
            onChange={handleChange}
            required
            className="w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Product Name *
          </label>
          <input
            name="productName"
            type="text"
            placeholder="e.g., Savings Account, Premium Savings"
            value={formData.productName}
            onChange={handleChange}
            required
            className="w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Balance and Interest Rate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Opening Balance
            </label>
            <input
              name="balance"
              type="number"
              placeholder="0"
              value={formData.balance}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Interest Rate (%) *
            </label>
            <input
              name="interestRate"
              type="number"
              placeholder="5.0"
              value={formData.interestRate}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              required
              className="w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
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
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center gap-2"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSavings;
