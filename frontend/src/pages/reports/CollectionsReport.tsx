import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarClock, CircleAlert, FileSpreadsheet, Wallet } from 'lucide-react';
import {
  CollectionSheetRow,
  getDailyCollectionSheet,
  getMissedCollectionSheet,
  getPastMaturityCollectionSheet,
} from '../../lib/api/collection';

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const CollectionsReport = () => {
  const navigate = useNavigate();
  const [reportDate, setReportDate] = useState(today());
  const [dailyRows, setDailyRows] = useState<CollectionSheetRow[]>([]);
  const [missedRows, setMissedRows] = useState<CollectionSheetRow[]>([]);
  const [pastMaturityRows, setPastMaturityRows] = useState<CollectionSheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [daily, missed, past] = await Promise.all([
        getDailyCollectionSheet(reportDate),
        getMissedCollectionSheet(reportDate),
        getPastMaturityCollectionSheet(reportDate),
      ]);

      setDailyRows(daily.rows || []);
      setMissedRows(missed.rows || []);
      setPastMaturityRows(past.rows || []);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load collections report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [reportDate]);

  const summary = useMemo(() => {
    const totalDailyOutstanding = dailyRows.reduce((sum, row) => sum + Number(row.outstanding || 0), 0);
    const totalMissedOutstanding = missedRows.reduce((sum, row) => sum + Number(row.outstanding || 0), 0);
    const totalPastMaturityOutstanding = pastMaturityRows.reduce((sum, row) => sum + Number(row.outstanding || 0), 0);

    const riskiest = [...missedRows, ...pastMaturityRows]
      .sort((a, b) => Number(b.outstanding || 0) - Number(a.outstanding || 0))
      .slice(0, 15);

    return {
      totalDailyOutstanding,
      totalMissedOutstanding,
      totalPastMaturityOutstanding,
      totalAtRiskOutstanding: totalMissedOutstanding + totalPastMaturityOutstanding,
      riskiest,
    };
  }, [dailyRows, missedRows, pastMaturityRows]);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collections Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Daily due, missed, and past maturity exposure for field collections</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate('/reports/overview')} className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Overview</button>
        <button onClick={() => navigate('/reports/loans')} className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Loans</button>
        <button onClick={() => navigate('/reports/par')} className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">PAR</button>
        <button onClick={() => navigate('/reports/savings')} className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Savings</button>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Date</label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="rounded border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            onClick={load}
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard title="Due Today" value={dailyRows.length} icon={<CalendarClock size={18} />} />
        <SummaryCard title="Missed Repayments" value={missedRows.length} icon={<CircleAlert size={18} />} tone="amber" />
        <SummaryCard title="Past Maturity" value={pastMaturityRows.length} icon={<FileSpreadsheet size={18} />} tone="red" />
        <SummaryCard title="At-Risk Outstanding" value={`₹${summary.totalAtRiskOutstanding.toLocaleString()}`} icon={<Wallet size={18} />} tone="red" />
      </div>

      <div className="rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Top At-Risk Accounts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Largest outstanding balances across missed and past-maturity sheets</p>
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
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Borrower</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Loan</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Outstanding</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Days Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {summary.riskiest.map((row) => (
                  <tr key={`${row.loanId}-${row.dueDate}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{row.borrowerName}</td>
                    <td className="px-5 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{row.loanId}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-amber-700 dark:text-amber-300">₹{Number(row.outstanding || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{row.daysOverdue}</td>
                  </tr>
                ))}
                {!loading && summary.riskiest.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No at-risk rows found for this date.
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

export default CollectionsReport;
