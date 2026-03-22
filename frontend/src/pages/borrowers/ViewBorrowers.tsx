import { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Search, Filter, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';
import PageHeader from '../../components/Shared/PageHeader';

type Borrower = {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  phone: string;
  address: string;
};

const ViewBorrowers = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<Borrower[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH REAL BORROWERS
  useEffect(() => {
    const fetchBorrowers = async () => {
      try {
        const res = await API.get<Borrower[]>('/borrowers');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBorrowers();
  }, []);

  // 🔥 FILTER
  const filtered = data.filter(b =>
    b.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.userId?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <PageHeader
        title="Borrowers"
        description="View and manage all borrowers"
        actionLabel="Add Borrower"
        actionIcon={<Plus size={18} />}
        onAction={() => navigate('/borrowers/add')}
      />

      {/* Search */}
      <div className="bg-white p-4 border rounded flex justify-between items-center">

        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />

          <input
            placeholder="Search borrower..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded"
          />
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 border px-3 py-2 rounded">
            <Filter size={16} /> Filter
          </button>

          <button className="border px-3 py-2 rounded">
            Export
          </button>
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
                <th>Name</th>
                <th>Contact</th>
                <th>Address</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(b => (
                <tr key={b._id}>

                  <td>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 px-3 py-2 rounded-full">
                        {b.userId?.name?.charAt(0)}
                      </div>

                      <div>
                        <div className="font-medium">
                          {b.userId?.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {b._id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div>{b.phone}</div>
                    <div className="text-xs text-gray-500">
                      {b.userId?.email}
                    </div>
                  </td>

                  <td>{b.address}</td>

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

        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No borrowers found
          </div>
        )}
      </div>

    </div>
  );
};

export default ViewBorrowers;