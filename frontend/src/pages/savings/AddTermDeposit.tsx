import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createTermDeposit } from '../../lib/api/termDeposits';
import API from '../../lib/api/api';
import { Borrower } from '../../types/index';

const AddTermDeposit = () => {
  const navigate = useNavigate();
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    borrowerId: '',
    accountNumber: '',
    principalAmount: '',
    maturityDate: '',
    interestRate: '',
    compoundingFrequency: 'Quarterly' as 'Monthly' | 'Quarterly' | 'Annually',
    autoRenewal: false
  });

  const [touched, setTouched] = useState({
    borrowerId: false,
    accountNumber: false,
    principalAmount: false,
    maturityDate: false,
    interestRate: false
  });

  useEffect(() => {
    const fetchBorrowers = async () => {
      try {
        const res = await API.get<Borrower[]>('/borrowers');
        setBorrowers(res.data);
      } catch (err) {
        console.error('Error fetching borrowers:', err);
      }
    };
    fetchBorrowers();
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.borrowerId.trim()) newErrors.borrowerId = 'Borrower is required';
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
    if (!formData.principalAmount || Number(formData.principalAmount) <= 0) {
      newErrors.principalAmount = 'Principal must be greater than 0';
    }
    if (!formData.maturityDate) newErrors.maturityDate = 'Maturity date is required';
    if (!formData.interestRate || Number(formData.interestRate) < 0 || Number(formData.interestRate) > 100) {
      newErrors.interestRate = 'Interest rate must be between 0 and 100';
    }
    
    const maturityDate = new Date(formData.maturityDate);
    const today = new Date();
    if (maturityDate <= today) {
      newErrors.maturityDate = 'Maturity date must be in the future';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors).join(', '));
      Object.keys(errors).forEach(key => {
        setTouched(prev => ({ ...prev, [key]: true }));
      });
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await createTermDeposit({
        borrowerId: formData.borrowerId,
        accountNumber: formData.accountNumber,
        principalAmount: Number(formData.principalAmount),
        maturityDate: formData.maturityDate,
        interestRate: Number(formData.interestRate),
        compoundingFrequency: formData.compoundingFrequency,
        autoRenewal: formData.autoRenewal
      });
      
      setSuccessMessage('Term deposit created successfully!');
      setTimeout(() => {
        navigate('/savings/term-deposits/view');
      }, 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error creating term deposit';
      setError(errorMsg);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const daysUntilMaturity = () => {
    if (!formData.maturityDate) return 0;
    const days = Math.ceil((new Date(formData.maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/savings/term-deposits/view')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          <ArrowLeft className="text-gray-600 dark:text-gray-400" size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Term Deposit
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fixed deposit account with compound interest
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold">×</button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Borrower */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Borrower <span className="text-red-600">*</span>
            </label>
            <select
              name="borrowerId"
              value={formData.borrowerId}
              onChange={handleChange}
              onBlur={() => handleBlur('borrowerId')}
              className={`w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white text-gray-900 ${
                touched.borrowerId && !formData.borrowerId ? 'border-red-500' : ''
              }`}
            >
              <option value="">Select Borrower</option>
              {borrowers.map(borrower => (
                <option key={borrower.id} value={borrower.id}>
                  {borrower.firstName} {borrower.lastName} (ID: {borrower.uniqueId || borrower.id})
                </option>
              ))}
            </select>
            {touched.borrowerId && !formData.borrowerId && (
              <p className="text-red-500 text-sm mt-1">Borrower is required</p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Account Number <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              onBlur={() => handleBlur('accountNumber')}
              placeholder="TD-001"
              className={`w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white text-gray-900 ${
                touched.accountNumber && !formData.accountNumber ? 'border-red-500' : ''
              }`}
            />
            {touched.accountNumber && !formData.accountNumber && (
              <p className="text-red-500 text-sm mt-1">Account number is required</p>
            )}
          </div>

          {/* Principal Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Principal Amount (₹) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              name="principalAmount"
              value={formData.principalAmount}
              onChange={handleChange}
              onBlur={() => handleBlur('principalAmount')}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white text-gray-900 ${
                touched.principalAmount && (Number(formData.principalAmount) <= 0 || !formData.principalAmount) ? 'border-red-500' : ''
              }`}
            />
            {touched.principalAmount && (!formData.principalAmount || Number(formData.principalAmount) <= 0) && (
              <p className="text-red-500 text-sm mt-1">Principal must be greater than 0</p>
            )}
          </div>

          {/* Maturity Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Maturity Date <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              name="maturityDate"
              value={formData.maturityDate}
              onChange={handleChange}
              onBlur={() => handleBlur('maturityDate')}
              className={`w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white text-gray-900 ${
                touched.maturityDate && !formData.maturityDate ? 'border-red-500' : ''
              }`}
            />
            {touched.maturityDate && !formData.maturityDate && (
              <p className="text-red-500 text-sm mt-1">Maturity date is required</p>
            )}
            {formData.maturityDate && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {daysUntilMaturity()} days from today
              </p>
            )}
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Interest Rate (%) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              name="interestRate"
              value={formData.interestRate}
              onChange={handleChange}
              onBlur={() => handleBlur('interestRate')}
              placeholder="0.00"
              step="0.01"
              min="0"
              max="100"
              className={`w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white text-gray-900 ${
                touched.interestRate && (Number(formData.interestRate) < 0 || Number(formData.interestRate) > 100 || !formData.interestRate) ? 'border-red-500' : ''
              }`}
            />
            {touched.interestRate && (!formData.interestRate || Number(formData.interestRate) < 0 || Number(formData.interestRate) > 100) && (
              <p className="text-red-500 text-sm mt-1">Interest rate must be between 0 and 100</p>
            )}
          </div>
        </div>

        {/* Compounding Frequency */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Compounding Frequency
          </label>
          <div className="space-y-2">
            {['Monthly', 'Quarterly', 'Annually'].map(freq => (
              <label key={freq} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="compoundingFrequency"
                  value={freq}
                  checked={formData.compoundingFrequency === freq}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-gray-800 dark:text-gray-200">{freq}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Auto Renewal */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="autoRenewal"
            checked={formData.autoRenewal}
            onChange={handleChange}
            className="w-4 h-4 rounded"
          />
          <label className="text-gray-800 dark:text-gray-200 font-medium">
            Auto-renew deposit on maturity date
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/savings/term-deposits/view')}
            className="flex-1 px-4 py-2 border dark:border-gray-600 text-gray-900 dark:text-white rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Term Deposit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTermDeposit;
