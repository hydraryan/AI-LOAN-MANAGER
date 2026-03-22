import { useEffect, useState } from 'react';
import { Eye, Plus, Search, Filter } from 'lucide-react';
import { getSavingsAccounts } from '../../lib/api/savings';

interface SavingsAccount {
  id: string;
  accountNumber: string;
  borrowerName: string;
  productName: string;
  balance: number;
  interestRate: number;
  status: 'Active' | 'Dormant' | 'Closed';
}

const ViewSavings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSavingsAccounts();
        setAccounts(data);
      } catch (err) {
        console.error('Error fetching savings accounts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAccounts = accounts.filter((s) =>
    s.borrowerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Savings Accounts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage customer savings and deposits
          </p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
          <Plus size={18} /> Add Account
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />

          <input
            type="text"
            placeholder="Search account or name..."
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Account #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Account Holder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                  Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase">
                  Interest %
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredAccounts.map((account) => (
                <tr
                  key={account.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">
                    {account.accountNumber}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    {account.borrowerName}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-500">
                    {account.productName}
                  </td>

                  <td className="px-6 py-4 text-right font-bold">
                    ₹{account.balance.toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {account.interestRate}%
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 text-xs font-semibold rounded-full ${
                        account.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : account.status === 'Dormant'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {account.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-blue-600">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filteredAccounts.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No accounts found
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewSavings;