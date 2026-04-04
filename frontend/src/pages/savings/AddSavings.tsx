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

  const [formData, setFormData] = useState({
    borrowerId: '',
    accountNumber: '',
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
      }
    };

    fetchBorrowers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createSavingsAccount({
        borrowerId: formData.borrowerId,
        accountNumber: formData.accountNumber,
        balance: Number(formData.balance),
        interestRate: Number(formData.interestRate)
      });

      navigate('/savings/view');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error creating savings account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Savings Account</h1>
        <button onClick={() => navigate('/savings/view')}>
          <X />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            name="borrowerId"
            value={formData.borrowerId}
            onChange={handleChange}
            required
            className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white"
          >
            <option value="">Select Borrower</option>
            {borrowers.map((b) => (
              <option key={b._id} value={b._id}>
                {b.userId?.name || b.name || 'Unknown'}
              </option>
            ))}
          </select>

          <input
            name="accountNumber"
            placeholder="Account Number"
            value={formData.accountNumber}
            onChange={handleChange}
            required
            className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
          />

          <input
            name="balance"
            type="number"
            placeholder="Opening Balance"
            value={formData.balance}
            min="0"
            onChange={handleChange}
            className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
          />

          <input
            name="interestRate"
            type="number"
            placeholder="Interest Rate"
            value={formData.interestRate}
            min="0"
            step="0.1"
            onChange={handleChange}
            required
            className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/savings/view')}
            className="border px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSavings;
