import { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';

type Account = {
  _id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  balance: number;
};

const ViewAccounting = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🔥 FETCH REAL DATA
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setError('');
        const res = await API.get<Account[]>('/accounts');
        setAccounts(res.data);
      } catch (err) {
        console.error('Error fetching accounts', err);
        setError('Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const filtered = accounts.filter(a => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Delete this account? This cannot be undone.');
    if (!ok) return;

    try {
      await API.delete(`/accounts/${id}`);
      setAccounts((prev) => prev.filter((a) => a._id !== id));
    } catch (err: any) {
      window.alert(err?.response?.data?.error || 'Failed to delete account');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chart of Accounts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage general ledger accounts</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/account/settings')}
            className="border border-gray-300 dark:border-gray-600 px-4 py-2 rounded text-sm text-gray-700 dark:text-gray-200"
          >
            Settings
          </button>
          <button
            onClick={() => navigate('/accounting/add')}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus size={18} /> Add Account
          </button>
        </div>
      </div>

      <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/account/settings/accounting-setup')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Settings: Accounting Setup</button>
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

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 rounded flex justify-between">

        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />

          <input
            placeholder="Search account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-700"
          />
        </div>

        <div className="flex items-center gap-2 border px-3 py-2 rounded dark:border-gray-700">
          <Filter size={16} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-transparent text-sm dark:text-white"
          >
            <option value="All">All Types</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expense</option>
          </select>
        </div>

      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 overflow-hidden">

        {loading ? (
          <div className="p-6 text-center text-gray-600 dark:text-gray-300">Loading...</div>
        ) : (
          <table className="min-w-full">

            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Account Name</th>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right">Balance</th>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(account => (
                <tr key={account._id} className="hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">

                  <td className="px-6 py-4 text-sm font-mono text-gray-700 dark:text-gray-300">{account.code}</td>

                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{account.name}</td>

                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{account.type}</td>

                  <td className="px-6 py-4 text-sm text-right font-bold text-green-600 dark:text-green-400">
                    ₹{account.balance.toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-sm text-right">
                    <button
                      onClick={() => navigate(`/accounting/edit/${account._id}`)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(account._id)}
                      className="ml-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No accounts found
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAccounting;