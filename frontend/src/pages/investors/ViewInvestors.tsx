import { useState, useEffect } from 'react';
import { Eye, Edit, Plus, Search } from 'lucide-react';
import API from '../../lib/api/api';

type Investor = {
  _id: string;
  name: string;
  email: string;
  totalInvested: number;
  activeLoans: number;
  status: 'Active' | 'Pending';
};

const ViewInvestors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH REAL DATA
  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const res = await API.get<Investor[]>('/investors');
        setInvestors(res.data);
      } catch (err) {
        console.error('Error fetching investors', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, []);

  // 🔥 FILTER
  const filtered = investors.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Investors</h1>
          <p className="text-sm text-gray-500">
            Manage investors and funding sources
          </p>
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={18} /> Add Investor
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 border rounded flex items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />

          <input
            placeholder="Search investor..."
            className="w-full pl-10 pr-3 py-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                <th>Name</th>
                <th>Email</th>
                <th className="text-right">Total Invested</th>
                <th className="text-center">Active Loans</th>
                <th className="text-center">Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(inv => (
                <tr key={inv._id}>

                  <td className="font-medium">{inv.name}</td>

                  <td className="text-gray-500">{inv.email}</td>

                  <td className="text-right text-green-600 font-bold">
                    ₹{inv.totalInvested.toLocaleString()}
                  </td>

                  <td className="text-center">
                    {inv.activeLoans}
                  </td>

                  <td className="text-center">
                    <span
                      className={`px-2 rounded text-xs ${
                        inv.status === 'Active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>

                  <td className="flex gap-2 justify-end">
                    <Eye size={18} className="cursor-pointer" />
                    <Edit size={18} className="cursor-pointer" />
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No investors found
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInvestors;