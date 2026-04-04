import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';

const AddUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'officer'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await API.post('/users', formData);
      navigate('/users');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add System User</h1>
        <button onClick={() => navigate('/users')} className="text-gray-500 hover:text-gray-700">Close</button>
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

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Password</label>
          <input name="password" type="password" minLength={6} value={formData.password} onChange={handleChange} required className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white" />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Role</label>
          <select name="role" value={formData.role} onChange={handleChange} className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white">
            <option value="admin">Admin</option>
            <option value="officer">Staff</option>
            <option value="borrower">Borrower</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/users')} className="px-4 py-2 border rounded">Cancel</button>
          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Saving...' : 'Create User'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;
