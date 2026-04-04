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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH REAL DATA
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await API.get<Account[]>('/accounts');
        setAccounts(res.data);
      } catch (err) {
        console.error('Error fetching accounts', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.code.includes(searchTerm)
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Chart of Accounts</h1>
          <p className="text-sm text-gray-500">Manage general ledger accounts</p>
        </div>

        <button
          onClick={() => navigate('/accounting/add')}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={18} /> Add Account
        </button>
      </div>

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

        <button className="flex items-center gap-2 border px-3 py-2 rounded">
          <Filter size={16} /> Filter
        </button>

      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 overflow-hidden">

        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <table className="min-w-full">

            <thead>
              <tr>
                <th>Code</th>
                <th>Account Name</th>
                <th>Type</th>
                <th className="text-right">Balance</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(account => (
                <tr key={account._id}>

                  <td className="font-mono">{account.code}</td>

                  <td className="font-medium">{account.name}</td>

                  <td>{account.type}</td>

                  <td className="text-right font-bold text-green-600">
                    ₹{account.balance.toLocaleString()}
                  </td>

                  <td className="text-right text-blue-600 cursor-pointer">
                    Edit
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No accounts found
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAccounting;