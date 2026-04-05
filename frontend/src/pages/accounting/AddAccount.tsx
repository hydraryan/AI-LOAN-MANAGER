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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Ledger Account</h1>
        <button onClick={() => navigate('/accounting')} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">Close</button>
      </div>

      <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/account/settings/accounting-setup')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Settings: Accounting Setup</button>
          <button onClick={() => navigate('/reports/overview')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Reports</button>
          <button onClick={() => navigate('/audit-trail')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Audit Trail</button>
        </div>
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
          <button type="button" onClick={() => navigate('/accounting')} className="px-4 py-2 border rounded dark:border-gray-700 dark:text-gray-200">Cancel</button>
          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {loading ? 'Saving...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAccount;
