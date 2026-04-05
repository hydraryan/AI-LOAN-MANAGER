import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRepayments, RepaymentDisplay } from '../../lib/api/repayment';

const ApproveRepayments = () => {
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
      setFetchError('Failed to load repayment approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepayments();
  }, []);

  const pendingRepayments = useMemo(
    () => repayments.filter((item) => item.status.toLowerCase() === 'pending'),
    [repayments]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approve Repayments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Review pending repayments before approval workflow goes live.</p>
        </div>

        <button
          onClick={() => navigate('/repayments/view')}
          className="px-3 py-2 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Back to Repayments
        </button>
      </div>

      <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
        Current backend marks successful bulk repayments as approved immediately. Manual approval API can be added in a future phase.
      </div>

      {!!fetchError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{fetchError}</span>
          <button onClick={fetchRepayments} className="text-xs font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-gray-600 dark:text-gray-300">Loading repayments...</div>
        ) : pendingRepayments.length === 0 ? (
          <div className="p-6 text-gray-500 dark:text-gray-400">No pending repayments in queue.</div>
        ) : (
          <table className="min-w-full text-sm text-left">
            <caption className="sr-only">Pending repayment approvals table</caption>
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-gray-700 dark:text-gray-200">Repayment ID</th>
                <th scope="col" className="px-4 py-3 text-gray-700 dark:text-gray-200">Loan</th>
                <th scope="col" className="px-4 py-3 text-gray-700 dark:text-gray-200">Borrower</th>
                <th scope="col" className="px-4 py-3 text-gray-700 dark:text-gray-200">Amount</th>
                <th scope="col" className="px-4 py-3 text-gray-700 dark:text-gray-200">Date</th>
              </tr>
            </thead>
            <tbody>
              {pendingRepayments.map((item) => (
                <tr key={item.id} className="border-t dark:border-gray-700">
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{item.id}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.loanId}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.borrowerName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{item.amount}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(item.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ApproveRepayments;
