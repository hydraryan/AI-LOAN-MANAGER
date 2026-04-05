import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from "recharts";
import { DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";
import { getDashboardStats } from "../../lib/api/report";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

type OverviewStats = {
  totalDisbursement?: number;
  totalSavings?: number;
  activeBorrowers?: number;
  loanStatus?: Array<{ name?: string; value?: number }>;
};

const ReportsOverview = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalLoans = (stats?.loanStatus || []).reduce(
    (sum: number, item: { value?: number }) => sum + Number(item?.value || 0),
    0
  );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load overview metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6 dark:bg-gray-900 dark:text-white">

      <h1 className="text-2xl font-bold dark:text-white">Lending Overview</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/reports/loans')}
          className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
        >
          Loan Report
        </button>
        <button
          onClick={() => navigate('/reports/collections')}
          className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        >
          Collections Report
        </button>
        <button
          onClick={() => navigate('/reports/par')}
          className="rounded border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          PAR Report
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="p-4 border rounded bg-white dark:bg-gray-800 dark:border-gray-700">
          <DollarSign className="dark:text-gray-300" />
          <h3 className="dark:text-white">₹{Number(stats?.totalDisbursement || 0).toLocaleString()}</h3>

          {/* ✅ TrendingUp used */}
          <p className="text-xs text-green-600 flex items-center">
            <TrendingUp size={12} className="mr-1" />
            Growth
          </p>
        </div>

        <div className="p-4 border rounded bg-white dark:bg-gray-800 dark:border-gray-700">
          <Users className="dark:text-gray-300" />
          <h3 className="dark:text-white">{Number(stats?.activeBorrowers || 0)}</h3>

          <p className="text-xs text-green-600 flex items-center">
            <TrendingUp size={12} className="mr-1" />
            Active users
          </p>
        </div>

        <div className="p-4 border rounded bg-white dark:bg-gray-800 dark:border-gray-700">
          <AlertCircle className="dark:text-gray-300" />
          <h3 className="dark:text-white">{totalLoans}</h3>
          <p className="text-xs text-gray-500">Total Loans</p>
        </div>

        <div className="p-4 border rounded bg-white dark:bg-gray-800 dark:border-gray-700">
          <DollarSign className="dark:text-gray-300" />
          <h3 className="dark:text-white">₹{Number(stats?.totalSavings || 0).toLocaleString()}</h3>
          <p className="text-xs text-gray-500">Total Savings</p>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-[300px] animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      ) : (stats?.loanStatus || []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          No loan-status breakdown available yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={stats?.loanStatus || []} dataKey="value">
              {(stats?.loanStatus || []).map((_, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}

    </div>
  );
};

export default ReportsOverview;