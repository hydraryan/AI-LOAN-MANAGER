import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronLeft, ChevronRight, RotateCw, LogOut } from 'lucide-react';
import { getTermDeposits, deleteTermDeposit, renewTermDeposit, withdrawTermDeposit, TermDeposit, TermDepositFilters } from '../../lib/api/termDeposits';

const ViewTermDeposits = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Matured' | 'Withdrawn' | ''>('Active');
  const [deposits, setDeposits] = useState<TermDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id?: string; name?: string }>({ show: false });
  const [renewModal, setRenewModal] = useState<{ show: boolean; id?: string; name?: string }>({ show: false });
  const [renewDate, setRenewDate] = useState('');
  const [withdrawModal, setWithdrawModal] = useState<{ show: boolean; id?: string; name?: string }>({ show: false });
  const [successMessage, setSuccessMessage] = useState('');

  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const filters: TermDepositFilters = {
        page,
        limit: 20,
        sort: 'maturityDate',
        order: 'asc'
      };
      
      if (statusFilter) filters.status = statusFilter;
      
      const response = await getTermDeposits(filters);
      setDeposits(response.data);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error fetching term deposits');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1);
  }, [statusFilter]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchData(currentPage);
    }
  }, [currentPage]);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await deleteTermDeposit(deleteModal.id);
      setSuccessMessage('Term deposit deleted');
      setDeleteModal({ show: false });
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error deleting term deposit');
    }
  };

  const handleRenew = async () => {
    if (!renewModal.id || !renewDate) return;
    try {
      await renewTermDeposit(renewModal.id, {
        newMaturityDate: renewDate
      });
      setSuccessMessage('Term deposit renewed successfully');
      setRenewModal({ show: false });
      setRenewDate('');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error renewing term deposit');
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawModal.id) return;
    try {
      await withdrawTermDeposit(withdrawModal.id);
      setSuccessMessage('Term deposit withdrawn');
      setWithdrawModal({ show: false });
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchData(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error withdrawing term deposit');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const daysUntilMaturity = (maturityDate: string) => {
    try {
      const days = Math.ceil((new Date(maturityDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(0, days);
    } catch {
      return -1;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Term Deposits
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage fixed deposit accounts ({total} total)
          </p>
        </div>
        <button
          onClick={() => navigate('/savings/term-deposits/add')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2"
        >
          <Plus size={18} /> Add Term Deposit
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold">×</button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Status Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Matured">Matured</option>
          <option value="Withdrawn">Withdrawn</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        ) : deposits.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No term deposits found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Account #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Borrower</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Principal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Current Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Maturity Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Days Left</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Interest %</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                      {deposit.accountNumber}
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-gray-200">{deposit.borrowerName}</td>
                    <td className="px-6 py-4 text-right font-semibold dark:text-gray-200">
                      ₹{deposit.principalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold dark:text-green-400">
                      ₹{Math.round(deposit.currentValue).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm dark:text-gray-200">
                      {formatDate(deposit.maturityDate)}
                    </td>
                    <td className="px-6 py-4 text-center dark:text-gray-200">
                      {daysUntilMaturity(deposit.maturityDate)} days
                    </td>
                    <td className="px-6 py-4 text-center dark:text-gray-200">
                      {deposit.interestRate}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 text-xs font-semibold rounded-full ${
                        deposit.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : deposit.status === 'Matured' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      {deposit.status === 'Active' && (
                        <>
                          <button
                            onClick={() => setRenewModal({ show: true, id: deposit.id, name: deposit.accountNumber })}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Renew"
                          >
                            <RotateCw size={18} />
                          </button>
                          <button
                            onClick={() => setWithdrawModal({ show: true, id: deposit.id, name: deposit.accountNumber })}
                            className="p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Withdraw"
                          >
                            <LogOut size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setDeleteModal({ show: true, id: deposit.id, name: deposit.accountNumber })}
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

      {/* Delete Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Delete Term Deposit?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Delete <strong>{deleteModal.name}</strong>? This cannot be undone.
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

      {/* Renew Modal */}
      {renewModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Renew Term Deposit</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              <strong>{renewModal.name}</strong> will be renewed with a new maturity date.
            </p>
            <input
              type="date"
              value={renewDate}
              onChange={(e) => setRenewDate(e.target.value)}
              className="w-full border dark:border-gray-700 px-3 py-2 rounded-md dark:bg-gray-900 dark:text-white mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={() => setRenewModal({ show: false })}
                className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRenew}
                disabled={!renewDate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Renew
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Withdraw Term Deposit</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Withdraw <strong>{withdrawModal.name}</strong>? Early withdrawal may have penalties.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setWithdrawModal({ show: false })}
                className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTermDeposits;
