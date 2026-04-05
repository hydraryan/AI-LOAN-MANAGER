import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { approveSavingsTransaction, getSavingsTransactions, rejectSavingsTransaction, SavingsTransaction } from '../../lib/api/savingsTransactions';

const ApproveSavingsTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPending = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await getSavingsTransactions({ status: 'pending', limit: 20, page });
      setTransactions(response.data);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load pending transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending(1);
  }, []);

  useEffect(() => {
    if (currentPage > 1) {
      fetchPending(currentPage);
    }
  }, [currentPage]);

  const summary = useMemo(() => ({
    pending: transactions.length,
    amount: transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  }), [transactions]);

  const approve = async (id: string) => {
    try {
      setError('');
      await approveSavingsTransaction(id);
      setMessage('Transaction approved');
      await fetchPending(currentPage);
      setTimeout(() => setMessage(''), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve transaction');
    }
  };

  const reject = async (id: string) => {
    try {
      setError('');
      await rejectSavingsTransaction(id);
      setMessage('Transaction rejected');
      await fetchPending(currentPage);
      setTimeout(() => setMessage(''), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject transaction');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approve Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Review pending entries and approve them individually.</p>
        </div>
        <button onClick={() => navigate('/savings-transactions/view')} className="rounded-md border px-4 py-2 dark:border-gray-700 dark:text-white">
          Back to Transactions
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">{message}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card label="Pending Transactions" value={total} />
        <Card label="Pending Amount" value={`₹${summary.amount.toLocaleString()}`} />
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="p-6 text-gray-600 dark:text-gray-300">Loading pending transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No pending transactions to approve.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Account</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Borrower</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Method</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3 text-sm text-blue-600 dark:text-blue-400">{txn.accountNumber}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{txn.borrowerName}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">₹{Number(txn.amount || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{txn.method}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => approve(txn.id)} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
                          <CheckCircle2 size={16} /> Approve
                        </button>
                        <button onClick={() => reject(txn.id)} className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700">
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages} ({total} pending total)</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="rounded-md border px-3 py-2 disabled:opacity-50 dark:border-gray-700 dark:text-white">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="rounded-md border px-3 py-2 disabled:opacity-50 dark:border-gray-700 dark:text-white">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Card = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

export default ApproveSavingsTransactions;
