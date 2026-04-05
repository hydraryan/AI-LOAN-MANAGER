import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import {
  approveSavingsTransaction,
  getSavingsTransactions,
  SavingsTransaction
} from '../../lib/api/savingsTransactions';

const ViewSavingsTransactions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<SavingsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || searchParams.get('borrowerName') || searchParams.get('savingsAccountId') || '');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
  const [methodFilter, setMethodFilter] = useState(() => searchParams.get('method') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [success, setSuccess] = useState('');

  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await getSavingsTransactions({
        page,
        limit: 20,
        search: searchTerm,
        status: statusFilter,
        method: methodFilter
      });
      setTransactions(response.data);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load savings transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchData(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, methodFilter]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchData(currentPage);
    }
  }, [currentPage]);

  const metrics = useMemo(() => {
    return {
      total,
      pending: transactions.filter((item) => item.status.toLowerCase() === 'pending').length,
      approved: transactions.filter((item) => item.status.toLowerCase() === 'approved').length,
      amount: transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    };
  }, [transactions, total]);

  const handleApprove = async (id: string) => {
    try {
      await approveSavingsTransaction(id);
      setSuccess('Transaction approved successfully');
      setTimeout(() => setSuccess(''), 2500);
      fetchData(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve transaction');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Review and approve savings-side transaction entries</p>
        </div>
        <button
          onClick={() => navigate('/savings-transactions/bulk-add')}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Add Bulk Transactions
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">{success}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Transactions" value={metrics.total} />
        <MetricCard label="Approved" value={metrics.approved} tone="green" />
        <MetricCard label="Pending" value={metrics.pending} tone="amber" />
        <MetricCard label="Amount" value={`₹${metrics.amount.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search borrower name or account number..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          <option value="">All Methods</option>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="System">System</option>
          <option value="Mobile Money">Mobile Money</option>
          <option value="Cheque">Cheque</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No transactions found. Try clearing filters or adding new entries.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Account</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Borrower</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Requested Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Method</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{txn.accountNumber}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{txn.borrowerName}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">₹{Number(txn.amount || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-sm text-gray-700 dark:text-gray-300">₹{Number(txn.requestedAmount || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{txn.method}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${txn.status.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {txn.status.toLowerCase() === 'pending' ? (
                        <button onClick={() => handleApprove(txn.id)} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
                          <CheckCircle2 size={16} /> Approve
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">Approved</span>
                      )}
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
          <p className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} of {totalPages} ({total} total)</p>
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

const MetricCard = ({ label, value, tone }: { label: string; value: string | number; tone?: 'green' | 'amber' }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${tone === 'green' ? 'text-green-600 dark:text-green-400' : tone === 'amber' ? 'text-amber-600 dark:text-amber-300' : 'text-gray-900 dark:text-white'}`}>{value}</p>
  </div>
);

export default ViewSavingsTransactions;
