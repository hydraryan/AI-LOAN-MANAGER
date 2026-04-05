import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSavingsAccounts, deleteSavingsAccount, SavingsAccount, SavingsFilters } from '../../lib/api/savings';

const ViewSavings = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Dormant' | 'Closed' | ''>('');
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id?: string; name?: string }>({ show: false });
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch data with filters and pagination
  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const filters: SavingsFilters = {
        page,
        limit: 20,
        sort: 'createdAt',
        order: 'desc'
      };
      
      if (statusFilter) filters.status = statusFilter;
      if (searchTerm) filters.search = searchTerm;
      
      const response = await getSavingsAccounts(filters);
      setAccounts(response.data);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error fetching savings accounts');
      console.error('Error fetching savings accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchData(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  // Load data on page change
  useEffect(() => {
    if (currentPage > 1) {
      fetchData(currentPage);
    }
  }, [currentPage]);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await deleteSavingsAccount(deleteModal.id);
      setSuccessMessage('Account deleted successfully');
      setDeleteModal({ show: false });
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error deleting account');
      console.error('Error deleting account:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Savings Accounts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage customer savings and deposits ({total} total)
          </p>
        </div>
        <button
          onClick={() => navigate('/savings/add')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
        >
          <Plus size={18} /> Add Account
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700 dark:text-red-400 font-bold">×</button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search account or borrower..."
              className="w-full pl-10 pr-3 py-2 border dark:border-gray-700 rounded-md focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Dormant">Dormant</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Clear Filters */}
          {(searchTerm || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="justify-self-end px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No savings accounts found. {searchTerm || statusFilter ? 'Try clearing filters.' : ''}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Account #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Account Holder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Product</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Balance</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Interest %</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                      {account.accountNumber}
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-gray-200">{account.borrowerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{account.productName}</td>
                    <td className="px-6 py-4 text-right font-bold dark:text-gray-200">₹{account.balance.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center dark:text-gray-200">{account.interestRate}%</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 text-xs font-semibold rounded-full ${
                        account.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : account.status === 'Dormant' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => navigate(`/savings/edit/${account.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ show: true, id: account.id, name: account.accountNumber })}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border dark:border-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border dark:border-gray-700 rounded-md disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Delete Account?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete account <strong>{deleteModal.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteModal({ show: false })}
                className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewSavings;
