import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/Shared/PageHeader';
import { getInvestors } from '../../lib/api/investors';
import { createInvestment, getInvestments } from '../../lib/api/investments';
import { getLoans } from '../../lib/api/loan';

const AddInvestorTransaction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedInvestorId = searchParams.get('investorId') || '';

  const [investors, setInvestors] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    investorId: preselectedInvestorId,
    loanId: '',
    amount: '',
    interestRate: '',
    expectedReturnDate: '',
    notes: '',
  });

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoadingInitial(true);
        const [investorsRes, loansRes, txRes] = await Promise.all([
          getInvestors({ page: 1, limit: 200 }),
          getLoans(),
          getInvestments({ page: 1, limit: 20 }),
        ]);

        setInvestors(investorsRes.data || []);
        setLoans(loansRes.data?.data || loansRes.data || []);
        setTransactions(txRes.data || []);
      } catch {
        setError('Failed to load investors/loans/transactions');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadInitial();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!form.investorId) return transactions;
    return transactions.filter((tx: any) => {
      const investorId =
        tx?.investorId && typeof tx.investorId === 'object'
          ? tx.investorId?._id
          : tx?.investorId;
      return investorId === form.investorId;
    });
  }, [transactions, form.investorId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'loanId') {
      const loan = loans.find((item: any) => String(item._id || item.id) === value);
      setForm((prev) => ({
        ...prev,
        loanId: value,
        interestRate:
          prev.interestRate || loan?.interestRate !== undefined
            ? String(loan?.interestRate ?? prev.interestRate)
            : prev.interestRate,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.investorId || !form.loanId || !form.amount || !form.interestRate || !form.expectedReturnDate) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await createInvestment({
        investorId: form.investorId,
        loanId: form.loanId,
        amount: Number(form.amount),
        interestRate: Number(form.interestRate),
        expectedReturnDate: form.expectedReturnDate,
        notes: form.notes || undefined,
      });

      const txRes = await getInvestments({ page: 1, limit: 20, investorId: form.investorId || undefined });
      setTransactions(txRes.data || []);

      setSuccess('Transaction added successfully');
      setForm((prev) => ({
        ...prev,
        loanId: '',
        amount: '',
        interestRate: '',
        expectedReturnDate: '',
        notes: '',
      }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const getInvestorName = (tx: any) => {
    if (tx?.investorDetails?.name) return tx.investorDetails.name;
    if (typeof tx?.investorId === 'object' && tx?.investorId?.name) return tx.investorId.name;
    return '-';
  };

  const getLoanLabel = (tx: any) => {
    if (tx?.loanDetails?.loanNumber) return tx.loanDetails.loanNumber;
    if (typeof tx?.loanId === 'object') return tx.loanId?._id || '-';
    return tx?.loanId || '-';
  };

  if (loadingInitial) {
    return <div className="text-gray-600 dark:text-gray-300">Loading transaction page...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Transaction"
        description="Add a new investor money transaction and review recent transaction history"
        actionLabel="View All Transactions"
        onAction={() => navigate('/investments/view')}
      />

      <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">New Transaction</h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Investor *</label>
            <select
              name="investorId"
              value={form.investorId}
              onChange={handleChange}
              disabled={!!preselectedInvestorId}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
            >
              <option value="">Select investor</option>
              {investors.map((investor: any) => (
                <option key={investor._id} value={investor._id}>
                  {investor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Loan *</label>
            <select
              name="loanId"
              value={form.loanId}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select loan</option>
              {loans.map((loan: any) => (
                <option key={loan._id || loan.id} value={loan._id || loan.id}>
                  {(loan.loanNumber || loan._id || loan.id) + ` (Principal: ${Number(loan.principal || 0).toLocaleString()})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount *</label>
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Interest Rate (%) *</label>
            <input
              type="number"
              name="interestRate"
              min="0"
              max="100"
              step="0.01"
              value={form.interestRate}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Return Date *</label>
            <input
              type="date"
              name="expectedReturnDate"
              value={form.expectedReturnDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
          <button
            onClick={() => navigate('/investments/view')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            View All Transactions
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Investor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Loan</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Interest</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {filteredTransactions.map((tx: any) => (
                  <tr key={tx._id} className="bg-white dark:bg-gray-900">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{getInvestorName(tx)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{getLoanLabel(tx)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{Number(tx.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{tx.interestRate}%</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{tx.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddInvestorTransaction;
