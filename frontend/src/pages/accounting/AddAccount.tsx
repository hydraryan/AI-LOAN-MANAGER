import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';

const AddAccount = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Asset',
    balance: '0'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post('/accounts', {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        balance: Number(formData.balance)
      });
      navigate('/accounting');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add Ledger Account</h1>
        <button onClick={() => navigate('/accounting')} className="text-gray-500 hover:text-gray-700">Close</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded border space-y-4">
        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Account Code</label>
          <input
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Account Name</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white"
          >
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expense</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Opening Balance</label>
          <input
            name="balance"
            type="number"
            min="0"
            value={formData.balance}
            onChange={handleChange}
            className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/accounting')} className="px-4 py-2 border rounded">Cancel</button>
          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {loading ? 'Saving...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAccount;
