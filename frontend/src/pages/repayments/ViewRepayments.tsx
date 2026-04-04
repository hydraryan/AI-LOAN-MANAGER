import { useEffect, useState } from 'react';
import { Eye, Edit, Filter, Download } from 'lucide-react';
import { getRepayments, RepaymentDisplay } from '../../lib/api/repayment';

const ViewRepayments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<RepaymentDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getRepayments();
        setData(res); // ✅ now typed
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = data.filter(r =>
    r.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Repayments</h1>

        {/* ✅ icons now used */}
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 border rounded">
            <Filter size={16} /> Filter
          </button>

          <button className="flex items-center gap-2 px-3 py-2 border rounded">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        placeholder="Search borrower..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="border px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:border-gray-700"
      />

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded shadow border dark:border-gray-700">
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Borrower</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(txn => (
                <tr key={txn.id}>
                  <td>{txn.id}</td>
                  <td>{txn.borrowerName}</td>
                  <td>₹{txn.amount}</td>
                  <td>{new Date(txn.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`px-2 rounded ${
                      txn.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {txn.status}
                    </span>
                  </td>

                  <td className="flex gap-2">
                    <Eye size={16} />
                    <Edit size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No repayments found
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewRepayments;