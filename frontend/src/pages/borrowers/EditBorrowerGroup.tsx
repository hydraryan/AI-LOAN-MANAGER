import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Users, Search } from 'lucide-react';
import API from '../../lib/api/api';
import { getUsers, type User } from '../../lib/api/user';

type Borrower = {
  _id: string;
  name?: string;
  userId?: {
    name?: string;
  };
};

type GroupResponse = {
  _id: string;
  name?: string;
  description?: string;
  leaderId?: { _id?: string } | string;
  collectorId?: { _id?: string; name?: string; email?: string } | string;
  members?: Array<{ _id?: string } | string>;
};

const EditBorrowerGroup = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [collectors, setCollectors] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    leaderId: '',
    collectorId: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        setError('Invalid group id');
        setLoading(false);
        return;
      }

      try {
        const [borrowersRes, groupRes] = await Promise.all([
          API.get<Borrower[]>('/borrowers'),
          API.get<GroupResponse>(`/groups/${id}`)
        ]);

        const usersRes = await getUsers();

        const group = groupRes.data;
        setBorrowers(borrowersRes.data);
        setCollectors(usersRes);

        const leaderValue = typeof group.leaderId === 'string'
          ? group.leaderId
          : group.leaderId?._id || '';

        const memberIds = Array.isArray(group.members)
          ? group.members.map((m: any) => (typeof m === 'string' ? m : m._id)).filter(Boolean)
          : [];

        const collectorValue = typeof group.collectorId === 'string'
          ? group.collectorId
          : group.collectorId?._id || '';

        setFormData({
          groupName: group.name || '',
          description: group.description || '',
          leaderId: leaderValue,
          collectorId: collectorValue
        });
        setSelectedMembers(memberIds);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to load group details');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleMember = (borrowerId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(borrowerId)
        ? prev.filter((m) => m !== borrowerId)
        : [...prev, borrowerId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError('');
    const nextErrors: Record<string, string> = {};
    if (!formData.groupName.trim()) {
      nextErrors.groupName = 'Group name is required';
    }
    if (!formData.leaderId) {
      nextErrors.leaderId = 'Please select a group leader';
    }
    if (selectedMembers.length === 0) {
      nextErrors.members = 'Please select at least one member';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    try {
      setSaving(true);
      await API.put(`/groups/${id}`, {
        name: formData.groupName,
        description: formData.description,
        leaderId: formData.leaderId,
        collectorId: formData.collectorId,
        members: selectedMembers
      });
      navigate('/borrowers/groups');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update borrower group');
    } finally {
      setSaving(false);
    }
  };

  const filteredBorrowers = borrowers.filter((b) =>
    (b.userId?.name || b.name || '').toLowerCase().includes(memberSearch.toLowerCase())
  );

  const selectedCollector = collectors.find((collector) => collector.id === formData.collectorId);

  if (loading) {
    return <div className="p-6 text-gray-500 dark:text-gray-400">Loading group...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Edit Borrower Group</h1>
        <button onClick={() => navigate('/borrowers/groups')} className="text-gray-600 dark:text-gray-300">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded">
            <h3 className="flex items-center gap-2 mb-4 dark:text-white">
              <Users size={20} /> Group Details
            </h3>

            <input
              name="groupName"
              placeholder="Group Name"
              value={formData.groupName}
              onChange={handleChange}
              required
              className="w-full border dark:border-gray-700 px-3 py-2 rounded mb-4 dark:bg-gray-900 dark:text-white"
            />
            {fieldErrors.groupName && <p className="text-xs text-red-500 -mt-3 mb-3">{fieldErrors.groupName}</p>}

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border dark:border-gray-700 px-3 py-2 rounded mb-4 dark:bg-gray-900 dark:text-white"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <select
                  name="leaderId"
                  value={formData.leaderId}
                  onChange={handleChange}
                  className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select Leader</option>
                  {borrowers.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.userId?.name || b.name || 'Unknown'}
                    </option>
                  ))}
                </select>
                {fieldErrors.leaderId && <p className="text-xs text-red-500 mt-1">{fieldErrors.leaderId}</p>}
                <p className="text-xs text-gray-400 mt-1">Select group members first, then assign a leader</p>
              </div>

              <div>
                <select
                  name="collectorId"
                  value={formData.collectorId}
                  onChange={handleChange}
                  className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white"
                >
                  <option value="">Select Collector</option>
                  {collectors.map((collector) => (
                    <option key={collector.id} value={collector.id}>
                      {collector.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedCollector
                    ? `Selected collector: ${selectedCollector.name} (${selectedCollector.email})`
                    : 'Assign a collector if this group should route collection activity.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/borrowers/groups')} className="border dark:border-gray-700 px-4 py-2 rounded dark:text-white">
              Cancel
            </button>

            <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">
              {saving ? 'Saving...' : 'Update Group'}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded flex flex-col">
          <h3 className="mb-4 dark:text-white">Edit Members</h3>

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              placeholder="Search borrowers..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border dark:border-gray-700 rounded dark:bg-gray-900 dark:text-white"
            />
          </div>

          <div className="overflow-y-auto max-h-80 space-y-2">
            {filteredBorrowers.map((b) => (
              <div
                key={b._id}
                onClick={() => toggleMember(b._id)}
                className={`p-3 rounded cursor-pointer border ${
                  selectedMembers.includes(b._id)
                    ? 'bg-blue-600 dark:bg-blue-700 text-white dark:text-white border-blue-600 dark:border-blue-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {b.userId?.name || b.name || 'Unknown'}
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
            {selectedMembers.length} members selected
          </p>
          {fieldErrors.members && <p className="text-xs text-red-500 text-center mt-2">{fieldErrors.members}</p>}
        </div>
      </form>
    </div>
  );
};

export default EditBorrowerGroup;
