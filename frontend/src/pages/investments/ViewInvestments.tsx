import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getInvestments,
  deleteInvestment,
} from '../../lib/api/investments';
import PageHeader from '../../components/Shared/PageHeader';
import { getInvestors } from '../../lib/api/investors';

const ViewInvestments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialInvestorId = searchParams.get('investorId') || '';
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    investorId: initialInvestorId,
  });
  const [investments, setInvestments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string>('');
  const [investors, setInvestors] = useState<any[]>([]);
  const [search, setSearch] = useState('');

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

  // Load investments
  useEffect(() => {
    const loadInvestments = async () => {
      try {
        setIsLoading(true);
        setError('');
        const res = await getInvestments({
          page,
          limit: 20,
          status: filters.status || undefined,
          investorId: filters.investorId || undefined,
        });
        setInvestments(res.data || []);
        setPagination(res.pagination);
      } catch {
        setError('Failed to load investments');
        setInvestments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvestments();
  }, [page, filters]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        setDeleting(id);
        await deleteInvestment(id);
        // Reload investments after deletion
        const res = await getInvestments({
          page,
          limit: 20,
          status: filters.status || undefined,
          investorId: filters.investorId || undefined,
        });
        setInvestments(res.data || []);
        setPagination(res.pagination);
      } catch {
        setError('Failed to delete investment');
      } finally {
        setDeleting('');
      }
    }
  };

  const getInvestorName = (investment: any) => {
    if (investment?.investorDetails?.name) return investment.investorDetails.name;
    if (typeof investment?.investorId === 'object' && investment?.investorId?.name) {
      return investment.investorId.name;
    }
    return 'N/A';
  };

  const getLoanLabel = (investment: any) => {
    if (investment?.loanDetails?.loanNumber) return investment.loanDetails.loanNumber;
    if (typeof investment?.loanId === 'object') {
      return investment.loanId?._id || 'Loan';
    }
    return investment?.loanId || 'Loan';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'defaulted':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredInvestments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return investments;

    return investments.filter((investment: any) => {
      const investorName = getInvestorName(investment).toLowerCase();
      const loanLabel = getLoanLabel(investment).toLowerCase();
      const status = String(investment.status || '').toLowerCase();
      const amount = String(Number(investment.amount || 0)).toLowerCase();
      return (
        investorName.includes(query) ||
        loanLabel.includes(query) ||
        status.includes(query) ||
        amount.includes(query)
      );
    });
  }, [investments, search]);

  return (
    <div className="space-y-6">
      {filters.investorId && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          Viewing investments in investor context.
          <button
            onClick={() => navigate(`/investors/${filters.investorId}`)}
            className="ml-2 font-medium underline"
          >
            Open Investor
          </button>
        </div>
      )}

      <PageHeader
        title="Investments"
        description="Manage investor investments in loans"
        actionLabel="Add Investment"
        onAction={() =>
          navigate(
            filters.investorId
              ? `/investments/add?investorId=${filters.investorId}`
              : '/investments/add'
          )
        }
      />

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Investor
            </label>
            <select
              value={filters.investorId}
              onChange={(e) => {
                setFilters({ ...filters, investorId: e.target.value });
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Investors</option>
              {investors.map((investor: any) => (
                <option key={investor._id} value={investor._id}>
                  {investor.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Investor, loan, amount..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ status: '', investorId: '' });
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-lg border bg-white p-8 shadow-sm text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">Loading investments...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          Error loading investments
        </div>
      ) : filteredInvestments.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 shadow-sm text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">No investments found</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-hidden shadow-sm dark:border-gray-800">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Investor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Loan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Interest Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                    Return Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {filteredInvestments.map((investment: any) => (
                  <tr
                    key={investment._id}
                    className="bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <button
                        onClick={() => navigate(`/investors/${investment.investorId}`)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {getInvestorName(investment)}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <button
                        onClick={() => navigate(`/loans/${investment.loanId}`)}
                        className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        {getLoanLabel(investment)}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {Number(investment.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {investment.interestRate}%
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          investment.status
                        )}`}
                      >
                        {investment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {new Date(investment.expectedReturnDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => navigate(`/investments/edit/${investment._id}`)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(investment._id)}
                        disabled={deleting === investment._id}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        {deleting === investment._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between py-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ViewInvestments;
