import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getInvestorAccounts,
  deleteInvestorAccount,
} from '../../lib/api/investorAccounts';
import PageHeader from '../../components/Shared/PageHeader';
import { getInvestors } from '../../lib/api/investors';

const ViewInvestorAccounts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialInvestorId = searchParams.get('investorId') || '';
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    investorId: initialInvestorId,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [investors, setInvestors] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadInvestors = async () => {
      try {
        const res = await getInvestors();
        setInvestors(res.data || []);
      } catch {
        setInvestors([]);
      }
    };

    loadInvestors();
  }, []);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoading(true);
        setError('');
        const res = await getInvestorAccounts({
          page,
          limit: 20,
          status: filters.status || undefined,
          investorId: filters.investorId || undefined,
        });
        setAccounts(res.data || []);
        setPagination(res.pagination);
      } catch (err: any) {
        setError('Failed to load accounts');
      } finally {
        setIsLoading(false);
      }
    };
    loadAccounts();
  }, [page, filters]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        setDeleting(id);
        await deleteInvestorAccount(id);
        setAccounts(accounts.filter(a => a._id !== id));
      } catch (err: any) {
        setError('Failed to delete account');
      } finally {
        setDeleting(null);
      }
    }
  };

  const getInvestorName = (account: any) => {
    if (account?.investorDetails?.name) return account.investorDetails.name;
    if (typeof account?.investorId === 'object' && account?.investorId?.name) {
      return account.investorId.name;
    }
    return 'N/A';
  };

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return accounts;

    return accounts.filter((account: any) => {
      const investorName = getInvestorName(account).toLowerCase();
      const accountNumber = String(account.accountNumber || '').toLowerCase();
      const bank = String(account.bank || '').toLowerCase();
      const accountType = String(account.accountType || '').toLowerCase();
      return (
        investorName.includes(query) ||
        accountNumber.includes(query) ||
        bank.includes(query) ||
        accountType.includes(query)
      );
    });
  }, [accounts, search]);

  return (
    <div className="space-y-6">
      {filters.investorId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          Viewing accounts in investor context.
          <button
            onClick={() => navigate(`/investors/${filters.investorId}`)}
            className="ml-2 font-medium underline"
          >
            Open Investor
          </button>
        </div>
      )}

      <PageHeader
        title="Investor Accounts"
        description="Manage investor bank accounts and financial details"
        actionLabel="Add Account"
        onAction={() =>
          navigate(
            filters.investorId
              ? `/accounts/add?investorId=${filters.investorId}`
              : '/accounts/add'
          )
        }
      />

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Investor
            </label>
            <select
              value={filters.investorId}
              onChange={(e) => {
                setFilters({ ...filters, investorId: e.target.value });
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Investors</option>
              {investors.map((investor: any) => (
                <option key={investor._id} value={investor._id}>
                  {investor.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Investor, account no, bank..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ status: '', investorId: '' });
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-lg border bg-white p-8 shadow-sm text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">Loading accounts...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Error loading accounts
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 shadow-sm text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">No accounts found</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden shadow-sm dark:border-gray-800">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Investor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Account Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Bank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {filteredAccounts.map((account: any) => (
                  <tr
                    key={account._id}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <button
                        onClick={() => navigate(`/investors/${account.investorId}`)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {getInvestorName(account)}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {account.accountNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {account.bank}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <span className="capitalize">{account.accountType}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {account.currency} {account.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          account.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : account.status === 'inactive'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => navigate(`/investments/view?investorId=${account.investorId}`)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Investments
                      </button>
                      <button
                        onClick={() => navigate(`/accounts/edit/${account._id}`)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account._id)}
                        disabled={deleting === account._id}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between py-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ViewInvestorAccounts;
