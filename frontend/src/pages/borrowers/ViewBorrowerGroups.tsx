import { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';

type Group = {
  _id: string;
  name: string;
  description: string;
  members: any[];
  leaderId?: {
    userId?: {
      name: string;
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
    g.leaderId?.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="bg-white p-4 border rounded">
        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />

          <input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border overflow-hidden">

        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <table className="min-w-full">

            <thead>
              <tr>
                <th>Group</th>
                <th>Leader</th>
                <th>Members</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredGroups.map(group => (
                <tr key={group._id}>

                  <td>
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded">
                        <Users size={18} />
                      </div>

                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-xs text-gray-500">
                          {group.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    {group.leaderId?.userId?.name || 'N/A'}
                  </td>

                  <td>
                    <span className="text-blue-600">
                      {group.members?.length || 0} Members
                    </span>
                  </td>

                  <td>
                    {new Date(group.createdAt).toLocaleDateString()}
                  </td>

                  <td className="flex gap-2 justify-end">
                    <Eye size={18} className="cursor-pointer text-blue-600" />
                    <Edit size={18} className="cursor-pointer text-green-600" />
                    <Trash2 size={18} className="cursor-pointer text-red-600" />
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}

        {!loading && filteredGroups.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No groups found
          </div>
        )}
      </div>

    </div>
  );
};

export default ViewBorrowerGroups;