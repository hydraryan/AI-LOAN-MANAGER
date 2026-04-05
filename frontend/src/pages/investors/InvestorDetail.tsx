import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/Shared/PageHeader';
import { getInvestor } from '../../lib/api/investors';
import { getInvestorAccounts } from '../../lib/api/investorAccounts';
import { getInvestments } from '../../lib/api/investments';

const InvestorDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [investor, setInvestor] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    accountsCount: 0,
    accountsBalance: 0,
    investmentsCount: 0,
    activeInvestments: 0,
    investmentAmount: 0,
  });

  useEffect(() => {
    const loadInvestor = async () => {
      if (!id) {
        setError('Investor id is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getInvestor(id);
        setInvestor(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load investor details');
      } finally {
        setLoading(false);
      }
    };

    loadInvestor();
  }, [id]);

  useEffect(() => {
    const loadStats = async () => {
      if (!id) return;

      try {
        setStatsLoading(true);

        const [accountsRes, investmentsRes] = await Promise.all([
          getInvestorAccounts({ investorId: id, page: 1, limit: 100 }),
          getInvestments({ investorId: id, page: 1, limit: 100 }),
        ]);

        const accounts = accountsRes.data || [];
        const investments = investmentsRes.data || [];

        setStats({
          accountsCount: accountsRes.pagination?.total || accounts.length,
          accountsBalance: accounts.reduce(
            (sum: number, account: any) => sum + Number(account.balance || 0),
            0
          ),
          investmentsCount: investmentsRes.pagination?.total || investments.length,
          activeInvestments: investments.filter((inv: any) =>
            ['pending', 'active'].includes(String(inv.status || '').toLowerCase())
          ).length,
          investmentAmount: investments.reduce(
            (sum: number, inv: any) => sum + Number(inv.amount || 0),
            0
          ),
        });
      } catch {
        setStats({
          accountsCount: 0,
          accountsBalance: 0,
          investmentsCount: 0,
          activeInvestments: 0,
          investmentAmount: 0,
        });
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [id]);

  if (loading) return <div className="text-gray-600 dark:text-gray-300">Loading investor details...</div>;
  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>;
  if (!investor) return <div className="text-gray-600 dark:text-gray-300">Investor not found.</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={investor.name}
        description="Investor profile and linked actions"
        actionLabel="Edit Investor"
        onAction={() => navigate(`/investors/edit/${investor._id}`)}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Investor Summary</h2>
          {statsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading summary...</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Accounts</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.accountsCount}</p>
              </div>
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Account Balance</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.accountsBalance.toLocaleString()}</p>
              </div>
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Investments</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.investmentsCount}</p>
              </div>
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Active Investments</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.activeInvestments}</p>
              </div>
              <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Invested Amount</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stats.investmentAmount.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p><span className="font-medium">Email:</span> {investor.email}</p>
            <p><span className="font-medium">Type:</span> {investor.investorType}</p>
            <p><span className="font-medium">Status:</span> {investor.status}</p>
            <p><span className="font-medium">KYC:</span> {investor.kycStatus}</p>
            <p><span className="font-medium">Phone:</span> {investor.phone || 'N/A'}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Quick Links</h2>
          <div className="space-y-2">
            <button onClick={() => navigate(`/accounts/view?investorId=${investor._id}`)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">View Investor Accounts</button>
            <button onClick={() => navigate(`/accounts/add?investorId=${investor._id}`)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Add Investor Account</button>
            <button onClick={() => navigate(`/investments/view?investorId=${investor._id}`)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">View Investments</button>
            <button onClick={() => navigate(`/investments/add?investorId=${investor._id}`)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Add Investment</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDetail;
