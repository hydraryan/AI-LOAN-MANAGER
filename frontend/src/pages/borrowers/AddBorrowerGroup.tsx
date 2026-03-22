import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Search } from 'lucide-react';
import API from '../../lib/api/api';

type Borrower = {
  _id: string;
  userId: {
    name: string;
  };
};

const AddBorrowerGroup = () => {
  const navigate = useNavigate();

  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    leaderId: '',
    collectorId: ''
  });

  // 🔥 FETCH REAL BORROWERS
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get<Borrower[]>('/borrowers');
        setBorrowers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id)
        ? prev.filter(m => m !== id)
        : [...prev, id]
    );
  };

  // 🔥 SUBMIT TO BACKEND
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await API.post('/groups', {
        name: formData.groupName,
        description: formData.description,
        leaderId: formData.leaderId,
        collectorId: formData.collectorId,
        members: selectedMembers
      });

      alert('Group created successfully');
      navigate('/borrowers/groups');

    } catch (err) {
      console.error(err);
      alert('Error creating group');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FILTER
  const filteredBorrowers = borrowers.filter(b =>
    b.userId?.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Add Borrower Group</h1>

        <button onClick={() => navigate('/borrowers/groups')}>
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white p-6 border rounded">
            <h3 className="flex items-center gap-2 mb-4">
              <Users size={20} /> Group Details
            </h3>

            <input
              name="groupName"
              placeholder="Group Name"
              value={formData.groupName}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <div className="grid grid-cols-2 gap-4">

              {/* Leader */}
              <select
                name="leaderId"
                value={formData.leaderId}
                onChange={handleChange}
                className="border px-3 py-2 rounded"
              >
                <option value="">Select Leader</option>
                {selectedMembers.map(id => {
                  const member = borrowers.find(b => b._id === id);
                  return member ? (
                    <option key={id} value={id}>
                      {member.userId.name}
                    </option>
                  ) : null;
                })}
              </select>

              {/* Collector */}
              <select
                name="collectorId"
                value={formData.collectorId}
                onChange={handleChange}
                className="border px-3 py-2 rounded"
              >
                <option value="">Select Collector</option>
                <option value="admin">Admin</option>
              </select>

            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/borrowers/groups')}>
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {loading ? 'Saving...' : 'Save Group'}
            </button>
          </div>

        </div>

        {/* RIGHT */}
        <div className="bg-white p-6 border rounded flex flex-col">

          <h3 className="mb-4">Add Members</h3>

          <div className="relative mb-4">
  <Search
    size={16}
    className="absolute left-3 top-2.5 text-gray-400"
  />

  <input
    placeholder="Search borrowers..."
    value={memberSearch}
    onChange={(e) => setMemberSearch(e.target.value)}
    className="w-full pl-9 pr-3 py-2 border rounded"
  />
</div>

          <div className="overflow-y-auto max-h-80 space-y-2">

            {filteredBorrowers.map(b => (
              <div
                key={b._id}
                onClick={() => toggleMember(b._id)}
                className={`p-3 rounded cursor-pointer border ${
                  selectedMembers.includes(b._id)
                    ? 'bg-blue-100'
                    : ''
                }`}
              >
                {b.userId.name}
              </div>
            ))}

          </div>

          <p className="mt-4 text-sm text-gray-500 text-center">
            {selectedMembers.length} members selected
          </p>

        </div>

      </form>
    </div>
  );
};

export default AddBorrowerGroup;