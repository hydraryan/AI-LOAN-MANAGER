import { useState, useEffect } from 'react';
import { Eye, Plus, Search, Filter } from 'lucide-react';
import API from '../../lib/api/api';

type Collateral = {
  _id: string;
  type: string;
  productName: string;
  borrowerId: {
    userId: {
      name: string;
    };
  };
  value: number;
  serialNumber: string;
  status: 'Deposited' | 'Returned' | 'Sold';
  dateDeposited: string;
};

const ViewCollateral = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<Collateral[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH REAL DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get<Collateral[]>('/collateral');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching collateral', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = data.filter(c =>
    c.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.borrowerId?.userId?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Deposited':
        return 'bg-green-100 text-green-800';
      case 'Returned':
        return 'bg-gray-100 text-gray-800';
      case 'Sold':
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Collateral Register</h1>
          <p className="text-sm text-gray-500">
            Track pledged assets
          </p>
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus size={18} /> Add Collateral
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 border rounded flex justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />

          <input
            placeholder="Search..."
            className="pl-10 pr-3 py-2 border rounded w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="flex items-center gap-2 border px-3 py-2 rounded">
          <Filter size={16} /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded border overflow-hidden">

        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Serial</th>
                <th className="text-right">Value</th>
                <th className="text-center">Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(item => (
                <tr key={item._id}>

                  <td>{item.productName}</td>

                  <td>{item.type}</td>

                  <td className="text-blue-600">
                    {item.borrowerId?.userId?.name}
                  </td>

                  <td className="font-mono">{item.serialNumber}</td>

                  <td className="text-right font-bold">
                    ₹{item.value.toLocaleString()}
                  </td>

                  <td className="text-center">
                    <span className={`px-2 rounded text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>

                  <td>
                    <Eye size={18} className="cursor-pointer text-blue-600" />
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No collateral found
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewCollateral;