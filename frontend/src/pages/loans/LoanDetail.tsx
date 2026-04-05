import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import API from '../../lib/api/api';
import { updateLoanStatus } from '../../lib/api/loan';
import { getLoanStatusLabel, normalizeLoanStatus } from '../../lib/loanStatus';
import { getRepaymentCredits } from '../../lib/api/repayment';
import { CollateralRecord, getCollateralByLoanId } from '../../lib/api/collateral';

type ScheduleItem = {
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue' | string;
};

type LoanDetailData = {
  _id: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emi: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  borrowerId?: {
    _id?: string;
    name?: string;
    userId?: {
      name?: string;
      email?: string;
    };
  };
  schedule: ScheduleItem[];
  comments?: Array<{
    text?: string;
    createdAt?: string;
  }>;
};

const loanStatusOptions = ['pending', 'approved', 'active', 'paid', 'closed', 'defaulted'] as const;

const LoanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loan, setLoan] = useState<LoanDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [previewAmount, setPreviewAmount] = useState('');
  const [creditSummary, setCreditSummary] = useState<{ totalCredit: number; forThisLoan: number } | null>(null);
  const [linkedCollateral, setLinkedCollateral] = useState<CollateralRecord[]>([]);

  useEffect(() => {
    const fetchLoan = async () => {
      if (!id) {
        setError('Invalid loan id');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const res = await API.get<LoanDetailData>(`/loans/${id}`);
        setLoan(res.data);
        setStatusDraft(normalizeLoanStatus(res.data.status));
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.error || 'Failed to load loan details');
      } finally {
        setLoading(false);
      }
    };

    fetchLoan();
  }, [id]);

  useEffect(() => {
    const loadCreditSummary = async () => {
      const borrowerId = loan?.borrowerId?._id;
      if (!borrowerId || !loan?._id) {
        setCreditSummary(null);
        return;
      }

      try {
        const credit = await getRepaymentCredits(String(borrowerId));
        const forThisLoan = (credit.creditsByLoan || []).find((row) => row.loanId === loan._id)?.credit || 0;
        setCreditSummary({ totalCredit: Number(credit.totalCredit || 0), forThisLoan: Number(forThisLoan || 0) });
      } catch {
        setCreditSummary(null);
      }
    };

    loadCreditSummary();
  }, [loan?._id, loan?.borrowerId?._id]);

  useEffect(() => {
    const loadLinkedCollateral = async () => {
      if (!loan?._id) {
        setLinkedCollateral([]);
        return;
      }

      try {
        const collateral = await getCollateralByLoanId(loan._id);
        setLinkedCollateral(collateral);
      } catch {
        setLinkedCollateral([]);
      }
    };

    loadLinkedCollateral();
  }, [loan?._id]);

  const summary = useMemo(() => {
    if (!loan) {
      return {
        totalPaid: 0,
        totalScheduled: 0,
        outstanding: 0,
        pendingCount: 0,
        paidCount: 0,
        overdueCount: 0
      };
    }

    const totalPaid = loan.schedule.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
    const totalScheduled = loan.schedule.reduce((sum, item) => sum + (item.amount || 0), 0);

    return {
      totalPaid,
      totalScheduled,
      outstanding: Math.max(0, totalScheduled - totalPaid),
      pendingCount: loan.schedule.filter((item) => item.status === 'pending').length,
      paidCount: loan.schedule.filter((item) => item.status === 'paid').length,
      overdueCount: loan.schedule.filter((item) => item.status === 'overdue').length
    };
  }, [loan]);

  const allocationPreview = useMemo(() => {
    if (!loan) {
      return {
        enteredAmount: 0,
        appliedAmount: 0,
        coveredInstallments: 0,
        remainingAfterPreview: summary.outstanding,
        nextDueDate: ''
      };
    }

    const enteredAmount = Number(previewAmount || 0);
    let remaining = Math.max(0, enteredAmount);
    let appliedAmount = 0;
    let coveredInstallments = 0;

    for (const item of loan.schedule) {
      if (remaining <= 0) {
        break;
      }

      const dueRemaining = Math.max(0, (item.amount || 0) - (item.paidAmount || 0));
      const applied = Math.min(remaining, dueRemaining);

      if (applied > 0) {
        appliedAmount += applied;
        remaining -= applied;
        coveredInstallments += 1;
      }
    }

    const nextDue = loan.schedule.find((item) => Math.max(0, (item.amount || 0) - (item.paidAmount || 0)) > 0);

    return {
      enteredAmount,
      appliedAmount,
      coveredInstallments,
      remainingAfterPreview: Math.max(0, summary.outstanding - appliedAmount),
      nextDueDate: nextDue?.dueDate ? new Date(nextDue.dueDate).toLocaleDateString() : 'No pending dues'
    };
  }, [loan, previewAmount, summary.outstanding]);

  const collateralSummary = useMemo(() => {
    const totalValue = linkedCollateral.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const deposited = linkedCollateral.filter((item) => item.status === 'Deposited').length;
    const returned = linkedCollateral.filter((item) => item.status === 'Returned').length;
    const sold = linkedCollateral.filter((item) => item.status === 'Sold').length;

    return {
      total: linkedCollateral.length,
      totalValue,
      deposited,
      returned,
      sold
    };
  }, [linkedCollateral]);

  const activityTimeline = useMemo(() => {
    if (!loan) {
      return [];
    }

    const latestComment = loan.comments?.[0];
    const nextDue = loan.schedule.find((item) => Math.max(0, (item.amount || 0) - (item.paidAmount || 0)) > 0);

    return [
      {
        title: 'Loan created',
        details: new Date(loan.createdAt).toLocaleString()
      },
      {
        title: 'Current status',
        details: getLoanStatusLabel(loan.status)
      },
      {
        title: 'Next pending installment',
        details: nextDue?.dueDate ? new Date(nextDue.dueDate).toLocaleDateString() : 'Fully settled'
      },
      {
        title: 'Recent note',
        details: latestComment?.text ? `${latestComment.text}${latestComment.createdAt ? ` • ${new Date(latestComment.createdAt).toLocaleString()}` : ''}` : 'No loan comments yet'
      }
    ];
  }, [loan]);

  const borrowerName = loan?.borrowerId?.userId?.name || loan?.borrowerId?.name || 'Unknown';
  const borrowerEmail = loan?.borrowerId?.userId?.email || '-';
  const borrowerId = loan?.borrowerId?._id;

  const saveStatus = async () => {
    if (!loan?._id || !statusDraft || statusDraft === loan.status) {
      return;
    }

    try {
      setSavingStatus(true);
      setStatusMessage('');
      const res = await updateLoanStatus(loan._id, statusDraft);
      setLoan(res.data);
      setStatusMessage('Loan status updated successfully.');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err?.response?.data?.error || 'Failed to update loan status.');
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loan ID: {id}</p>
        </div>

        <button
          onClick={() => navigate('/loans/view')}
          className="px-3 py-2 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to Loans
        </button>
      </div>

      {loading && (
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-6 text-gray-500 dark:text-gray-300">
          Loading loan details...
        </div>
      )}

      {!loading && !!error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && loan && (
        <>
          {!!statusMessage && (
            <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              {statusMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Principal</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">₹{loan.principal.toLocaleString()}</p>
            </div>
            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Paid</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">₹{summary.totalPaid.toLocaleString()}</p>
            </div>
            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Outstanding</p>
              <p className="text-lg font-semibold text-amber-600 dark:text-amber-300">₹{summary.outstanding.toLocaleString()}</p>
            </div>
            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                  aria-label="Loan status"
                  className="border rounded px-2 py-1 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {loanStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button
                  onClick={saveStatus}
                  disabled={savingStatus || !statusDraft || statusDraft === normalizeLoanStatus(loan.status)}
                  className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {savingStatus ? 'Saving...' : 'Save'}
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Current: {getLoanStatusLabel(loan.status)}</p>
            </div>
          </div>

          <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Borrower & Savings Links</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Jump from this loan to the borrower profile or savings screens.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {borrowerId && (
                  <button onClick={() => navigate(`/borrowers/profile/${borrowerId}`)} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Open Borrower Profile</button>
                )}
                <button onClick={() => navigate('/savings/view')} className="px-3 py-2 rounded border dark:border-gray-700 dark:text-white text-sm">Savings Accounts</button>
                <button onClick={() => navigate('/savings/term-deposits/view')} className="px-3 py-2 rounded border dark:border-gray-700 dark:text-white text-sm">Term Deposits</button>
                <button onClick={() => navigate('/savings-transactions/view')} className="px-3 py-2 rounded border dark:border-gray-700 dark:text-white text-sm">Savings Transactions</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2">
              <h2 className="font-semibold text-gray-900 dark:text-white">Borrower</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">Name: {borrowerName}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Email: {borrowerEmail}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Interest: {loan.interestRate}%</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Tenure: {loan.tenureMonths} months</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">EMI: ₹{loan.emi.toLocaleString()}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Created: {new Date(loan.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2">
              <h2 className="font-semibold text-gray-900 dark:text-white">Installment Stats</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">Paid: {summary.paidCount}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Pending: {summary.pendingCount}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Overdue: {summary.overdueCount}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Scheduled Total: ₹{summary.totalScheduled.toLocaleString()}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Unapplied Credit (Borrower): ₹{Number(creditSummary?.totalCredit || 0).toLocaleString()}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Unapplied Credit (This Loan): ₹{Number(creditSummary?.forThisLoan || 0).toLocaleString()}
              </p>
              <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      navigate(
                        `/repayments/view?loanId=${encodeURIComponent(loan._id)}&borrowerId=${encodeURIComponent(
                          String(loan.borrowerId?._id || '')
                        )}`
                      )
                    }
                    className="px-3 py-2 rounded border border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    View Repayment Context
                  </button>
                  <button
                    onClick={() => navigate(`/calendar?loanId=${loan._id}`)}
                    className="px-3 py-2 rounded border border-purple-200 text-purple-700 dark:border-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2"
                  >
                    <Calendar size={16} />
                    View in Calendar
                  </button>
                  <button
                    onClick={() => navigate(`/savings-transactions/view?loanId=${encodeURIComponent(loan._id)}`)}
                    className="px-3 py-2 rounded border border-emerald-200 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    Loan Transactions
                  </button>
                  <button
                    onClick={() => navigate('/savings-transactions/approve')}
                    className="px-3 py-2 rounded border border-rose-200 text-rose-700 dark:border-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    Savings Approvals
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Repayment Allocation Preview</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Estimate how a payment would be applied across the current schedule before posting it.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <label htmlFor="allocation-preview-amount" className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  Amount to preview
                  <input
                    id="allocation-preview-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={previewAmount}
                    onChange={(e) => setPreviewAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    className="mt-1 w-full rounded border px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </label>
                <div className="sm:w-40 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                  Next due: {allocationPreview.nextDueDate}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Entered</p>
                  <p className="font-semibold text-gray-900 dark:text-white">₹{allocationPreview.enteredAmount.toLocaleString()}</p>
                </div>
                <div className="rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Would apply</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">₹{allocationPreview.appliedAmount.toLocaleString()}</p>
                </div>
                <div className="rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Remaining after preview</p>
                  <p className="font-semibold text-amber-600 dark:text-amber-300">₹{allocationPreview.remainingAfterPreview.toLocaleString()}</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300">
                This preview would cover {allocationPreview.coveredInstallments} installment{allocationPreview.coveredInstallments === 1 ? '' : 's'}.
              </p>
            </div>

            <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">Activity Timeline</h2>
              <div className="space-y-3">
                {activityTimeline.map((item) => (
                  <div key={item.title} className="flex gap-3 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Linked Collateral</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assets tied to this loan for collateral tracking and recovery readiness.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => navigate(`/collateral/add?borrowerId=${encodeURIComponent(String(loan.borrowerId?._id || ''))}&loanId=${encodeURIComponent(loan._id)}`)}
                  className="px-3 py-2 rounded bg-blue-600 text-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Add Collateral
                </button>
                <button
                  onClick={() => navigate('/collateral/view')}
                  className="px-3 py-2 rounded border dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Open Register
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <div className="rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Records</p>
                <p className="font-semibold text-gray-900 dark:text-white">{collateralSummary.total}</p>
              </div>
              <div className="rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="font-semibold text-gray-900 dark:text-white">₹{collateralSummary.totalValue.toLocaleString()}</p>
              </div>
              <div className="rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Deposited</p>
                <p className="font-semibold text-green-600 dark:text-green-300">{collateralSummary.deposited}</p>
              </div>
              <div className="rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Returned</p>
                <p className="font-semibold text-gray-700 dark:text-gray-200">{collateralSummary.returned}</p>
              </div>
              <div className="rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Sold</p>
                <p className="font-semibold text-red-600 dark:text-red-300">{collateralSummary.sold}</p>
              </div>
            </div>

            {linkedCollateral.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">No collateral is linked to this loan yet.</p>
            ) : (
              <div className="overflow-x-auto rounded border dark:border-gray-700">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Item</th>
                      <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Type</th>
                      <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Serial</th>
                      <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Value</th>
                      <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedCollateral.map((item) => (
                      <tr key={item._id} className="border-t dark:border-gray-700">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.productName}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.type}</td>
                        <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{item.serialNumber}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{Number(item.value || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.status}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/collateral/edit/${item._id}`)}
                            className="text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
            <div className="px-4 py-3 border-b dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Repayment Schedule</h2>
            </div>
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Due Date</th>
                  <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Amount</th>
                  <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Paid</th>
                  <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Remaining</th>
                  <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.schedule.map((item, index) => {
                  const remaining = Math.max(0, (item.amount || 0) - (item.paidAmount || 0));
                  return (
                    <tr key={`${item.dueDate}-${index}`} className="border-t dark:border-gray-700">
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(item.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{(item.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-700 dark:text-green-300">₹{(item.paidAmount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-amber-700 dark:text-amber-300">₹{remaining.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default LoanDetail;
