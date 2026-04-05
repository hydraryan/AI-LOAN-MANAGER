import { useState, useEffect, useMemo } from 'react';
import { Eye, Search, Filter, Download, Plus, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';
import PageHeader from '../../components/Shared/PageHeader';
import { getLoanScheduleStats, getLoanStatusLabel, normalizeLoanStatus } from '../../lib/loanStatus';
import { getCollateralLoanSummary } from '../../lib/api/collateral';

type Loan = {
  _id: string;
  borrowerId: {
    name?: string;
    userId?: {
      name?: string;
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

const ViewLoans = () => {
  const navigate = useNavigate();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [collateralFilter, setCollateralFilter] = useState('All');
  const [loanCollateralCountMap, setLoanCollateralCountMap] = useState<Record<string, number>>({});
  const [loanCollateralRiskMap, setLoanCollateralRiskMap] = useState<Record<string, number>>({});
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
      setFetchError('Failed to load loans. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FETCH REAL DATA
  useEffect(() => {
    fetchLoans();
  }, []);

  // 🔥 FILTER LOGIC
  const filteredLoans = useMemo(() => loans.filter((loan) => {
    const name = loan.borrowerId?.userId?.name || loan.borrowerId?.name || '';
    const collateralCount = Number(loanCollateralCountMap[loan._id] || 0);
    const riskyCount = Number(loanCollateralRiskMap[loan._id] || 0);

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan._id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || normalizeLoanStatus(loan.status) === statusFilter.toLowerCase();

    const matchesCollateral =
      collateralFilter === 'All' ||
      (collateralFilter === 'Linked' && collateralCount > 0) ||
      (collateralFilter === 'Unlinked' && collateralCount === 0) ||
      (collateralFilter === 'Risky' && riskyCount > 0);

    return matchesSearch && matchesStatus && matchesCollateral;
  }), [collateralFilter, loanCollateralCountMap, loanCollateralRiskMap, loans, searchTerm, statusFilter]);

  const loanSummary = useMemo(() => ({
    linkedCollateral: filteredLoans.reduce((sum, loan) => sum + Number(loanCollateralCountMap[loan._id] || 0), 0),
    riskyLinks: filteredLoans.reduce((sum, loan) => sum + Number(loanCollateralRiskMap[loan._id] || 0), 0)
  }), [filteredLoans, loanCollateralCountMap, loanCollateralRiskMap]);

  const exportLoans = () => {
    const rows = [
      ['Loan ID', 'Borrower', 'Principal', 'Status', 'Created', 'Next Payment', 'Paid Amount', 'Collateral Count', 'Risky Collateral Links'],
      ...filteredLoans.map((loan) => [
        loan._id,
        loan.borrowerId?.userId?.name || loan.borrowerId?.name || 'Unknown',
        String(loan.principal),
        getLoanStatusLabel(loan.status),
        new Date(loan.createdAt).toISOString(),
        getNextPayment(loan.schedule) === '-' ? '' : getNextPayment(loan.schedule),
        String(getPaidAmount(loan.schedule)),
        String(loanCollateralCountMap[loan._id] || 0),
        String(loanCollateralRiskMap[loan._id] || 0)
      ])
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `loans-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 🔥 NEXT PAYMENT
  const getNextPayment = (schedule: Loan['schedule']) => {
    const pending = schedule.find((s) => Math.max(0, Number(s.amount || 0) - Number(s.paidAmount || 0)) > 0);
    return pending ? pending.dueDate : '-';
  };

  // 🔥 PAID AMOUNT
  const getPaidAmount = (schedule: Loan['schedule']) => {
    return schedule.reduce((sum, s) => sum + s.paidAmount, 0);
  };

  // 🔥 STATUS COLOR
  const getStatusColor = (status: string) => {
    switch (normalizeLoanStatus(status)) {
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200';
      case 'active':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'closed':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'defaulted':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <PageHeader
        title="All Loans"
        description="Manage loan portfolio"
        actionLabel="Add Loan"
        actionIcon={<Plus size={18} />}
        onAction={() => navigate('/loans/add')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Linked Collateral</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{loanSummary.linkedCollateral}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Risky Collateral Links</p>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-300">{loanSummary.riskyLinks}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded border dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between">

        <div className="flex gap-4 flex-1">

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              placeholder="Search..."
              className="pl-10 pr-3 py-2 border rounded w-full dark:bg-gray-900 dark:text-white dark:border-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:border-gray-700"
          >
            <option value="All">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="paid">Paid</option>
            <option value="closed">Closed</option>
            <option value="defaulted">Defaulted</option>
          </select>

          <select
            value={collateralFilter}
            onChange={(e) => setCollateralFilter(e.target.value)}
            className="border px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:border-gray-700"
          >
            <option value="All">All Collateral Links</option>
            <option value="Linked">Linked Loans</option>
            <option value="Unlinked">Unlinked Loans</option>
            <option value="Risky">Risky Links</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setStatusFilter('All');
              setCollateralFilter('All');
            }}
            title="Reset to all loan statuses"
            className="flex items-center gap-2 border px-3 py-2 rounded dark:border-gray-700 dark:text-white hover:dark:bg-gray-700"
          >
            <Filter size={16} /> Reset
          </button>

          <button
            onClick={exportLoans}
            title="Export the current filtered loan list to CSV"
            className="flex items-center gap-2 border px-3 py-2 rounded dark:border-gray-700 dark:text-white hover:dark:bg-gray-700"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {!!fetchError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{fetchError}</span>
          <button onClick={fetchLoans} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 overflow-hidden">

        {loading ? (
          <div className="p-6 text-center dark:text-white">Loading...</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Borrower</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Next Payment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Collateral</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody>
              {filteredLoans.map((loan) => {
                const collateralCount = Number(loanCollateralCountMap[loan._id] || 0);
                const riskyCount = Number(loanCollateralRiskMap[loan._id] || 0);
                return (
                <tr key={loan._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">

                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{loan._id}</td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {loan.borrowerId?.userId?.name || loan.borrowerId?.name || 'Unknown'}
                  </td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    ₹{loan.principal.toLocaleString()}
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Paid: ₹{getLoanScheduleStats(loan).totalPaid.toLocaleString()}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`px-2 rounded ${getStatusColor(loan.status)}`}>
                      {getLoanStatusLabel(loan.status)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {new Date(loan.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {getNextPayment(loan.schedule) !== '-'
                      ? new Date(getNextPayment(loan.schedule)).toLocaleDateString()
                      : '-'}
                  </td>

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
                      className="text-blue-600 dark:text-blue-400"
                    >
                      <Eye size={18} />
                                      <td className="px-4 py-3">
                                        <button
                                          onClick={() => navigate(`/calendar?loanId=${loan._id}`)}
                                          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                          title="View loan events in calendar"
                                        >
                                          <Calendar size={18} />
                                        </button>
                                      </td>
                    </button>
                  </td>

                </tr>
              )})}
            </tbody>
          </table>
        )}

        {!loading && filteredLoans.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No loans found
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewLoans;