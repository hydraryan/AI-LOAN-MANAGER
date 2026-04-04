import { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';

type Group = {
  _id: string;
  name: string;
  description: string;
  members: any[];
  leaderId?: {
    name?: string;
    userId?: {
      name?: string;
    };
  };
  createdAt: string;
};

const ViewBorrowerGroups = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH REAL GROUPS
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await API.get<Group[]>('/groups');
        setGroups(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // 🔥 FILTER
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.leaderId?.userId?.name || g.leaderId?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Borrower Groups</h1>
          <p className="text-sm text-gray-500">
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

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 rounded">
        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />

          <input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-700"
          />
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
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Members</th>
                <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g) => (
                <tr key={g._id} className="transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                  <td className="px-6 py-4 font-medium">{g.name}</td>
                  <td className="px-6 py-4">{g.leaderId?.userId?.name || g.leaderId?.name || '-'}</td>
                  <td className="px-6 py-4">{g.members.length}</td>
                  <td className="px-6 py-4 text-xxs text-gray-500 dark:text-gray-400">{new Date(g.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <button className="text-blue-600 hover:underline">Edit</button>
                    <button className="text-red-500 hover:underline">Delete</button>
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

export default ViewBorrowerGroups;