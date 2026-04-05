import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, PiggyBank, BadgeIndianRupee, RefreshCcw } from 'lucide-react';
import { getSavingsAccounts, SavingsAccount } from '../../lib/api/savings';
import { getTermDeposits, TermDeposit } from '../../lib/api/termDeposits';

const SavingsReport = () => {
  const navigate = useNavigate();
  const [savings, setSavings] = useState<SavingsAccount[]>([]);
  const [termDeposits, setTermDeposits] = useState<TermDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError('');
        const [savingsResponse, termDepositResponse] = await Promise.all([
          getSavingsAccounts({ limit: 500, sort: 'createdAt', order: 'desc' }),
          getTermDeposits({ limit: 500, sort: 'createdAt', order: 'desc' })
        ]);

        setSavings(savingsResponse.data);
        setTermDeposits(termDepositResponse.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load savings report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const summary = useMemo(() => {
    const totalSavings = savings.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const totalTermDeposits = termDeposits.reduce((sum, deposit) => sum + Number(deposit.currentValue || 0), 0);
    const totalPortfolio = totalSavings + totalTermDeposits;
    const activeSavings = savings.filter((account) => account.status === 'Active').length;
    const dormantSavings = savings.filter((account) => account.status === 'Dormant').length;
    const closedSavings = savings.filter((account) => account.status === 'Closed').length;

    return {
      totalSavings,
      totalTermDeposits,
      totalPortfolio,
      activeSavings,
      dormantSavings,
      closedSavings,
      averageBalance: savings.length ? totalSavings / savings.length : 0
    };
  }, [savings, termDeposits]);

  const topAccounts = [...savings]
    .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/reports/overview')}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Portfolio snapshot for savings accounts and term deposits
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard
          title="Savings Balance"
          value={`₹${summary.totalSavings.toLocaleString()}`}
          icon={<PiggyBank size={18} />}
        />
        <SummaryCard
          title="Term Deposits"
          value={`₹${summary.totalTermDeposits.toLocaleString()}`}
          icon={<DollarSign size={18} />}
        />
        <SummaryCard
          title="Combined Portfolio"
          value={`₹${summary.totalPortfolio.toLocaleString()}`}
          icon={<BadgeIndianRupee size={18} />}
        />
        <SummaryCard
          title="Average Savings Balance"
          value={`₹${Math.round(summary.averageBalance).toLocaleString()}`}
          icon={<RefreshCcw size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Savings Status Breakdown</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current account health across the portfolio</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatusTile label="Active" value={summary.activeSavings} tone="green" />
            <StatusTile label="Dormant" value={summary.dormantSavings} tone="yellow" />
            <StatusTile label="Closed" value={summary.closedSavings} tone="gray" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Notes</h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li>• Savings accounts loaded directly from the live API.</li>
            <li>• Term deposits are included in the overall portfolio total.</li>
            <li>• Use lending overview and PAR reports to correlate portfolio risk.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top Savings Accounts</h2>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Account</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Borrower</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Product</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Balance</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {topAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{account.accountNumber}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-200">{account.borrowerName}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-300">{account.productName}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{Number(account.balance || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        account.status === 'Active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : account.status === 'Dormant'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {account.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {topAccounts.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No savings accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="mb-3 inline-flex rounded-md bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
      {icon}
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

const StatusTile = ({ label, value, tone }: { label: string; value: number; tone: 'green' | 'yellow' | 'gray' }) => {
  const styles = {
    green: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
    yellow: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
    gray: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  };

  return (
    <div className={`rounded-lg p-4 ${styles[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
};

export default SavingsReport;
