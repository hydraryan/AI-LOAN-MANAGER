import { useState, useEffect } from 'react';
import { Plus, Search, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';


type Borrower = {
  _id: string;
  name?: string;
  email?: string;
  userId?: {
    name?: string;
    email?: string;
  };
  phone?: string;
  address?: string;
};

type ProfileFilter = 'all' | 'linked' | 'manual';
type StatusType = 'success' | 'error';
type DeleteBlockGroup = { id: string; name: string };

const ViewBorrowers = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Borrower[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<StatusType>('success');
  const [deleteBlockedGroups, setDeleteBlockedGroups] = useState<DeleteBlockGroup[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [profileFilter, setProfileFilter] = useState<ProfileFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchBorrowers = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const res = await API.get<Borrower[]>('/borrowers');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setFetchError('Failed to load borrowers. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowers();
  }, []);

  const filtered = data.filter((b) => {
    const matchesSearch =
      (b.userId?.name || b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.userId?.email || b.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (profileFilter === 'linked') {
      return matchesSearch && !!b.userId;
    }

    if (profileFilter === 'manual') {
      return matchesSearch && !b.userId;
    }

    return matchesSearch;
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, profileFilter, pageSize, data.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: string) => {
    try {
      await API.delete(`/borrowers/${id}`);
      setData((prev) => prev.filter((b) => b._id !== id));
      setConfirmDeleteId('');
      setStatusType('success');
      setDeleteBlockedGroups([]);
      setStatusMessage('Borrower deleted successfully.');
    } catch (err: any) {
      console.error(err);
      const responseData = err?.response?.data;
      setStatusType('error');
      setStatusMessage(responseData?.error || 'Failed to delete borrower.');
      setDeleteBlockedGroups(
        responseData?.code === 'LEADER_REASSIGN_REQUIRED' && Array.isArray(responseData?.blockingGroups)
          ? responseData.blockingGroups
          : []
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold dark:text-white">Borrowers</h1>
        <button
          onClick={() => navigate('/borrowers/add')}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={18} /> Add Borrower
        </button>
      </div>

      {!!statusMessage && (
        <div className={`rounded border px-3 py-2 text-sm flex items-center justify-between gap-3 ${
          statusType === 'success'
            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
        }`}>
          <span>{statusMessage}</span>
          {statusType === 'error' && deleteBlockedGroups.length > 0 && (
            <button
              onClick={() => navigate(`/borrowers/groups/edit/${deleteBlockedGroups[0].id}`)}
              className="text-xs font-semibold underline whitespace-nowrap"
            >
              Reassign Leader
            </button>
          )}
        </div>
      )}

      {!!fetchError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{fetchError}</span>
          <button onClick={fetchBorrowers} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 rounded">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative md:w-96">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              placeholder="Search borrowers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-700"
            />
          </div>

          <select
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value as ProfileFilter)}
            className="border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          >
            <option value="all">All Profiles</option>
            <option value="linked">Linked User Profiles</option>
            <option value="manual">Manual Profiles</option>
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

      <div className="rounded-xl shadow-lg border dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto animate-fadein">
        {loading ? (
            <div className="p-6 text-center text-gray-400 dark:text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center">
              {/* Optionally use an SVG icon here if desired */}
              No borrowers found
            </div>
          ) : (
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((b) => (
                  <tr key={b._id} className="transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                    <td className="px-6 py-4 dark:text-gray-200">{b.userId?.name || b.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{b.userId?.email || b.email || b.phone || '-'}</td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button
                        onClick={() => navigate(`/borrowers/profile/${b._id}`)}
                        className="text-indigo-600 hover:underline"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/borrowers/edit/${b._id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                                            <button
                                              onClick={() => navigate(`/calendar?borrowerId=${b._id}`)}
                                              className="text-purple-600 hover:underline"
                                              title="View borrower events in calendar"
                                            >
                                              <Calendar size={16} />
                                            </button>
                      </button>
                      {confirmDeleteId === b._id ? (
                        <>
                          <button
                            onClick={() => handleDelete(b._id)}
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
                          onClick={() => setConfirmDeleteId(b._id)}
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

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
          <p>
            Showing {(currentPage - 1) * pageSize + 1}
            -
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
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

export default ViewBorrowers;