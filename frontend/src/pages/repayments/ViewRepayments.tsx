import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Filter, Download, ReceiptText, Calendar } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getRepaymentCredits, getRepayments, RepaymentDisplay } from '../../lib/api/repayment';

const ViewRepayments = () => {
    const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryLoanId = searchParams.get('loanId') || '';
  const queryBorrowerId = searchParams.get('borrowerId') || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<RepaymentDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [exportNotice, setExportNotice] = useState('');
  const [creditSummary, setCreditSummary] = useState<{ totalCredit: number; focusedLoanCredit: number } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const res = await getRepayments();
      setData(res);
    } catch (err) {
      console.error(err);
      setFetchError('Failed to load repayments. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!queryLoanId) return;
    setSearchTerm((prev) => prev || queryLoanId);
  }, [queryLoanId]);

  useEffect(() => {
    const loadCredit = async () => {
      if (!queryBorrowerId) {
        setCreditSummary(null);
        return;
      }

      try {
        const credit = await getRepaymentCredits(queryBorrowerId);
        const focusedLoanCredit = queryLoanId
          ? Number((credit.creditsByLoan || []).find((row) => row.loanId === queryLoanId)?.credit || 0)
          : 0;
        setCreditSummary({
          totalCredit: Number(credit.totalCredit || 0),
          focusedLoanCredit
        });
      } catch {
        setCreditSummary(null);
      }
    };

    loadCredit();
  }, [queryBorrowerId, queryLoanId]);

  const getRowIssue = (txn: RepaymentDisplay) => {
    if (txn.status === 'Pending') {
      return 'Pending approval';
    }
    if (txn.method.toLowerCase() === 'system') {
      return 'Auto-posted entry';
    }
    return '';
  };

  const filtered = data.filter((r) => {
    const needle = searchTerm.toLowerCase();
    return (
      r.borrowerName.toLowerCase().includes(needle) ||
      r.id.toLowerCase().includes(needle) ||
      r.loanId.toLowerCase().includes(needle) ||
      r.status.toLowerCase().includes(needle) ||
      r.method.toLowerCase().includes(needle) ||
      String(r.amount).includes(needle)
    );
  });

  const exportRepayments = () => {
    const rows = [
      ['ID', 'Borrower', 'Amount', 'Date', 'Status'],
      ...filtered.map((txn) => [txn.id, txn.borrowerName, String(txn.amount), new Date(txn.date).toISOString(), txn.status])
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `repayments-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportNotice(`Exported ${filtered.length} of ${data.length} records based on current filters.`);
  };

  const exportReceipt = (txn: RepaymentDisplay) => {
    const receipt = [
      'Loan Repayment Receipt',
      `Receipt ID: ${txn.id}`,
      `Loan ID: ${txn.loanId}`,
      `Borrower: ${txn.borrowerName}`,
      `Amount: ₹${Number(txn.amount || 0).toLocaleString()}`,
      `Date: ${new Date(txn.date).toLocaleString()}`,
      `Method: ${txn.method}`,
      `Status: ${txn.status}`
    ].join('\n');

    const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `repayment-receipt-${txn.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const metrics = {
    total: filtered.length,
    approved: filtered.filter((item) => item.status === 'Approved').length,
    pending: filtered.filter((item) => item.status === 'Pending').length,
    amount: filtered.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  };

  const issueCount = useMemo(
    () => filtered.filter((txn) => Boolean(getRowIssue(txn))).length,
    [filtered]
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Repayments</h1>

        {/* ✅ icons now used */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSearchTerm('');
              setExportNotice('');
              setSearchParams({});
            }}
            title="Clear the current search"
            className="flex items-center gap-2 px-3 py-2 border rounded dark:border-gray-700 dark:text-white hover:dark:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Filter size={16} /> Clear
          </button>

          <button
            onClick={exportRepayments}
            title="Export the current filtered repayment list to CSV"
            className="flex items-center gap-2 px-3 py-2 border rounded dark:border-gray-700 dark:text-white hover:dark:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Repayments</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{metrics.total}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Approved</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{metrics.approved}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-300">{metrics.pending}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Amount</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{metrics.amount.toLocaleString()}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Rows With Issues</p>
          <p className="text-2xl font-semibold text-rose-600 dark:text-rose-300">{issueCount}</p>
        </div>
      </div>

      {!!queryLoanId && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          Focused on Loan ID: <span className="font-semibold">{queryLoanId}</span>
          {queryBorrowerId && (
            <span className="ml-2">
              | Borrower Unapplied Credit: ₹{Number(creditSummary?.totalCredit || 0).toLocaleString()} | Loan Unapplied Credit: ₹{Number(creditSummary?.focusedLoanCredit || 0).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {!!fetchError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{fetchError}</span>
          <button onClick={fetchData} className="text-xs font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded">Retry</button>
        </div>
      )}

      {!!exportNotice && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          {exportNotice}
        </div>
      )}

      {/* Search */}
      <div className="space-y-2">
        <label htmlFor="repayment-search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Search by borrower, repayment ID, loan ID, status, method, or amount
        </label>
        <input
          id="repayment-search"
          placeholder="Type borrower name..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:border-gray-700 w-full md:w-96 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded shadow border dark:border-gray-700 overflow-x-auto">
        {loading ? (
          <div className="p-4 text-gray-600 dark:text-gray-300">Loading...</div>
        ) : (
          <table className="min-w-full">
            <caption className="sr-only">Repayment records table</caption>
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Borrower</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Issue</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(txn => {
                const rowIssue = getRowIssue(txn);
                const isFocusedLoan = queryLoanId && txn.loanId === queryLoanId;
                return (
                <tr
                  key={txn.id}
                  className={`border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    isFocusedLoan ? 'bg-blue-50/60 dark:bg-blue-900/20' : rowIssue ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{txn.id}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{txn.borrowerName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{txn.amount}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(txn.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 rounded ${
                      txn.status === "Approved"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200"
                    }`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {rowIssue ? (
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">{rowIssue}</span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => exportReceipt(txn)}
                        aria-label={`Download receipt for repayment ${txn.id}`}
                        title="Download a repayment receipt"
                        className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                      >
                        <ReceiptText size={16} />
                                            <button
                                              onClick={() => navigate(`/calendar?loanId=${txn.loanId}`)}
                                              title="View loan repayment events in calendar"
                                              className="text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
                                            >
                                              <Calendar size={16} />
                                            </button>
                      </button>
                      <button
                        disabled
                        title="Repayment edit page will be enabled in a later phase"
                        className="opacity-60 cursor-not-allowed text-gray-500 dark:text-gray-400"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No repayments found
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewRepayments;