import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from "recharts";
import { DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";
import { getDashboardStats } from "../../lib/api/report";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const ReportsOverview = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getDashboardStats();
      setStats(data);
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Reports Dashboard</h1>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">

        <div className="p-4 border rounded">
          <DollarSign />
          <h3>₹{stats?.totalDisbursement?.toLocaleString()}</h3>

          {/* ✅ TrendingUp used */}
          <p className="text-xs text-green-600 flex items-center">
            <TrendingUp size={12} className="mr-1" />
            Growth
          </p>
        </div>

        <div className="p-4 border rounded">
          <Users />
          <h3>{stats?.activeBorrowers}</h3>

          <p className="text-xs text-green-600 flex items-center">
            <TrendingUp size={12} className="mr-1" />
            Active users
          </p>
        </div>

        <div className="p-4 border rounded">
          <AlertCircle />
          <h3>--</h3>
        </div>

        <div className="p-4 border rounded">
          <DollarSign />
          <h3>₹{stats?.totalSavings?.toLocaleString()}</h3>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={stats?.loanStatus || []} dataKey="value">
            {(stats?.loanStatus || []).map((_: any, i: number) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

    </div>
  );
};

export default ReportsOverview;