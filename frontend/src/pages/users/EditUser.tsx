import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById, updateUser } from '../../lib/api/user';

type UserForm = {
  name: string;
  email: string;
  password: string;
};

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<UserForm>({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Invalid user id');
        setFetching(false);
        return;
      }
      try {
        setFetching(true);
        setError('');
        const user = await getUserById(id);
        setFormData({
          name: String(user.name || ''),
          email: String(user.email || ''),
          password: ''
        });
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load user');
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setLoading(true);
      setError('');
      await updateUser(id, {
        name: formData.name,
        email: formData.email,
        ...(formData.password ? { password: formData.password } : {})
      });
      navigate('/users');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6 text-gray-600 dark:text-gray-300">Loading user...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Admin</h1>
        <button onClick={() => navigate('/users')} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">Close</button>
      </div>

      <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/account/settings/team-access')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Settings: Team & Access</button>
          <button onClick={() => navigate('/account/settings/security')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Settings: Security</button>
          <button onClick={() => navigate('/audit-trail')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Audit Trail</button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

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
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Reset Password (optional)</label>
          <input name="password" type="password" minLength={10} value={formData.password} onChange={handleChange} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">If provided, use 10+ chars with upper, lower, number, and symbol.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/users')} className="rounded border px-4 py-2 dark:border-gray-700 dark:text-gray-200">Cancel</button>
          <button disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{loading ? 'Saving...' : 'Update Admin'}</button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
