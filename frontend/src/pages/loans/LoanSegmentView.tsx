import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';
import { getLoanScheduleStats, getLoanStatusLabel, normalizeLoanStatus } from '../../lib/loanStatus';
import { getCollateralLoanSummary } from '../../lib/api/collateral';

type Loan = {
  _id: string;
  borrowerId?: {
    name?: string;
    userId?: {
      name?: string;
      email?: string;
    };
  };
  principal: number;
  status: string;
  createdAt: string;
  schedule: {
    dueDate: string;
    amount: number;
    paidAmount: number;
    status: string;
  }[];
};

export type LoanSegment =
  | 'approve'
  | 'due'
  | 'missed'
  | 'arrears'
  | 'no-repayments'
  | 'past-maturity'
  | 'principal-outstanding'
  | 'late-1-month'
  | 'late-3-months';

type LoanSegmentViewProps = {
  title: string;
  description: string;
  segment: LoanSegment;
};

const getLoanStats = (loan: Loan, now: Date) => {
  return getLoanScheduleStats(loan, now);
};

const segmentMatcher: Record<LoanSegment, (loan: Loan, now: Date) => boolean> = {
  approve: (loan) => normalizeLoanStatus(loan.status) === 'pending',
  due: (loan, now) => getLoanStats(loan, now).dueSoon,
  missed: (loan, now) => getLoanStats(loan, now).hasMissed,
  arrears: (loan, now) => getLoanStats(loan, now).daysLate > 0,
  'no-repayments': (loan, now) => getLoanStats(loan, now).totalPaid <= 0,
  'past-maturity': (loan, now) => getLoanStats(loan, now).pastMaturity,
  'principal-outstanding': (loan, now) => getLoanStats(loan, now).outstanding > 0,
  'late-1-month': (loan, now) => {
    const { daysLate } = getLoanStats(loan, now);
    return daysLate >= 30 && daysLate < 90;
  },
  'late-3-months': (loan, now) => getLoanStats(loan, now).daysLate >= 90
};

const LoanSegmentView = ({ title, description, segment }: LoanSegmentViewProps) => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanCollateralCountMap, setLoanCollateralCountMap] = useState<Record<string, number>>({});
  const [loanCollateralRiskMap, setLoanCollateralRiskMap] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const res = await API.get<Loan[]>('/loans');
      setLoans(res.data);

      const loanIds = (res.data || []).map((loan) => loan._id).filter(Boolean);
      const collateralSummary = await getCollateralLoanSummary(loanIds);

      const nextCountMap: Record<string, number> = {};
      const nextRiskMap: Record<string, number> = {};

      for (const item of collateralSummary) {
        const loanId = item.loanId;
        if (!loanId) continue;
        nextCountMap[loanId] = Number(item.collateralCount || 0);
        nextRiskMap[loanId] = Number(item.riskyCollateralCount || 0);
      }

      setLoanCollateralCountMap(nextCountMap);
      setLoanCollateralRiskMap(nextRiskMap);
    } catch (err) {
      console.error(err);
      setFetchError('Failed to load loans for this segment. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [segment]);

  const filtered = useMemo(() => {
    const now = new Date();

    return loans
      .filter((loan) => segmentMatcher[segment](loan, now))
      .filter((loan) => {
        const borrowerName = loan.borrowerId?.userId?.name || loan.borrowerId?.name || '';
        const needle = searchTerm.toLowerCase();
        return borrowerName.toLowerCase().includes(needle) || loan._id.toLowerCase().includes(needle);
      });
  }, [loans, segment, searchTerm]);

  const summary = useMemo(() => {
    const now = new Date();
    const stats = filtered.map((loan) => getLoanStats(loan, now));

    return {
      count: filtered.length,
      outstanding: stats.reduce((sum, item) => sum + item.outstanding, 0),
      paid: stats.reduce((sum, item) => sum + item.totalPaid, 0),
      lateCount: stats.filter((item) => item.daysLate > 0).length,
      linkedCollateral: filtered.reduce((sum, loan) => sum + Number(loanCollateralCountMap[loan._id] || 0), 0),
      riskyCollateralLinks: filtered.reduce((sum, loan) => sum + Number(loanCollateralRiskMap[loan._id] || 0), 0)
    };
  }, [filtered, loanCollateralCountMap, loanCollateralRiskMap]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>

        <button
          onClick={() => navigate('/loans/view')}
          className="px-3 py-2 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-200"
        >
          Back to All Loans
        </button>
      </div>

      {!!fetchError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{fetchError}</span>
          <button onClick={fetchLoans} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Matching Loans</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.count}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Outstanding</p>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-300">₹{summary.outstanding.toLocaleString()}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Paid So Far</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">₹{summary.paid.toLocaleString()}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Late Loans</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.lateCount}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Linked Collateral</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary.linkedCollateral}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Risky Links</p>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-300">{summary.riskyCollateralLinks}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded border dark:border-gray-700">
        <input
          placeholder="Search by borrower or loan ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-gray-600 dark:text-gray-300">Loading segment data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-gray-500 dark:text-gray-400 space-y-2">
            <p>No loans currently match this segment.</p>
            <p className="text-sm">Try changing the search term or switch back to the full loans list to inspect other statuses.</p>
          </div>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Loan ID</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Borrower</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Principal</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Status</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Outstanding</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Days Late</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Collateral</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((loan) => {
                const stats = getLoanStats(loan, new Date());
                const collateralCount = Number(loanCollateralCountMap[loan._id] || 0);
                const riskyCount = Number(loanCollateralRiskMap[loan._id] || 0);
                return (
                  <tr key={loan._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{loan._id}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{loan.borrowerId?.userId?.name || loan.borrowerId?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{loan.principal.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{getLoanStatusLabel(loan.status)}</td>
                    <td className="px-4 py-3 text-amber-700 dark:text-amber-300">₹{stats.outstanding.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{stats.daysLate}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2">
                        <span>{collateralCount}</span>
                        {riskyCount > 0 && (
                          <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                            {riskyCount} risky
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/loans/${loan._id}`)}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LoanSegmentView;
