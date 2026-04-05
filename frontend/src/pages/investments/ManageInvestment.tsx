import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createInvestment,
  updateInvestment,
  getInvestmentById,
} from '../../lib/api/investments';
import { getInvestors } from '../../lib/api/investors';
import { getLoans } from '../../lib/api/loan';

type InvestmentFormData = {
  investorId: string;
  loanId: string;
  amount: string;
  interestRate: string;
  expectedReturnDate: string;
  status: 'pending' | 'active' | 'completed' | 'defaulted';
  totalReturned: string;
  notes: string;
};

const ManageInvestment = () => {
  const navigate = useNavigate();
  const { id: investmentId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedInvestorId = searchParams.get('investorId') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [investors, setInvestors] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoadingInvestment, setIsLoadingInvestment] = useState(false);
  const [formData, setFormData] = useState<InvestmentFormData>({
    investorId: preselectedInvestorId,
    loanId: '',
    amount: '',
    interestRate: '',
    expectedReturnDate: '',
    status: 'pending',
    totalReturned: '',
    notes: '',
  });

  // Load investors
  useEffect(() => {
    const loadInvestors = async () => {
      try {
        const res = await getInvestors();
        setInvestors(res.data || []);
      } catch {
        setInvestors([]);
      }
    };
    loadInvestors();
  }, []);

  // Load loans
  useEffect(() => {
    const loadLoans = async () => {
      try {
        const res = await getLoans();
        setLoans(res.data || []);
      } catch {
        setLoans([]);
      }
    };
    loadLoans();
  }, []);

  // Load investment if editing
  useEffect(() => {
    if (investmentId) {
      const loadInvestment = async () => {
        try {
          setIsLoadingInvestment(true);
          const investment = await getInvestmentById(investmentId);
          setFormData({
            investorId: investment.investorId,
            loanId: investment.loanId,
            amount: String(investment.amount),
            interestRate: String(investment.interestRate),
            expectedReturnDate: investment.expectedReturnDate.split('T')[0],
            status: investment.status,
            totalReturned: String(investment.totalReturned),
            notes: investment.notes || '',
          });
        } catch {
          setError('Failed to load investment');
        } finally {
          setIsLoadingInvestment(false);
        }
      };
      loadInvestment();
    }
  }, [investmentId]);

  useEffect(() => {
    if (!investmentId && preselectedInvestorId) {
      setFormData((prev) => ({ ...prev, investorId: preselectedInvestorId }));
    }
  }, [investmentId, preselectedInvestorId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const getLoanOptionValue = (loan: any) => loan?._id || loan?.id || '';

  const getLoanOptionLabel = (loan: any) => {
    const loanRef = loan?._id || loan?.id || 'Unknown';
    const borrowerName =
      loan?.borrowerName || loan?.borrowerId?.userId?.name || loan?.borrowerId?.name || 'Unknown Borrower';
    return `Loan ${loanRef} - ${borrowerName}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        investorId: formData.investorId && !investmentId ? formData.investorId : undefined,
        loanId: formData.loanId && !investmentId ? formData.loanId : undefined,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
        expectedReturnDate: formData.expectedReturnDate,
        status: investmentId ? formData.status : undefined,
        totalReturned: investmentId && formData.totalReturned ? parseFloat(formData.totalReturned) : undefined,
        notes: formData.notes || undefined,
      };

      if (investmentId) {
        await updateInvestment(investmentId, payload);
        setSuccess('Investment updated successfully!');
      } else {
        if (!formData.investorId || !formData.loanId) {
          setError('Please select both an investor and a loan');
          return;
        }
        await createInvestment(payload as any);
        setSuccess('Investment created successfully!');
      }

      setTimeout(() => navigate('/investments/view'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save investment');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingInvestment) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {preselectedInvestorId && !investmentId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          Creating investment for selected investor.
          <button
            onClick={() => navigate(`/investors/${preselectedInvestorId}`)}
            className="ml-2 font-medium underline"
          >
            Back to Investor
          </button>
          <button
            onClick={() => navigate(`/investments/view?investorId=${preselectedInvestorId}`)}
            className="ml-3 font-medium underline"
          >
            View Investments
          </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {investmentId ? 'Edit Investment' : 'Add Investment'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {investmentId ? 'Update investment details' : 'Create a new investment record'}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        {/* Investment Parties */}
        <div className="space-y-4 border-b pb-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Investment Parties
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Investor *
              </label>
              <select
                name="investorId"
                value={formData.investorId}
                onChange={handleChange}
                disabled={!!investmentId || !!preselectedInvestorId}
                required={!investmentId}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
              >
                <option value="">Select an investor</option>
                {investors?.map((inv: any) => (
                  <option key={inv._id} value={inv._id}>
                    {inv.name} ({inv.investorType})
                  </option>
                ))}
              </select>
              {preselectedInvestorId && !investmentId && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Investor is preselected from context.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan *
              </label>
              <select
                name="loanId"
                value={formData.loanId}
                onChange={handleChange}
                disabled={!!investmentId}
                required={!investmentId}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
              >
                <option value="">Select a loan</option>
                {loans?.map((loan: any) => (
                  <option key={getLoanOptionValue(loan)} value={getLoanOptionValue(loan)}>
                    {getLoanOptionLabel(loan)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Investment Details */}
        <div className="space-y-4 border-b pb-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Investment Details
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Investment Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Rate (%) *
              </label>
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleChange}
                required
                placeholder="0.00"
                step="0.01"
                min="0"
                max="100"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Return Date *
              </label>
              <input
                type="date"
                name="expectedReturnDate"
                value={formData.expectedReturnDate}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {investmentId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="defaulted">Defaulted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Returned
                  </label>
                  <input
                    type="number"
                    name="totalReturned"
                    value={formData.totalReturned}
                    onChange={handleChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Type any additional notes..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            {loading ? 'Saving...' : investmentId ? 'Update Investment' : 'Add Investment'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/investments/view')}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageInvestment;
