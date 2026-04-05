import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createInvestorAccount,
  updateInvestorAccount,
  getInvestorAccountById,
} from '../../lib/api/investorAccounts';
import { getInvestors } from '../../lib/api/investors';

type AccountFormData = {
  investorId: string;
  accountNumber: string;
  accountType: 'savings' | 'checking' | 'investment' | 'other';
  bank: string;
  balance: string;
  currency: string;
  status: 'active' | 'inactive' | 'suspended';
  notes: string;
};

const ManageInvestorAccount = () => {
  const navigate = useNavigate();
  const { id: accountId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedInvestorId = searchParams.get('investorId') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [investors, setInvestors] = useState<any[]>([]);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [formData, setFormData] = useState<AccountFormData>({
    investorId: preselectedInvestorId,
    accountNumber: '',
    accountType: 'savings',
    bank: '',
    balance: '',
    currency: 'USD',
    status: 'active',
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

  // Load account if editing
  useEffect(() => {
    if (accountId) {
      const loadAccount = async () => {
        try {
          setIsLoadingAccount(true);
          const account = await getInvestorAccountById(accountId);
          setFormData({
            investorId: account.investorId,
            accountNumber: account.accountNumber,
            accountType: account.accountType,
            bank: account.bank,
            balance: String(account.balance),
            currency: account.currency,
            status: account.status,
            notes: account.notes || '',
          });
        } catch {
          setError('Failed to load account');
        } finally {
          setIsLoadingAccount(false);
        }
      };
      loadAccount();
    }
  }, [accountId]);

  useEffect(() => {
    if (!accountId && preselectedInvestorId) {
      setFormData((prev) => ({ ...prev, investorId: preselectedInvestorId }));
    }
  }, [accountId, preselectedInvestorId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        investorId: formData.investorId && !accountId ? formData.investorId : undefined,
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
        bank: formData.bank,
        balance: formData.balance ? parseFloat(formData.balance) : undefined,
        currency: formData.currency,
        status: accountId ? formData.status : undefined,
        notes: formData.notes || undefined,
      };

      if (accountId) {
        await updateInvestorAccount(accountId, payload);
        setSuccess('Account updated successfully!');
      } else {
        if (!formData.investorId) {
          setError('Please select an investor');
          return;
        }
        await createInvestorAccount(payload as any);
        setSuccess('Account created successfully!');
      }

      setTimeout(() => navigate('/accounts/view'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAccount) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {preselectedInvestorId && !accountId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          Creating account for selected investor.
          <button
            onClick={() => navigate(`/investors/${preselectedInvestorId}`)}
            className="ml-2 font-medium underline"
          >
            Back to Investor
          </button>
          <button
            onClick={() => navigate(`/accounts/view?investorId=${preselectedInvestorId}`)}
            className="ml-3 font-medium underline"
          >
            View Accounts
          </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {accountId ? 'Edit Account' : 'Add Account'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {accountId ? 'Update investor account details' : 'Create a new investor account'}
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
        {/* Investor Selection */}
        <div className="space-y-4 border-b pb-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Investor Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Investor *
            </label>
            <select
              name="investorId"
              value={formData.investorId}
              onChange={handleChange}
                disabled={!!accountId || !!preselectedInvestorId}
              required={!accountId}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
            >
              <option value="">Select an investor</option>
              {investors?.map((inv: any) => (
                <option key={inv._id} value={inv._id}>
                  {inv.name} ({inv.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Account Details */}
        <div className="space-y-4 border-b pb-6 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Account Details
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Number *
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
                placeholder="Account number"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Type *
              </label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="savings">Savings</option>
                <option value="checking">Checking</option>
                <option value="investment">Investment</option>
                <option value="other">Other</option>
              </select>
              {preselectedInvestorId && !accountId && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Investor is preselected from context.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bank Name *
              </label>
              <input
                type="text"
                name="bank"
                value={formData.bank}
                onChange={handleChange}
                required
                placeholder="Bank name"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Balance
              </label>
              <input
                type="number"
                name="balance"
                value={formData.balance}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                placeholder="USD"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {accountId && (
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
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
            {loading ? 'Saving...' : accountId ? 'Update Account' : 'Add Account'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/accounts/view')}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageInvestorAccount;
