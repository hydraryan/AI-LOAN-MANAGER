import { useEffect, useState } from 'react';
import {
  Banknote, AlertTriangle,
  TrendingUp, TrendingDown, Calendar, ArrowRight,
  Activity,
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
import { getLoanScheduleStats, toHomeLoanStatus } from '../lib/loanStatus';
import { getCollateralLoanSummary } from '../lib/api/collateral';
import { getTermDeposits } from '../lib/api/termDeposits';
import CalendarMiniWidget from '../components/Calendar/CalendarMiniWidget';

type ScheduleItem = {
  dueDate?: string;
  amount?: number;
  status?: string;
  paidAmount?: number;
};

type LoanRow = {
  id: string;
  borrowerName: string;
  amount: number;
  releaseDate: string;
  status: 'Pending' | 'Open' | 'Fully Paid' | 'Defaulted' | 'Restructured';
  nextRepayment: string;
  amountPaid: number;
  isOverdue: boolean;
  daysOverdue: number;
  collateralCount: number;
  riskyCollateralCount: number;
  collateralValue: number;
};

type HomeMetrics = {
  todayCollection?: number;
  portfolioAtRisk?: number;
  collectionTrend?: Array<{ day: string; expected: number; actual: number }>;
  actionItems?: Array<{ label: string; count: number; value: number; critical?: boolean }>;
  overdueBuckets?: {
    d1to30?: number;
    d31to90?: number;
    d90plus?: number;
  };
};

type KpiCard = {
  label: string;
  value: string;
  change: number | null;
  trend: 'up' | 'down' | 'flat';
  color: string;
  bg: string;
};

type TermDepositAlert = {
  id: string;
  accountNumber: string;
  borrowerName: string;
  maturityDate: string;
  daysLeft: number;
};

const Home = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [homeMetrics, setHomeMetrics] = useState<HomeMetrics | null>(null);
  const [termDepositAlerts, setTermDepositAlerts] = useState<TermDepositAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const chartTickColor = isDark ? '#94A3B8' : '#64748B';
  const chartTooltipStyle = {
    borderRadius: '8px',
    border: 'none',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    color: isDark ? '#F8FAFC' : '#0F172A'
  };

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const [metricsResult, loansResult, termDepositsResult] = await Promise.allSettled([
          getHomeDashboardMetrics(),
          API.get('/loans?limit=300'),
          getTermDeposits({ status: 'Active', sort: 'maturityDate', order: 'asc', page: 1, limit: 100 })
        ]);

        const warnings: string[] = [];
        const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value : null;
        if (metricsResult.status === 'rejected') warnings.push('metrics');

        const rawLoans =
          loansResult.status === 'fulfilled' && Array.isArray((loansResult.value as any)?.data)
            ? (loansResult.value as any).data
            : [];
        if (loansResult.status === 'rejected') warnings.push('loan records');

        const depositData =
          termDepositsResult.status === 'fulfilled' && Array.isArray(termDepositsResult.value?.data)
            ? termDepositsResult.value.data
            : [];
        if (termDepositsResult.status === 'rejected') warnings.push('term deposits');

        const now = new Date();
        const maturityAlerts = depositData
          .map((deposit: any) => {
            const maturityDate = new Date(deposit.maturityDate);
            const daysLeft = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return {
              id: String(deposit.id || ''),
              accountNumber: String(deposit.accountNumber || ''),
              borrowerName: String(deposit.borrowerName || 'Unknown'),
              maturityDate: Number.isNaN(maturityDate.getTime()) ? '-' : maturityDate.toLocaleDateString(),
              daysLeft
            } as TermDepositAlert;
          })
          .filter((item) => item.daysLeft >= 0 && item.daysLeft <= 14)
          .sort((a, b) => a.daysLeft - b.daysLeft)
          .slice(0, 3);
        setTermDepositAlerts(maturityAlerts);

        const loanIds = (rawLoans || []).map((loan: any) => loan._id).filter(Boolean);
        let collateralSummary: Array<{ loanId: string; collateralCount: number; riskyCollateralCount: number; totalValue: number }> = [];

        if (loanIds.length > 0) {
          try {
            collateralSummary = await getCollateralLoanSummary(loanIds.slice(0, 1000));
          } catch {
            warnings.push('collateral summary');
          }
        }

        const collateralByLoanCount: Record<string, number> = {};
        const riskyCollateralByLoanCount: Record<string, number> = {};
        const collateralByLoanValue: Record<string, number> = {};

        for (const collateral of collateralSummary) {
          const loanId = collateral.loanId;
          if (!loanId) continue;

          collateralByLoanCount[loanId] = Number(collateral.collateralCount || 0);
          riskyCollateralByLoanCount[loanId] = Number(collateral.riskyCollateralCount || 0);
          collateralByLoanValue[loanId] = Number(collateral.totalValue || 0);
        }

        const today = new Date();
        const mappedLoans: LoanRow[] = (rawLoans || []).map((l: any) => {
          const scheduleItems: ScheduleItem[] = l.schedule || [];
          const stats = getLoanScheduleStats({ status: l.status, schedule: scheduleItems }, today);
          const amountPaid = stats.totalPaid;
          const nextDue = scheduleItems.find(
            (item: ScheduleItem) => Math.max(0, Number(item.amount || 0) - Number(item.paidAmount || 0)) > 0 && item.dueDate
          );
          const nextRepayment = nextDue?.dueDate ? new Date(nextDue.dueDate).toLocaleDateString() : 'Fully Paid';

          return {
            id: l._id,
            borrowerName: l.borrowerId?.userId?.name || l.borrowerId?.name || 'Unknown',
            amount: Number(l.principal || 0),
            releaseDate: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '-',
            status: toHomeLoanStatus({ status: l.status, schedule: scheduleItems }),
            nextRepayment,
            amountPaid,
            isOverdue: stats.hasOverdue,
            daysOverdue: stats.daysLate,
            collateralCount: Number(collateralByLoanCount[l._id] || 0),
            riskyCollateralCount: Number(riskyCollateralByLoanCount[l._id] || 0),
            collateralValue: Number(collateralByLoanValue[l._id] || 0)
          };
        });

        setHomeMetrics(metrics || null);
        setLoans(mappedLoans);

        if (warnings.length > 0) {
          setLoadError(`Dashboard loaded partially. Missing ${warnings.join(', ')}.`);
        }

        setLastSyncedAt(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      } catch (error) {
        console.error('Failed to load home data:', error);
        setLoadError('Failed to load dashboard data. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // Calculate real KPIs from loan data first
  const totalValue = loans.reduce((acc, loan) => acc + loan.amount, 0);
  const totalPaid = loans.reduce((acc, loan) => acc + loan.amountPaid, 0);
  const totalOutstanding = totalValue - totalPaid;
  const activeCount = loans.filter(l => l.status === 'Open' || l.status === 'Pending').length;
  const fullyPaidCount = loans.filter(l => l.status === 'Fully Paid').length;
  const defaultedLoans = loans.filter(l => l.status === 'Defaulted');
  const defaultedCount = defaultedLoans.length;
  const overdueAmount = defaultedLoans.reduce((acc, loan) => acc + (loan.amount - loan.amountPaid), 0);
  const linkedCollateralTotal = loans.reduce((acc, loan) => acc + loan.collateralCount, 0);
  const riskyCollateralLinks = loans.reduce((acc, loan) => acc + loan.riskyCollateralCount, 0);
  const loansWithCollateral = loans.filter((loan) => loan.collateralCount > 0).length;
  const collateralCoverageValue = loans.reduce((acc, loan) => acc + loan.collateralValue, 0);
  const parPercent = totalValue > 0 ? (overdueAmount / totalValue) * 100 : 0;
  const todayCollection = Number(homeMetrics?.todayCollection || 0);
  const displayPAR = parPercent > 0 ? parPercent : Number(homeMetrics?.portfolioAtRisk || 0);

  const activeShare = loans.length > 0 ? (activeCount / loans.length) * 100 : 0;
  const paidShare = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;
  const overdueShare = totalValue > 0 ? (overdueAmount / totalValue) * 100 : 0;
  const defaultedShare = loans.length > 0 ? (defaultedCount / loans.length) * 100 : 0;
  const fullyPaidShare = loans.length > 0 ? (fullyPaidCount / loans.length) * 100 : 0;

  // Derive overdue loans from computed overdue fields
  const overdueLoans = loans
    .filter(l => l.isOverdue || l.status === 'Defaulted')
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, 5)
    .map(l => ({
      id: l.id,
      name: l.borrowerName,
      amount: `₹${l.amount.toLocaleString()}`,
      daysOverdue: l.daysOverdue,
      collateralCount: l.collateralCount,
      riskyCollateralCount: l.riskyCollateralCount
    }));

  const recentActivity = loans
    .slice(-5)
    .reverse()
    .map(l => {
      let icon = CheckCircle;
      let color = 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30';

      if (l.status === 'Defaulted') {
        icon = AlertTriangle;
        color = 'text-rose-500 bg-rose-100 dark:bg-rose-900/30';
      } else if (l.status === 'Fully Paid') {
        icon = Banknote;
        color = 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      }

      return {
        type: 'loan',
        text: `${l.borrowerName} — ${l.status}`,
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
    if (value === null || Number.isNaN(value)) return '';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const overdueBucketFromLoans = {
    d1to30: defaultedLoans
      .filter((l) => l.daysOverdue >= 1 && l.daysOverdue <= 30)
      .reduce((a, l) => a + (l.amount - l.amountPaid), 0),
    d31to90: defaultedLoans
      .filter((l) => l.daysOverdue >= 31 && l.daysOverdue <= 90)
      .reduce((a, l) => a + (l.amount - l.amountPaid), 0),
    d90plus: defaultedLoans
      .filter((l) => l.daysOverdue > 90)
      .reduce((a, l) => a + (l.amount - l.amountPaid), 0)
  };

  const displayOverdueBuckets = {
    d1to30: overdueBucketFromLoans.d1to30 > 0 ? overdueBucketFromLoans.d1to30 : Number(homeMetrics?.overdueBuckets?.d1to30 || 0),
    d31to90: overdueBucketFromLoans.d31to90 > 0 ? overdueBucketFromLoans.d31to90 : Number(homeMetrics?.overdueBuckets?.d31to90 || 0),
    d90plus: overdueBucketFromLoans.d90plus > 0 ? overdueBucketFromLoans.d90plus : Number(homeMetrics?.overdueBuckets?.d90plus || 0)
  };

  const KPI_DATA: KpiCard[] = [
    { label: 'Total Active Loans', value: activeCount.toString(), change: activeShare, trend: activeShare >= 0 ? 'up' : 'down', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Loan Portfolio Value', value: `₹${(totalValue / 100000).toFixed(1)} L`, change: paidShare, trend: paidShare >= 0 ? 'up' : 'down', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Total Outstanding', value: `₹${(totalOutstanding / 100000).toFixed(1)} L`, change: null, trend: 'flat', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    {
      label: 'Today\'s Collection',
      value: `₹${(todayCollection / 100000).toFixed(1)} L`,
      change: collectionChangePct,
      trend: collectionChangePct === null ? 'flat' : collectionChangePct >= 0 ? 'up' : 'down',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    { label: 'Overdue Amount', value: `₹${(overdueAmount / 100000).toFixed(1)} L`, change: overdueShare, trend: overdueShare > 0 ? 'up' : 'flat', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { label: 'Portfolio at Risk (PAR)', value: `${displayPAR.toFixed(1)}%`, change: null, trend: 'flat', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' },
    { label: 'Defaulted Loans', value: defaultedCount.toString(), change: defaultedShare, trend: defaultedShare > 0 ? 'up' : 'flat', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { label: 'Fully Paid Loans', value: fullyPaidCount.toString(), change: fullyPaidShare, trend: fullyPaidShare >= 0 ? 'up' : 'down', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { label: 'Loans With Collateral', value: loansWithCollateral.toString(), change: loans.length > 0 ? (loansWithCollateral / loans.length) * 100 : 0, trend: 'up', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Collateral Coverage', value: `₹${(collateralCoverageValue / 100000).toFixed(1)} L`, change: null, trend: 'flat', color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
    { label: 'Risky Collateral Links', value: riskyCollateralLinks.toString(), change: linkedCollateralTotal > 0 ? (riskyCollateralLinks / linkedCollateralTotal) * 100 : 0, trend: riskyCollateralLinks > 0 ? 'up' : 'flat', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' }
  ];

  const dueTodayCount = loans.filter((l) => l.isOverdue).length;

  const LOAN_STATUS_DATA = [
    { name: 'Active', value: activeCount, color: '#10B981' },
    { name: 'Overdue', value: dueTodayCount, color: '#F59E0B' },
    { name: 'Fully Paid', value: fullyPaidCount, color: '#64748B' },
    { name: 'Defaulted', value: defaultedCount, color: '#EF4444' },
  ];

  const COLLECTION_DATA = homeMetrics?.collectionTrend || [];
  const ACTION_ITEMS = (homeMetrics?.actionItems || []).map((item) => ({
    ...item,
    count: Number(item.count || 0).toLocaleString(),
    value: `₹${(Number(item.value || 0) / 100000).toFixed(1)} L`
  }));

  const actionRouteForLabel = (label: string) => {
    const normalized = String(label || '').toLowerCase();
    if (normalized.includes('due today') || normalized.includes('missed')) return '/collections/daily';
    if (normalized.includes('pending approval')) return '/loans/approve';
    if (normalized.includes('repayments waiting')) return '/repayments/approve';
    return '/reports/overview';
  };

  const actionItemsRaw = homeMetrics?.actionItems || [];
  const pendingApprovalsCount = Number(
    actionItemsRaw.find((item) => String(item.label || '').toLowerCase().includes('pending approval'))?.count || 0
  );
  const missedRepaymentsCount = Number(
    actionItemsRaw.find((item) => String(item.label || '').toLowerCase().includes('missed'))?.count || 0
  );
  const dueTodayActionCount = Number(
    actionItemsRaw.find((item) => String(item.label || '').toLowerCase().includes('due today'))?.count || 0
  );

  const latestTrend = COLLECTION_DATA[COLLECTION_DATA.length - 1];
  const latestExpectedCollection = Number(latestTrend?.expected || 0);
  const latestActualCollection = Number(latestTrend?.actual || 0);
  const collectionPerformancePct =
    latestExpectedCollection > 0 ? Math.min(140, (latestActualCollection / latestExpectedCollection) * 100) : null;

  const KPI_PRIMARY = KPI_DATA.slice(0, 4);
  const KPI_SECONDARY = KPI_DATA.slice(4);

  return (
    <div className="space-y-6 pb-10">

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
          {loadError}
        </div>
      )}

      {lastSyncedAt && (
        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
          Last synced at {lastSyncedAt}
        </div>
      )}

      {/* 1. KPI Cards (Top Row) */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-8 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KPI_PRIMARY.map((kpi, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 flex items-start justify-between">
                  <p className="line-clamp-2 min-h-[2.5em] text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.label}</p>
                  {kpi.change !== null && (
                    <span className={cn('flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold', kpi.bg, kpi.color)}>
                      {formatChange(kpi.change)}
                      {kpi.trend === 'up' && <TrendingUp size={8} />}
                      {kpi.trend === 'down' && <TrendingDown size={8} />}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {KPI_SECONDARY.map((kpi, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-2 flex items-start justify-between">
                  <p className="line-clamp-2 min-h-[2.5em] text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.label}</p>
                  {kpi.change !== null && (
                    <span className={cn('flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold', kpi.bg, kpi.color)}>
                      {formatChange(kpi.change)}
                      {kpi.trend === 'up' && <TrendingUp size={8} />}
                      {kpi.trend === 'down' && <TrendingDown size={8} />}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{kpi.value}</h3>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Operational Snapshot</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
              <p className="text-[11px] text-blue-700 dark:text-blue-300">Approvals</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{pendingApprovalsCount.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-rose-50 p-3 text-center dark:bg-rose-900/20">
              <p className="text-[11px] text-rose-700 dark:text-rose-300">Missed</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{missedRepaymentsCount.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-900/20">
              <p className="text-[11px] text-amber-700 dark:text-amber-300">Due Today</p>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{dueTodayActionCount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Collection Performance</h3>
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-2 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ) : collectionPerformancePct === null ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No expected target available yet.</p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Actual vs expected</span>
                <span className="font-semibold text-slate-900 dark:text-white">{collectionPerformancePct.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full ${collectionPerformancePct >= 100 ? 'bg-emerald-500' : collectionPerformancePct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(collectionPerformancePct, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Actual: ₹{(latestActualCollection / 100000).toFixed(1)} L</span>
                <span>Expected: ₹{(latestExpectedCollection / 100000).toFixed(1)} L</span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">Maturing Term Deposits</h3>
            <button onClick={() => navigate('/savings/term-deposits/view')} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">Open</button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-9 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              ))}
            </div>
          ) : termDepositAlerts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No term deposits maturing in the next 14 days.</p>
          ) : (
            <div className="space-y-2">
              {termDepositAlerts.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 px-3 py-2 text-xs dark:border-gray-700">
                  <p className="font-semibold text-slate-900 dark:text-white">{item.borrowerName}</p>
                  <p className="text-gray-500 dark:text-gray-400">{item.accountNumber} | {item.maturityDate}</p>
                  <p className="mt-0.5 font-medium text-amber-700 dark:text-amber-300">{item.daysLeft} day(s) left</p>
                </div>
              ))}
            </div>
          )}
        </div>
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
                <div className="h-52 w-full sm:h-64">
                  {loading ? (
                    <div className="grid h-52 place-items-center rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40 sm:h-64">
                      <div className="space-y-2 text-center">
                        <div className="mx-auto h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="mx-auto h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    </div>
                  ) : COLLECTION_DATA.length === 0 ? (
                    <div className="flex h-52 items-center justify-center sm:h-64">
                      <p className="text-sm text-gray-400 dark:text-gray-500">Collection trend data will appear here</p>
                    </div>
                  ) : (
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
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTickColor }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: chartTickColor }} tickFormatter={(value) => `₹${value / 1000}k`} />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                          labelStyle={{ color: isDark ? '#CBD5E1' : '#334155' }}
                        />
                        <Area type="monotone" dataKey="expected" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorExpected)" name="Expected" />
                        <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActual)" name="Actual" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
             </div>

             {/* Loan Status Distribution */}
             <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                   <PieChart size={18} className="text-emerald-500" />
                   Loan Status
                </h3>
               {loading ? (
                <div className="grid flex-1 place-items-center rounded-lg border border-gray-100 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-900/40">
                  <div className="h-32 w-32 animate-pulse rounded-full border-8 border-gray-200 dark:border-gray-700" />
                </div>
               ) : (
                <>
                  <div className="relative min-h-50 flex-1">
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
                        <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: isDark ? '#CBD5E1' : '#334155' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <span className="block text-2xl font-bold text-slate-900 dark:text-white">{loans.length.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Total Loans</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {LOAN_STATUS_DATA.map((item) => (
                       <div key={item.name} className="flex items-center gap-2 text-xs">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-gray-600 dark:text-gray-300">{item.name} ({item.value})</span>
                       </div>
                    ))}
                  </div>
                </>
               )}
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
                  onClick={() => navigate('/loans/arrears')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                    View All <ArrowRight size={14} />
                </button>
             </div>
             
             {/* Summary Pills */}
             <div className="grid grid-cols-1 gap-3 p-5 pb-2 sm:grid-cols-3 sm:gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                    <p className="text-xs text-yellow-700 dark:text-yellow-500 font-semibold mb-1">1-30 Days</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">₹{(displayOverdueBuckets.d1to30 / 100000).toFixed(1)} L</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                    <p className="text-xs text-orange-700 dark:text-orange-500 font-semibold mb-1">31-90 Days</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">₹{(displayOverdueBuckets.d31to90 / 100000).toFixed(1)} L</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                    <p className="text-xs text-red-700 dark:text-red-500 font-semibold mb-1">90+ Days</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">₹{(displayOverdueBuckets.d90plus / 100000).toFixed(1)} L</p>
                </div>
             </div>

             <div className="md:hidden">
                {loading ? (
                  <div className="space-y-3 p-5 pt-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="animate-pulse rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                        <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                        <div className="mt-2 h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                    ))}
                  </div>
                ) : overdueLoans.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {overdueLoans.map((loan) => (
                      <div key={loan.id} className="space-y-2 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{loan.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Loan #{loan.id}</p>
                          </div>
                          <span className={cn(
                            'rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide',
                            loan.daysOverdue > 90 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            loan.daysOverdue > 30 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          )}>
                            {loan.daysOverdue === 0 ? 'Today' : `${loan.daysOverdue} Days`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                          <span>Amount: <strong className="text-slate-900 dark:text-white">{loan.amount}</strong></span>
                          <span>Collateral: <strong className="text-slate-900 dark:text-white">{loan.collateralCount}</strong></span>
                        </div>
                        <button
                          onClick={() => navigate('/collections/sms')}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          Call borrower
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No overdue loans found. Great job!
                  </div>
                )}
             </div>

             <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
                        <tr>
                            <th className="px-5 py-3">Loan ID</th>
                            <th className="px-5 py-3">Borrower</th>
                            <th className="px-5 py-3 text-right">Amount</th>
                            <th className="px-5 py-3 text-center">Collateral</th>
                            <th className="px-5 py-3 text-center">Overdue by</th>
                            <th className="px-5 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {loading ? (
                          Array.from({ length: 4 }).map((_, idx) => (
                            <tr key={`s-${idx}`}>
                              <td className="px-5 py-3" colSpan={6}>
                                <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                              </td>
                            </tr>
                          ))
                        ) : overdueLoans.length > 0 ? (
                          overdueLoans.map((loan) => (
                            <tr key={loan.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{loan.id}</td>
                              <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{loan.name}</td>
                              <td className="px-5 py-3 text-right font-bold text-slate-900 dark:text-white">{loan.amount}</td>
                              <td className="px-5 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{loan.collateralCount}</span>
                                  {loan.riskyCollateralCount > 0 && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                      {loan.riskyCollateralCount} risky
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span className={cn(
                                  'rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide',
                                  loan.daysOverdue > 90 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  loan.daysOverdue > 30 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                )}>
                                  {loan.daysOverdue === 0 ? 'Today' : `${loan.daysOverdue} Days`}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button
                                  onClick={() => navigate('/collections/sms')}
                                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                >
                                  Call
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
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
            
            {/* 3. Calendar Mini Widget */}
            <CalendarMiniWidget />

            {/* 4. Today's Action Panel */}
            <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-5 text-white shadow-lg shadow-slate-200/50 dark:shadow-none">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                    <Calendar size={18} className="text-blue-400" />
                    Today's Actions
                </h3>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="animate-pulse rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="h-3 w-2/3 rounded bg-white/20" />
                        <div className="mt-2 h-5 w-1/3 rounded bg-white/20" />
                      </div>
                    ))}
                  </div>
                ) : ACTION_ITEMS.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <Clock size={24} className="mx-auto mb-2 opacity-40" />
                    Action items will appear here once data is available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ACTION_ITEMS.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigate(actionRouteForLabel(item.label))}
                        className="group flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
                      >
                        <div>
                          <p className={cn('text-xs font-medium', item.critical ? 'text-red-300' : 'text-gray-300')}>{item.label}</p>
                          <p className="text-xl font-bold mt-0.5 group-hover:text-blue-300 transition-colors">{item.count}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-100">{item.value}</p>
                          <ArrowRight size={14} className="ml-auto mt-1 text-gray-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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

                    {loading
                      ? Array.from({ length: 4 }).map((_, idx) => (
                        <div key={idx} className="relative pl-10">
                          <div className="absolute left-0 top-0 h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                          <div className="space-y-2">
                            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                            <div className="h-2 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                          </div>
                        </div>
                      ))
                      : recentActivity.map((activity, idx) => (
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

                    {!loading && recentActivity.length === 0 && (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No recent activity</p>
                    )}
                </div>
                  <button
                    onClick={() => navigate('/loans/view')}
                    className="w-full mt-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border-t border-gray-100 dark:border-gray-700 transition-colors"
                  >
                    View All Activity
                 </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Home;