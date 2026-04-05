import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { getRepayments, RepaymentDisplay } from '../../lib/api/repayment';

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'];

const RepaymentCharts = () => {
  const navigate = useNavigate();
  const [repayments, setRepayments] = useState<RepaymentDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const fetchRepayments = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const data = await getRepayments();
      setRepayments(data);
    } catch (err) {
      console.error(err);
      setFetchError('Failed to load repayment analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepayments();
  }, []);

  const monthlyData = useMemo(() => {
    const grouped = repayments.reduce<Record<string, number>>((acc, item) => {
      const key = new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
      acc[key] = (acc[key] || 0) + item.amount;
      return acc;
    }, {});

    return Object.entries(grouped).map(([month, amount]) => ({ month, amount }));
  }, [repayments]);

  const statusData = useMemo(() => {
    const grouped = repayments.reduce<Record<string, number>>((acc, item) => {
      const key = item.status || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [repayments]);

  const totalRepaymentAmount = useMemo(
    () => repayments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [repayments]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Repayment Charts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track repayment totals and approval status distribution.</p>
        </div>

        <button
          onClick={() => navigate('/repayments/view')}
          className="px-3 py-2 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to Repayments
        </button>
      </div>

      {!!fetchError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{fetchError}</span>
          <button onClick={fetchRepayments} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-gray-600 dark:text-gray-300">
          Loading charts...
        </div>
      ) : repayments.length === 0 ? (
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-gray-500 dark:text-gray-400">
          No repayment data available for charting.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Repayments</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{repayments.length}</p>
            </div>
            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{totalRepaymentAmount.toLocaleString()}</p>
            </div>
            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Status Buckets</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{statusData.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Monthly Repayment Volume</h2>
            <p className="sr-only" aria-live="polite">
              Monthly chart showing {monthlyData.length} months of repayment totals.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData} aria-label="Monthly repayment volume bar chart">
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Repayment Status Mix</h2>
            <p className="sr-only" aria-live="polite">
              Status pie chart with {statusData.length} repayment status categories.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart aria-label="Repayment status distribution pie chart">
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90}>
                  {statusData.map((item, index) => (
                    <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default RepaymentCharts;
