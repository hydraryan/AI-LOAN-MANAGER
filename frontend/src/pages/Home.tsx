import { useEffect, useState } from 'react';
import { 
  CreditCard, Banknote, AlertTriangle, 
  TrendingUp, TrendingDown, Calendar, ArrowRight,
  Activity, UserPlus, Upload, MessageSquare, 
  CheckCircle, Clock, PieChart, AlertOctagon
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Pie, Cell, AreaChart, Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import API from '../lib/api/api';
import { getHomeDashboardMetrics } from '../lib/api/report';

type LoanRow = {
  id: string;
  borrowerName: string;
  amount: number;
  releaseDate: string;
  status: 'Pending' | 'Open' | 'Fully Paid' | 'Defaulted' | 'Restructured';
  nextRepayment: string;
  amountPaid: number;
};

const Home = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [homeMetrics, setHomeMetrics] = useState<any>(null);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [metrics, loansRes] = await Promise.all([
          getHomeDashboardMetrics(),
          API.get('/loans')
        ]);

        const mappedLoans: LoanRow[] = (loansRes.data || []).map((l: any) => {
          const amountPaid = l.schedule?.reduce((acc: number, item: any) => acc + Number(item.paidAmount || 0), 0) || 0;
          const nextDue = l.schedule?.find((item: any) => item.status === 'pending');
          const nextRepayment = nextDue ? new Date(nextDue.dueDate).toLocaleDateString() : 'Fully Paid';

          const mapLoanStatus = (rawStatus: string | undefined): LoanRow['status'] => {
            switch ((rawStatus || '').toLowerCase()) {
              case 'approved':
                return 'Open';
              case 'pending':
                return 'Pending';
              case 'closed':
              case 'paid':
                return 'Fully Paid';
              case 'defaulted':
              case 'overdue':
                return 'Defaulted';
              case 'restructured':
                return 'Restructured';
              default:
                return 'Pending';
            }
          };

          return {
            id: l._id,
            borrowerName: l.borrowerId?.userId?.name || l.borrowerId?.name || 'Unknown',
            amount: Number(l.principal || 0),
            releaseDate: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '-',
            status: mapLoanStatus(l.status),
            nextRepayment,
            amountPaid
          };
        });

        setHomeMetrics(metrics);
        setLoans(mappedLoans);
      } catch (error) {
        console.error('Failed to load home data:', error);
      }
    };

    loadHomeData();
  }, []);

  // Calculate Real KPIs
  const totalValue = loans.reduce((acc, loan) => acc + loan.amount, 0);
  const totalOutstanding = loans.reduce((acc, loan) => acc + (loan.amount - loan.amountPaid), 0);
  const defaultedCount = loans.filter(l => l.status === 'Defaulted').length;
  const activeCount = loans.filter(l => l.status === 'Open' || l.status === 'Pending').length;
  const fullyPaidCount = loans.filter(l => l.status === 'Fully Paid').length;

  // Derive Overdue Loans (real logic based on status)
  const overdueLoans = loans
    .filter(l => l.status === 'Defaulted' || (l.nextRepayment && l.nextRepayment.includes('Overdue')))
    .slice(0, 5)
    .map(l => ({
        id: l.id,
        name: l.borrowerName,
        amount: `₹${l.amount.toLocaleString()}`,
        days: 0, // Days overdue calculation requires scheduled dates
        status: 'Overdue'
    }));
  
  const overdueAmount = loans
    .filter(l => l.status === 'Defaulted')
    .reduce((acc, l) => acc + (l.amount - l.amountPaid), 0);

  const recentActivity = loans
      .slice(-5)
      .reverse()
      .map(l => {
          let icon = CheckCircle;
          let color = 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';
          let text = `Loan #${l.id} approved`;

          if (l.status === 'Defaulted') {
              icon = AlertTriangle;
              color = 'text-rose-500 bg-rose-100 dark:bg-rose-900/30';
              text = `Loan #${l.id} Defaulted`;
          } else if (l.status === 'Fully Paid') {
              icon = Banknote;
              color = 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
              text = `Loan #${l.id} Paid`;
          }

          return {
              type: 'loan',
              text,
              time: l.releaseDate,
              icon,
              color
          };
      });

  const collectionTrend = homeMetrics?.collectionTrend || [];
  const latestCollectionActual = Number(collectionTrend[collectionTrend.length - 1]?.actual || 0);
  const previousCollectionActual = Number(collectionTrend[collectionTrend.length - 2]?.actual || 0);
  const collectionChangePct =
    previousCollectionActual > 0
      ? ((latestCollectionActual - previousCollectionActual) / previousCollectionActual) * 100
      : null;

  const formatChange = (value: number | null) => {
    if (value === null || Number.isNaN(value)) {
      return 'N/A';
    }

    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const KPI_DATA = [
    { label: 'Total Active Loans', value: activeCount.toString(), change: formatChange(null), trend: 'flat', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Loan Portfolio Value', value: `₹${(totalValue/100000).toFixed(1)} L`, change: formatChange(null), trend: 'flat', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Outstanding', value: `₹${(totalOutstanding/100000).toFixed(1)} L`, change: formatChange(null), trend: 'flat', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    {
      label: 'Today\'s Collection',
      value: `₹${(((homeMetrics?.todayCollection || 0) as number)/100000).toFixed(1)} L`,
      change: formatChange(collectionChangePct),
      trend: collectionChangePct === null ? 'flat' : collectionChangePct >= 0 ? 'up' : 'down',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    { label: 'Overdue Amount', value: `₹${(overdueAmount/100000).toFixed(1)} L`, change: formatChange(null), trend: 'flat', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { label: 'Portfolio at Risk (PAR)', value: `${((homeMetrics?.portfolioAtRisk || 0) as number).toFixed(1)}%`, change: formatChange(null), trend: 'flat', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' },
    { label: 'Defaulted Loans', value: defaultedCount.toString(), change: formatChange(null), trend: 'flat', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ];

  const LOAN_STATUS_DATA = [
    { name: 'Active', value: activeCount, color: '#10B981' }, 
    { name: 'Due Today', value: Number(homeMetrics?.actionItems?.[0]?.count || 0), color: '#3B82F6' },
    { name: 'Overdue', value: overdueLoans.length, color: '#F59E0B' },
    { name: 'Fully Paid', value: fullyPaidCount, color: '#64748B' },
    { name: 'Defaulted', value: defaultedCount, color: '#EF4444' },
  ];
  
  const COLLECTION_DATA = homeMetrics?.collectionTrend || [];
  const ACTION_ITEMS = (homeMetrics?.actionItems || []).map((item: any) => ({
    ...item,
    count: Number(item.count || 0).toLocaleString(),
    value: `₹${(Number(item.value || 0) / 100000).toFixed(1)} L`
  }));

  return (
    <div className="space-y-6 pb-10">
      
      {/* 1. KPI Cards (Top Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {KPI_DATA.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5em]">{kpi.label}</p>
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5", kpi.bg, kpi.color)}>
                {kpi.change}
                {kpi.trend === 'up' && <TrendingUp size={8} />}
                {kpi.trend === 'down' && <TrendingDown size={8} />}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column (Charts & Tables) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* 2. Collection Trend & 3. Loan Status Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Collection Trend */}
             <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp size={18} className="text-blue-500" />
                      Collection Trend
                   </h3>
                   <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 text-xs font-medium">
                      <button className="px-3 py-1 bg-white dark:bg-gray-600 rounded-md shadow-sm text-slate-900 dark:text-white">7 Days</button>
                      <button className="px-3 py-1 text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white">30 Days</button>
                   </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={COLLECTION_DATA}>
                      <defs>
                        <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748B'}} tickFormatter={(value) => `₹${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: 'rgba(255, 255, 255, 0.9)' }}
                        itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                      />
                      <Area type="monotone" dataKey="expected" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorExpected)" name="Expected" />
                      <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" name="Actual" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Loan Status Distribution */}
             <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                   <PieChart size={18} className="text-emerald-500" />
                   Loan Status
                </h3>
                <div className="flex-1 min-h-50 relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={LOAN_STATUS_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                         >
                            {LOAN_STATUS_DATA.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                   {/* Center Text */}
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                         <span className="block text-2xl font-bold text-slate-900 dark:text-white">{loans.length.toLocaleString()}</span>
                         <span className="text-xs text-gray-500 dark:text-gray-400">Total Loans</span>
                      </div>
                   </div>
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                    {LOAN_STATUS_DATA.map((item) => (
                        <div key={item.name} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-gray-600 dark:text-gray-300">{item.name} ({item.value})</span>
                        </div>
                    ))}
                </div>
             </div>
          </div>

          {/* 5. Risk & Overdue Snapshot */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertOctagon size={18} className="text-rose-500" />
                    Risk & Overdue Snapshot
                </h3>
                <button 
                  onClick={() => navigate('/loans/overdue')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    View All <ArrowRight size={14} />
                </button>
             </div>
             
             {/* Summary Pills */}
             <div className="grid grid-cols-3 gap-4 p-5 pb-2">
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 font-semibold mb-1">1-30 Days</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">₹{(((homeMetrics?.overdueBuckets?.d1to30 || 0) as number) / 100000).toFixed(1)} L</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                    <p className="text-xs text-orange-700 dark:text-orange-500 font-semibold mb-1">31-90 Days</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">₹{(((homeMetrics?.overdueBuckets?.d31to90 || 0) as number) / 100000).toFixed(1)} L</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                    <p className="text-xs text-red-700 dark:text-red-500 font-semibold mb-1">90+ Days</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">₹{(((homeMetrics?.overdueBuckets?.d90plus || 0) as number) / 100000).toFixed(1)} L</p>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
                        <tr>
                            <th className="px-5 py-3">Loan ID</th>
                            <th className="px-5 py-3">Borrower</th>
                            <th className="px-5 py-3 text-right">Amount</th>
                            <th className="px-5 py-3 text-center">Overdue by</th>
                            <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {overdueLoans.length > 0 ? (
                            overdueLoans.map((loan) => (
                                <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{loan.id}</td>
                                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{loan.name}</td>
                                    <td className="px-5 py-3 text-right font-bold text-slate-900 dark:text-white">{loan.amount}</td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                            loan.days > 90 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                            loan.days > 30 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        )}>
                                            {loan.days} Days
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                        <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">Call</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No overdue loans found. Great job!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
          </div>

        </div>

        {/* Right Column (Action, Feed, Buttons) */}
        <div className="space-y-6">
            
            {/* 4. Today's Action Panel */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-5 text-white shadow-lg shadow-slate-200/50 dark:shadow-none">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-blue-400" />
                    Today's Actions
                </h3>
                <div className="space-y-3">
                    {ACTION_ITEMS.map((item: { critical?: boolean; label: string; count: string; value: string }, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group">
                             <div>
                                 <p className={cn("text-xs font-medium", item.critical ? "text-red-300" : "text-gray-300")}>{item.label}</p>
                                 <p className="text-xl font-bold mt-0.5 group-hover:text-blue-300 transition-colors">{item.count}</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-sm font-semibold text-gray-100">{item.value}</p>
                                 <ArrowRight size={14} className="ml-auto mt-1 text-gray-500 group-hover:translate-x-1 transition-transform" />
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 7. Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => navigate('/borrowers/add')} className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-200/50 flex flex-col items-center justify-center gap-2 transition-all">
                    <UserPlus size={20} />
                    <span className="text-xs font-bold">Add Borrower</span>
                </button>
                <button onClick={() => navigate('/loans/add')} className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-lg shadow-emerald-200/50 flex flex-col items-center justify-center gap-2 transition-all">
                    <CreditCard size={20} />
                    <span className="text-xs font-bold">Add Loan</span>
                </button>
                <button onClick={() => alert('Record Repayment Modal')} className="p-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-slate-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 transition-all">
                    <Banknote size={20} />
                    <span className="text-xs font-medium">Repayment</span>
                </button>
                <button onClick={() => alert('Upload CSV Modal')} className="p-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-slate-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 transition-all">
                    <Upload size={20} />
                    <span className="text-xs font-medium">Upload CSV</span>
                </button>
                 <button onClick={() => alert('Send SMS Modal')} className="col-span-2 p-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-slate-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-center gap-2 transition-all">
                    <MessageSquare size={16} />
                    <span className="text-xs font-medium">Send SMS Reminders</span>
                </button>
            </div>

            {/* 6. Recent Activity Feed */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                 <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-slate-500" />
                    Recent Activity
                </h3>
                <div className="space-y-6 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-100 dark:bg-gray-700"></div>

                    {recentActivity.map((activity, idx) => (
                        <div key={idx} className="relative pl-10">
                             <div className={cn("absolute left-0 top-0 h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-800", activity.color)}>
                                 <activity.icon size={14} />
                             </div>
                             <div>
                                 <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{activity.text}</p>
                                 <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    <Clock size={10} /> {activity.time}
                                 </span>
                             </div>
                        </div>
                    ))}
                </div>
                 <button className="w-full mt-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border-t border-gray-100 dark:border-gray-700 transition-colors">
                    View All Activity
                 </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Home;