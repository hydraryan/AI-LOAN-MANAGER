import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CollateralRecord, getCollateral } from '../../lib/api/collateral';

type Collateral = CollateralRecord;

const ViewCollateral = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [linkFilter, setLinkFilter] = useState('All');
  const [minValueFilter, setMinValueFilter] = useState('');
  const [maxValueFilter, setMaxValueFilter] = useState('');
  const [data, setData] = useState<Collateral[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // 🔥 FETCH REAL DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setFetchError('');
        const res = await getCollateral();
        setData(res);
      } catch (err) {
        console.error('Error fetching collateral', err);
        setFetchError('Failed to load collateral register. Please retry.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const availableTypes = useMemo(() => {
    const unique = new Set(data.map((item) => (item.type || '').trim()).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filtered = useMemo(() => {
    const needle = searchTerm.toLowerCase();
    const minValue = minValueFilter ? Number(minValueFilter) : null;
    const maxValue = maxValueFilter ? Number(maxValueFilter) : null;

    return data.filter((c) => {
      const owner = (c.borrowerId?.userId?.name || c.borrowerId?.name || '').toLowerCase();
      const matchesSearch =
        c.productName.toLowerCase().includes(needle) ||
        owner.includes(needle) ||
        c.serialNumber.toLowerCase().includes(needle) ||
        c.type.toLowerCase().includes(needle) ||
        c.status.toLowerCase().includes(needle) ||
        (c.loanId?._id || '').toLowerCase().includes(needle) ||
        (c.loanId?.status || '').toLowerCase().includes(needle);

      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchesType = typeFilter === 'All' || c.type === typeFilter;
      const matchesLink =
        linkFilter === 'All' ||
        (linkFilter === 'Linked' && !!c.loanId?._id) ||
        (linkFilter === 'Unlinked' && !c.loanId?._id);
      const matchesMin = minValue === null || c.value >= minValue;
      const matchesMax = maxValue === null || c.value <= maxValue;

      return matchesSearch && matchesStatus && matchesType && matchesLink && matchesMin && matchesMax;
    });
  }, [data, linkFilter, maxValueFilter, minValueFilter, searchTerm, statusFilter, typeFilter]);

  const metrics = useMemo(() => {
    const totalValue = filtered.reduce((sum, item) => sum + Number(item.value || 0), 0);
    return {
      total: filtered.length,
      deposited: filtered.filter((item) => item.status === 'Deposited').length,
      returned: filtered.filter((item) => item.status === 'Returned').length,
      sold: filtered.filter((item) => item.status === 'Sold').length,
      totalValue
    };
  }, [filtered]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Deposited':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200';
      case 'Returned':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'Sold':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getLinkedLoanRiskLabel = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'defaulted') return 'Defaulted Loan';
    if (normalized === 'closed') return 'Closed Loan';
    return '';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collateral Register</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track pledged assets
          </p>
        </div>

        <button
          onClick={() => navigate('/collateral/add')}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Plus size={18} /> Add Collateral
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Records</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{metrics.total}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Deposited</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-300">{metrics.deposited}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Returned</p>
          <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{metrics.returned}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Sold</p>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-300">{metrics.sold}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Value</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">₹{metrics.totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 rounded space-y-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />

          <label htmlFor="collateral-search" className="sr-only">Search collateral records</label>
          <input
            id="collateral-search"
            placeholder="Search..."
            className="pl-10 pr-3 py-2 border rounded w-full dark:bg-gray-900 dark:text-white dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Filter size={16} /> Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          >
            <option value="All">All Statuses</option>
            <option value="Deposited">Deposited</option>
            <option value="Returned">Returned</option>
            <option value="Sold">Sold</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          >
            <option value="All">All Types</option>
            {availableTypes.map((itemType) => (
              <option key={itemType} value={itemType}>{itemType}</option>
            ))}
          </select>

          <select
            value={linkFilter}
            onChange={(e) => setLinkFilter(e.target.value)}
            className="border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          >
            <option value="All">All Loan Links</option>
            <option value="Linked">Linked to Loan</option>
            <option value="Unlinked">Not Linked</option>
          </select>

          <input
            type="number"
            min="0"
            placeholder="Min value"
            value={minValueFilter}
            onChange={(e) => setMinValueFilter(e.target.value)}
            className="border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          />

          <input
            type="number"
            min="0"
            placeholder="Max value"
            value={maxValueFilter}
            onChange={(e) => setMaxValueFilter(e.target.value)}
            className="border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          />
        </div>
      </div>

      {!!fetchError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{fetchError}</span>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                setFetchError('');
                const res = await getCollateral();
                setData(res);
              } catch {
                setFetchError('Failed to load collateral register. Please retry.');
              } finally {
                setLoading(false);
              }
            }}
            className="text-xs font-semibold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded border dark:border-gray-700 overflow-hidden">

        {loading ? (
          <div className="p-6 text-center text-gray-600 dark:text-gray-300">Loading...</div>
        ) : (
          <table className="min-w-full">
            <caption className="sr-only">Collateral register records table</caption>
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Item</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Owner</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Serial</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Linked Loan</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Value</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(item => (
                <tr key={item._id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.productName}</td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.type}</td>

                  <td className="px-4 py-3 text-blue-600 dark:text-blue-400">
                    {item.borrowerId?.userId?.name || item.borrowerId?.name || 'Unknown'}
                  </td>

                  <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{item.serialNumber}</td>

                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {item.loanId?._id ? (
                      <div className="space-y-1">
                        <button
                          onClick={() => navigate(`/loans/${item.loanId?._id}`)}
                          className="text-blue-600 dark:text-blue-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        >
                          {`Loan ${item.loanId._id.slice(-6)} (${item.loanId.status || 'unknown'})`}
                        </button>
                        {!!getLinkedLoanRiskLabel(item.loanId?.status) && (
                          <div>
                            <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              {getLinkedLoanRiskLabel(item.loanId?.status)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Not linked</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right font-bold text-gray-700 dark:text-gray-300">
                    ₹{item.value.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 rounded text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="text-right px-4 py-3">
                    <button
                      onClick={() => navigate(`/collateral/edit/${item._id}`)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                    >
                      Edit
                                        {item.loanId?._id && (
                                          <button
                                            onClick={() => navigate(`/calendar?loanId=${item.loanId._id}`)}
                                            title="View collateral events in calendar"
                                            className="ml-3 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded"
                                          >
                                            <Calendar size={18} />
                                          </button>
                                        )}
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No collateral found
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewCollateral;