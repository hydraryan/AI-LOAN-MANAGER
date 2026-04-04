import { useState } from 'react';
import { Save, Upload, Plus, Trash2 } from 'lucide-react';
import { bulkRepayment } from '../../lib/api/repayment';

interface BulkEntry {
  id: number;
  loanId: string;
  amount: number;
  date: string;
  method: string;
}

const AddBulkRepayment = () => {
  const [entries, setEntries] = useState<BulkEntry[]>([
    { id: 1, loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: '' }
  ]);

  const [loading, setLoading] = useState(false);

  const addRow = () => {
    setEntries([
      ...entries,
      { id: Date.now(), loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: '' }
    ]);
  };

  const removeRow = (id: number) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const handleChange = (id: number, field: keyof BulkEntry, value: any) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const validEntries = entries.filter(e => e.loanId && e.amount > 0 && e.method);

      if (validEntries.length === 0) {
        alert("Enter valid entries");
        return;
      }

      await bulkRepayment(validEntries);

      alert("Payments processed successfully");

      setEntries([
        { id: 1, loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: '' }
      ]);

    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Error processing payments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Repayments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter multiple repayments</p>
        </div>

        <div className="flex gap-3">
          {/* ✅ Upload used */}
          <button className="bg-white border px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-50">
            <Upload size={18} /> Upload CSV
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Save size={18} /> {loading ? "Processing..." : "Process Payments"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-semibold">Loan ID</th>
              <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-semibold">Amount</th>
              <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-semibold">Date</th>
              <th className="px-4 py-2 text-left text-gray-900 dark:text-white font-semibold">Method</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-2">
                  <input
                    value={entry.loanId}
                    onChange={(e) => handleChange(entry.id, 'loanId', e.target.value)}
                    className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                  />
                </td>

                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={entry.amount}
                    onChange={(e) => handleChange(entry.id, 'amount', Number(e.target.value))}
                    className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                  />
                </td>

                <td className="px-4 py-2">
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => handleChange(entry.id, 'date', e.target.value)}
                    className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white"
                  />
                </td>

                <td className="px-4 py-2">
                  <select
                    value={entry.method}
                    onChange={(e) => handleChange(entry.id, 'method', e.target.value)}
                    className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Select Method</option>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Mobile Money</option>
                    <option>Cheque</option>
                  </select>
                </td>

                <td className="px-4 py-2">
                  <button onClick={() => removeRow(entry.id)} className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={addRow} className="px-4 py-2 flex items-center gap-2 text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:text-blue-700 border-t dark:border-gray-700">
          <Plus size={18} /> Add Row
        </button>
      </div>
    </div>
  );
};

export default AddBulkRepayment;