import { useState, useEffect, useMemo } from 'react';
import { Eye, Edit, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getInvestors, Investor } from '../../lib/api/investors';

const ViewInvestors = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchInvestors = async (page: number = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await getInvestors({
        search: searchTerm,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        page,
        limit: 20
      });
      setInvestors(response.data);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.pages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load investors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchInvestors(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchInvestors(currentPage);
    }
  }, [currentPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'Suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Individual':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Corporate':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
      case 'Bank':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
      case 'MutualFund':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Investors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage investors and funding sources
          </p>
        </div>
        <button
          onClick={() => navigate('/investors/add')}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Add Investor
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Types</option>
          <option value="Individual">Individual</option>
          <option value="Corporate">Corporate</option>
          <option value="Bank">Bank</option>
          <option value="MutualFund">Mutual Fund</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />)}
          </div>
        ) : investors.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No investors found. Try clearing filters or adding new investors.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {investors.map((investor) => (
                  <tr key={investor._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">{investor.name}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{investor.email}</td>
                    <td className="px-5 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeColor(investor.investorType)}`}>
                        {investor.investorType}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{investor.phone || investor.city || 'N/A'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(investor.status)}`}>
                        {investor.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-3">
                        <button
                          onClick={() => navigate(`/investors/detail/${investor._id}`)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/investors/edit/${investor._id}`)}
                          className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Edit investor"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages} ({total} total investors)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewInvestors;