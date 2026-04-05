import { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';

type Group = {
  _id: string;
  name: string;
  description: string;
  members: any[];
  collectorId?: {
    name?: string;
    email?: string;
  } | string;
  leaderId?: {
    name?: string;
    userId?: {
      name?: string;
    };
  };
  createdAt: string;
};

type CollectorFilter = 'all' | 'assigned' | 'unassigned';

const ViewBorrowerGroups = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [collectorFilter, setCollectorFilter] = useState<CollectorFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 🔥 FETCH REAL GROUPS
  const fetchGroups = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const res = await API.get<Group[]>('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
      setFetchError('Failed to load borrower groups. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 🔥 FILTER
  const filteredGroups = groups.filter((g) => {
    const collectorName = typeof g.collectorId === 'string' ? '' : (g.collectorId?.name || '');
    const collectorEmail = typeof g.collectorId === 'string' ? '' : (g.collectorId?.email || '');

    const matchesSearch =
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.leaderId?.userId?.name || g.leaderId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      collectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collectorEmail.toLowerCase().includes(searchTerm.toLowerCase());

    if (collectorFilter === 'assigned') {
      return matchesSearch && !!collectorName;
    }

    if (collectorFilter === 'unassigned') {
      return matchesSearch && !collectorName;
    }

    return matchesSearch;
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, collectorFilter, pageSize, groups.length]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedGroups = filteredGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: string) => {
    try {
      await API.delete(`/groups/${id}`);
      setGroups((prev) => prev.filter((g) => g._id !== id));
      setConfirmDeleteId('');
      setStatusMessage('Borrower group deleted successfully.');
    } catch (err) {
      console.error(err);
      setStatusMessage('Failed to delete borrower group.');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Borrower Groups</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage borrower groups and associations
          </p>
        </div>

        <button
          onClick={() => navigate('/borrowers/groups/add')}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          + Add Borrower Group
        </button>
      </div>

      {!!statusMessage && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          {statusMessage}
        </div>
      )}

      {!!fetchError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{fetchError}</span>
          <button onClick={fetchGroups} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 rounded">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative md:w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />

            <input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>

          <select
            value={collectorFilter}
            onChange={(e) => setCollectorFilter(e.target.value as CollectorFilter)}
            className="border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          >
            <option value="all">All Collectors</option>
            <option value="assigned">Assigned Collector</option>
            <option value="unassigned">No Collector</option>
          </select>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl shadow-lg border dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto animate-fadein">
        {loading ? (
          <div className="p-6 text-center text-gray-400 dark:text-gray-500">Loading...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center">
            <Users className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" />
            No groups found
          </div>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Group</th>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Leader</th>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Collector</th>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Members</th>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedGroups.map((g) => (
                <tr key={g._id} className="transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{g.name}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{g.leaderId?.userId?.name || g.leaderId?.name || '-'}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {typeof g.collectorId === 'string' ? '-' : g.collectorId?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{g.members.length}</td>
                  <td className="px-6 py-4 text-xxs text-gray-500 dark:text-gray-400">{new Date(g.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => navigate(`/borrowers/groups/edit/${g._id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    {confirmDeleteId === g._id ? (
                      <>
                        <button
                          onClick={() => handleDelete(g._id)}
                          className="text-red-600 hover:underline"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId('')}
                          className="text-gray-500 hover:underline dark:text-gray-300"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(g._id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filteredGroups.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
          <p>
            Showing {(currentPage - 1) * pageSize + 1}
            -
            {Math.min(currentPage * pageSize, filteredGroups.length)} of {filteredGroups.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border dark:border-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border dark:border-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ViewBorrowerGroups;