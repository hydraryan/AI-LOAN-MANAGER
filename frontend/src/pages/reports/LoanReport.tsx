import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CircleDollarSign, FileBarChart2, HandCoins } from 'lucide-react';
import API from '../../lib/api/api';
import { getLoanScheduleStats, getLoanStatusLabel } from '../../lib/loanStatus';

type Loan = {
  _id: string;
  borrowerId?: {
    name?: string;
    userId?: {
      name?: string;
    };
  };
  principal?: number;
  status?: string;
  createdAt?: string;
  schedule?: Array<{
    dueDate?: string;
    amount?: number;
    paidAmount?: number;
  }>;
};

const LoanReport = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLoans = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await API.get<Loan[]>('/loans');
        setLoans(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load loan report');
      } finally {
        setLoading(false);
      }
    };

    loadLoans();
  }, []);

  const report = useMemo(() => {
    const enriched = loans.map((loan) => {
      const stats = getLoanScheduleStats({ schedule: loan.schedule || [], status: loan.status });
      const borrowerName = loan.borrowerId?.userId?.name || loan.borrowerId?.name || 'Unknown Borrower';
      return { loan, stats, borrowerName };
    });

    const totalPrincipal = enriched.reduce((sum, item) => sum + Number(item.loan.principal || 0), 0);
    const totalOutstanding = enriched.reduce((sum, item) => sum + Number(item.stats.outstanding || 0), 0);
    const overdueLoans = enriched.filter((item) => item.stats.hasOverdue);
    const defaultedLoans = enriched.filter((item) => String(item.loan.status || '').toLowerCase() === 'defaulted');

    const biggestOverdue = [...overdueLoans]
      .sort((a, b) => b.stats.daysLate - a.stats.daysLate)
      .slice(0, 12);

    return {
      totalLoans: enriched.length,
      totalPrincipal,
      totalOutstanding,
      overdueCount: overdueLoans.length,
      defaultedCount: defaultedLoans.length,
      biggestOverdue,
    };
  }, [loans]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/reports/overview')}
          className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Portfolio-level lending status and overdue risk snapshot</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate('/reports/overview')} className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Overview</button>
        <button onClick={() => navigate('/reports/collections')} className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Collections</button>
        <button onClick={() => navigate('/reports/par')} className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">PAR</button>
        <button onClick={() => navigate('/reports/savings')} className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Savings</button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <SummaryCard title="Total Loans" value={report.totalLoans} icon={<FileBarChart2 size={18} />} />
        <SummaryCard title="Principal Disbursed" value={`₹${report.totalPrincipal.toLocaleString()}`} icon={<HandCoins size={18} />} />
        <SummaryCard title="Outstanding" value={`₹${report.totalOutstanding.toLocaleString()}`} icon={<CircleDollarSign size={18} />} />
        <SummaryCard title="Overdue Loans" value={report.overdueCount} icon={<AlertCircle size={18} />} tone="amber" />
        <SummaryCard title="Defaulted Loans" value={report.defaultedCount} icon={<AlertCircle size={18} />} tone="red" />
      </div>

      <div className="rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Highest Risk Loans</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ordered by maximum days late from unpaid schedule lines</p>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((x) => (
              <div key={x} className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Loan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Borrower</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Outstanding</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Days Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {report.biggestOverdue.map((item) => (
                  <tr key={item.loan._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{item.loan._id}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{item.borrowerName}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{getLoanStatusLabel(item.loan.status)}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-amber-700 dark:text-amber-300">₹{item.stats.outstanding.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-rose-700 dark:text-rose-300">{item.stats.daysLate}</td>
                  </tr>
                ))}
                {!loading && report.biggestOverdue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No overdue loans found.
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

const SummaryCard = ({
  title,
  value,
  icon,
  tone = 'blue',
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: 'blue' | 'amber' | 'red';
}) => {
  const toneMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
    red: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300',
  };

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className={`mb-3 inline-flex rounded-md p-2 ${toneMap[tone]}`}>{icon}</div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
};

export default LoanReport;
