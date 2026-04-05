import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../lib/api/api';
import { getSavingsAccounts, SavingsAccount } from '../../lib/api/savings';
import { getTermDeposits, TermDeposit } from '../../lib/api/termDeposits';

type Borrower = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
  userId?: {
    name?: string;
    email?: string;
  };
};

type LoanScheduleItem = {
  dueDate?: string;
  amount?: number;
  paidAmount?: number;
  status?: string;
};

type Loan = {
  _id: string;
  borrowerId?: string | { _id?: string };
  principal?: number;
  status?: string;
  emi?: number;
  createdAt?: string;
  schedule?: LoanScheduleItem[];
};

type Group = {
  _id: string;
  name?: string;
  leaderId?: string | { _id?: string };
  members?: Array<string | { _id?: string }>;
  collectorId?: string | { name?: string; email?: string };
};

const normalizeRefId = (value?: string | { _id?: string }) => {
  if (!value) return '';
  return typeof value === 'string' ? value : value._id || '';
};

const BorrowerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [termDeposits, setTermDeposits] = useState<TermDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) {
        setError('Invalid borrower id.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const borrowerRes = await API.get<Borrower>(`/borrowers/${id}`);
        setBorrower(borrowerRes.data);

        const [loansRes, groupsRes, savingsRes, termDepositRes] = await Promise.allSettled([
          API.get<Loan[]>('/loans'),
          API.get<Group[]>('/groups'),
          getSavingsAccounts({ limit: 500, sort: 'createdAt', order: 'desc' }),
          getTermDeposits({ limit: 500, sort: 'createdAt', order: 'desc' })
        ]);

        const allLoans = loansRes.status === 'fulfilled' && Array.isArray(loansRes.value.data)
          ? loansRes.value.data
          : [];
        const borrowerLoans = allLoans.filter((loan) => normalizeRefId(loan.borrowerId) === id);
        setLoans(borrowerLoans);

        const allGroups = groupsRes.status === 'fulfilled' && Array.isArray(groupsRes.value.data)
          ? groupsRes.value.data
          : [];
        const borrowerGroups = allGroups.filter((group) => {
          const leaderId = normalizeRefId(group.leaderId);
          const memberIds = (group.members || []).map((member) => normalizeRefId(member));
          return leaderId === id || memberIds.includes(id);
        });
        setGroups(borrowerGroups);

        const borrowerName = borrowerRes.data.userId?.name || borrowerRes.data.name || '';

        const allSavings = savingsRes.status === 'fulfilled' && Array.isArray(savingsRes.value.data)
          ? savingsRes.value.data
          : [];
        const allTermDeposits = termDepositRes.status === 'fulfilled' && Array.isArray(termDepositRes.value.data)
          ? termDepositRes.value.data
          : [];

        if (borrowerName.trim()) {
          const needle = borrowerName.toLowerCase();
          setSavingsAccounts(allSavings.filter((account) => account.borrowerName.toLowerCase().includes(needle)));
          setTermDeposits(allTermDeposits.filter((deposit) => deposit.borrowerName.toLowerCase().includes(needle)));
        } else {
          setSavingsAccounts([]);
          setTermDeposits([]);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.error || 'Failed to load borrower profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id]);

  const metrics = useMemo(() => {
    const totalPrincipal = loans.reduce((sum, loan) => sum + (loan.principal || 0), 0);

    const totalOutstanding = loans.reduce((sum, loan) => {
      const scheduleOutstanding = (loan.schedule || []).reduce((inner, item) => {
        const remaining = (item.amount || 0) - (item.paidAmount || 0);
        return inner + Math.max(0, remaining);
      }, 0);

      return sum + scheduleOutstanding;
    }, 0);

    const activeLoans = loans.filter((loan) => (loan.status || '').toLowerCase() !== 'closed').length;

    return {
      totalPrincipal,
      totalOutstanding,
      activeLoans
    };
  }, [loans]);

  const borrowerName = borrower?.userId?.name || borrower?.name || 'Unknown borrower';
  const borrowerEmail = borrower?.userId?.email || borrower?.email || '-';
  const savingsBalance = savingsAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const termDepositBalance = termDeposits.reduce((sum, deposit) => sum + Number(deposit.currentValue || 0), 0);

  if (loading) {
    return <div className="p-6 text-gray-500 dark:text-gray-400">Loading borrower profile...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/borrowers/view')}
          className="text-sm text-blue-600 hover:underline"
        >
          Back to borrowers
        </button>
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Borrower Profile</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{borrowerName}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/borrowers/view')}
            className="px-3 py-2 border rounded dark:border-gray-700 dark:text-white"
          >
            Back
          </button>
          {borrower?._id && (
            <button
              onClick={() => navigate(`/borrowers/edit/${borrower._id}`)}
              className="px-3 py-2 rounded bg-blue-600 text-white"
            >
              Edit Borrower
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Principal</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{metrics.totalPrincipal.toLocaleString()}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Outstanding</p>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-300">₹{metrics.totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Active Loans</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{metrics.activeLoans}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Savings Accounts</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{savingsAccounts.length}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Savings Balance</p>
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">₹{savingsBalance.toLocaleString()}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Term Deposits</p>
          <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">₹{termDepositBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">Savings Links</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/savings/view')} className="px-3 py-2 rounded bg-blue-600 text-white text-sm">Open Savings Accounts</button>
          <button onClick={() => navigate('/savings/term-deposits/view')} className="px-3 py-2 rounded border dark:border-gray-700 dark:text-white text-sm">Open Term Deposits</button>
          <button
            onClick={() => navigate(`/savings-transactions/view?borrowerName=${encodeURIComponent(borrowerName)}`)}
            className="px-3 py-2 rounded border dark:border-gray-700 dark:text-white text-sm"
          >
            Borrower Transactions
          </button>
          <button onClick={() => navigate('/savings-transactions/approve')} className="px-3 py-2 rounded border dark:border-gray-700 dark:text-white text-sm">Approve Transactions</button>
          <button onClick={() => navigate('/savings/report')} className="px-3 py-2 rounded border dark:border-gray-700 dark:text-white text-sm">Savings Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">Borrower Details</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Name:</span> {borrowerName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Email:</span> {borrowerEmail}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Phone:</span> {borrower?.phone || '-'}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Address:</span> {borrower?.address || '-'}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Description:</span> {borrower?.description || '-'}</p>
        </div>

        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">Group Memberships</h2>
          {groups.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">This borrower is not currently assigned to any group.</p>
          ) : (
            <ul className="space-y-2">
              {groups.map((group) => {
                const leaderId = normalizeRefId(group.leaderId);
                const role = leaderId === id ? 'Leader' : 'Member';
                const collector = typeof group.collectorId === 'string' ? '' : (group.collectorId?.name || '');

                return (
                  <li key={group._id} className="rounded border dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-medium text-gray-900 dark:text-white">{group.name || 'Unnamed group'}</p>
                    <p>Role: {role}</p>
                    <p>Collector: {collector || '-'}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
        <div className="px-4 py-3 border-b dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Loans</h2>
        </div>

        {loans.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">No loans found for this borrower.</p>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Loan ID</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Principal</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">EMI</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Status</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Created</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan._id} className="border-t dark:border-gray-700">
                  <td className="px-4 py-3 text-blue-600 dark:text-blue-300">{loan._id}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{(loan.principal || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{(loan.emi || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{loan.status || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BorrowerProfile;
