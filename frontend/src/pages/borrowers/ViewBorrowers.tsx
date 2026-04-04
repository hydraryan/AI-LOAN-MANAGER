import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
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

const ViewBorrowers = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Borrower[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filtered = data.filter(b =>
    (b.userId?.name || b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.userId?.email || b.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Borrowers</h1>
        <button
          onClick={() => navigate('/borrowers/add')}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Plus size={18} /> Add Borrower
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 border dark:border-gray-700 rounded">
        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            placeholder="Search borrowers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded dark:bg-gray-900 dark:text-white dark:border-gray-700"
          />
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
                {filtered.map((b) => (
                  <tr key={b._id} className="transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                    <td className="px-6 py-4">{b.userId?.name || b.name || '-'}</td>
                    <td className="px-6 py-4">{b.userId?.email || b.email || b.phone || '-'}</td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      {/* Actions can be added here if needed */}
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

export default ViewBorrowers;