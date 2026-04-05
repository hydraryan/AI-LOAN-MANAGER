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
    role: 'admin'
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Another Admin</h1>
        <button onClick={() => navigate('/users')} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">Close</button>
      </div>

      <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        Admin accounts are created manually with email and password. This project currently uses admin-only access.
      </div>

      <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/account/settings/team-access')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Settings: Team & Access</button>
          <button onClick={() => navigate('/account/settings/security')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Settings: Security</button>
          <button onClick={() => navigate('/audit-trail')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Audit Trail</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Name</label>
          <input name="name" value={formData.name} onChange={handleChange} required className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Email</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} required className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Password</label>
          <input name="password" type="password" minLength={10} value={formData.password} onChange={handleChange} required className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Use at least 10 characters with upper, lower, number, and symbol.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Role</label>
          <select name="role" value={formData.role} onChange={handleChange} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/users')} className="rounded border px-4 py-2 dark:border-gray-700 dark:text-gray-200">Cancel</button>
          <button disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{loading ? 'Saving...' : 'Create Admin'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddUser;
