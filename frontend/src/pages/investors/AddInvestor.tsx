import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';

const AddInvestor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    totalInvested: '0',
    activeLoans: '0',
    status: 'Active'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post('/investors', {
        name: formData.name,
        email: formData.email,
        totalInvested: Number(formData.totalInvested),
        activeLoans: Number(formData.activeLoans),
        status: formData.status
      });
      navigate('/investors/view');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create investor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add Investor</h1>
        <button onClick={() => navigate('/investors/view')} className="text-gray-500 hover:text-gray-700">Close</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded border space-y-4">
        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Name</label>
          <input name="name" value={formData.name} onChange={handleChange} required className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white" />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Email</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Total Invested</label>
            <input name="totalInvested" type="number" min="0" value={formData.totalInvested} onChange={handleChange} className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Active Loans</label>
            <input name="activeLoans" type="number" min="0" value={formData.activeLoans} onChange={handleChange} className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white" />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white">
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/investors/view')} className="px-4 py-2 border rounded">Cancel</button>
          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Saving...' : 'Create Investor'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddInvestor;
