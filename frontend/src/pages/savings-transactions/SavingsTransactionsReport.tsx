import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Clock3, CircleCheck, Wallet } from 'lucide-react';
import { getSavingsTransactionReport, SavingsTransactionReport } from '../../lib/api/savingsTransactions';

const SavingsTransactionsReport = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<SavingsTransactionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getSavingsTransactionReport();
        setReport(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load savings transaction report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/reports')} className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Transactions Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Operational view of savings transaction activity and approval queue.</p>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label="Transactions" value={report?.totalTransactions || 0} icon={<BarChart3 size={18} />} />
        <MetricCard label="Approved" value={report?.approved || 0} icon={<CircleCheck size={18} />} />
        <MetricCard label="Pending" value={report?.pending || 0} icon={<Clock3 size={18} />} />
        <MetricCard label="Amount" value={`₹${Number(report?.totalAmount || 0).toLocaleString()}`} icon={<Wallet size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Method Mix</h2>
          <div className="mt-4 space-y-3">
            {(report?.byMethod || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-md bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.count}</span>
              </div>
            ))}
            {!loading && (report?.byMethod || []).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Summary Notes</h2>
          <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>• Requested amount tracks the original entry amount entered by staff.</p>
            <p>• Unapplied amount reflects any remainder not allocated to a loan.</p>
            <p>• The recent transactions table shows the latest 10 entries from the backend report.</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
        </div>
        {loading ? (
          <div className="p-6 text-gray-600 dark:text-gray-300">Loading report...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Account</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Borrower</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Unapplied</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {(report?.recentTransactions || []).map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3 text-sm text-blue-600 dark:text-blue-400">{txn.accountNumber}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{txn.borrowerName}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">₹{Number(txn.amount || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-sm text-gray-700 dark:text-gray-300">₹{Number(txn.unappliedAmount || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{txn.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="mb-3 inline-flex rounded-md bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300">{icon}</div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

export default SavingsTransactionsReport;
