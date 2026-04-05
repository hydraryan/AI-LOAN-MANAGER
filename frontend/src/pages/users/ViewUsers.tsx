import { useEffect, useState } from 'react';
import { Search, Shield, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deleteUser, getUsers } from '../../lib/api/user';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin';
  lastActive: string;
}

const ViewUsers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Delete this admin account? This cannot be undone.');
    if (!ok) return;

    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      window.alert(err?.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View admin users with system access</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/account/settings')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            Settings
          </button>
          <button
            onClick={() => navigate('/users/add')}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus size={18} /> Add Admin
          </button>
        </div>
      </div>

      <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/account/settings/team-access')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Settings: Team & Access</button>
          <button onClick={() => navigate('/account/settings/activity')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Settings: Activity</button>
          <button onClick={() => navigate('/reports/overview')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Reports</button>
          <button onClick={() => navigate('/audit-trail')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Audit Trail</button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="relative w-96 max-w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search users..."
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="animate-fadein overflow-x-auto rounded-xl border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center p-8 text-center text-gray-400 dark:text-gray-500">
            <Shield className="mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" />
            No users found
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">User</th>
                <th className="px-6 py-3 font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">Role</th>
                <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">Last Active</th>
                <th className="px-6 py-3 text-right font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((u) => {
                  const query = searchTerm.toLowerCase();
                  return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
                })
                .map((user) => (
                  <tr key={user.id} className="transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-gray-500 dark:text-gray-400">{user.email}</div>
                    </td>
                    <td className="flex items-center gap-1 px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <Shield size={14} /> {user.role}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">{user.lastActive}</td>
                    <td className="flex justify-end gap-2 px-6 py-4 text-right">
                      <button onClick={() => navigate(`/users/edit/${user.id}`)} className="text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ViewUsers;
