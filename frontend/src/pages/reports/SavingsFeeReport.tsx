import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ReceiptText, Wallet } from 'lucide-react';
import { getSavingsAccounts, SavingsAccount } from '../../lib/api/savings';

const MONTHLY_DORMANT_FEE = 25;
const CLOSED_REVIEW_FEE = 50;

const SavingsFeeReport = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeeReport = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getSavingsAccounts({ limit: 500, sort: 'createdAt', order: 'desc' });
        setAccounts(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load savings fee report');
      } finally {
        setLoading(false);
      }
    };

    fetchFeeReport();
  }, []);

  const report = useMemo(() => {
    const dormantAccounts = accounts.filter((account) => account.status === 'Dormant');
    const closedAccounts = accounts.filter((account) => account.status === 'Closed');
    const activeAccounts = accounts.filter((account) => account.status === 'Active');

    const estimatedMonthlyExposure = dormantAccounts.length * MONTHLY_DORMANT_FEE + closedAccounts.length * CLOSED_REVIEW_FEE;

    return {
      dormantAccounts,
      closedAccounts,
      activeAccounts,
      estimatedMonthlyExposure,
      affectedAccounts: dormantAccounts.length + closedAccounts.length
    };
  }, [accounts]);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Fee Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estimated maintenance exposure based on savings account status
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        This report estimates fee exposure from dormant and closed savings accounts. There is no fee ledger model yet, so this view is analytical rather than transactional.
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <FeeCard title="Estimated Monthly Exposure" value={`₹${report.estimatedMonthlyExposure.toLocaleString()}`} icon={<ReceiptText size={18} />} />
        <FeeCard title="Dormant Accounts" value={report.dormantAccounts.length} icon={<AlertTriangle size={18} />} />
        <FeeCard title="Closed Accounts" value={report.closedAccounts.length} icon={<Wallet size={18} />} />
        <FeeCard title="Accounts Flagged" value={report.affectedAccounts} icon={<AlertTriangle size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b px-5 py-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Rules</h2>
          </div>
          <div className="space-y-3 p-5 text-sm text-gray-600 dark:text-gray-300">
            <p>• Dormant accounts are estimated at ₹{MONTHLY_DORMANT_FEE} per month.</p>
            <p>• Closed accounts are tracked at ₹{CLOSED_REVIEW_FEE} per review cycle.</p>
            <p>• Active accounts are not included in the exposure calculation.</p>
            <p>• Add a dedicated fee model later if the business needs ledger-backed fee posting.</p>
          </div>
        </div>

        <div className="rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b px-5 py-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Status Mix</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
            <StatusTile label="Active" value={report.activeAccounts.length} tone="green" />
            <StatusTile label="Dormant" value={report.dormantAccounts.length} tone="yellow" />
            <StatusTile label="Closed" value={report.closedAccounts.length} tone="gray" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Flagged Accounts</h2>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => (
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
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Estimated Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {[...report.dormantAccounts, ...report.closedAccounts].map((account) => {
                  const estimatedFee = account.status === 'Dormant' ? MONTHLY_DORMANT_FEE : CLOSED_REVIEW_FEE;
                  return (
                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-5 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{account.accountNumber}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{account.borrowerName}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          account.status === 'Dormant'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {account.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">₹{estimatedFee.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {report.affectedAccounts === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No dormant or closed accounts found.
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

const FeeCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="mb-3 inline-flex rounded-md bg-amber-50 p-2 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
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

export default SavingsFeeReport;
