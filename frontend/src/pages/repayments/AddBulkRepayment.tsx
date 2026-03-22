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
    { id: 1, loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'Cash' }
  ]);

  const [loading, setLoading] = useState(false);

  const addRow = () => {
    setEntries([
      ...entries,
      { id: Date.now(), loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'Cash' }
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

      const validEntries = entries.filter(e => e.loanId && e.amount > 0);

      if (validEntries.length === 0) {
        alert("Enter valid entries");
        return;
      }

      await bulkRepayment(validEntries);

      alert("Payments processed successfully");

      setEntries([
        { id: 1, loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'Cash' }
      ]);

    } catch (err) {
      console.error(err);
      alert("Error processing payments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Bulk Repayments</h1>
          <p className="text-sm text-gray-500">Enter multiple repayments</p>
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
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Method</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {entries.map(entry => (
              <tr key={entry.id}>
                <td>
                  <input
                    value={entry.loanId}
                    onChange={(e) => handleChange(entry.id, 'loanId', e.target.value)}
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={entry.amount}
                    onChange={(e) => handleChange(entry.id, 'amount', Number(e.target.value))}
                  />
                </td>

                <td>
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => handleChange(entry.id, 'date', e.target.value)}
                  />
                </td>

                <td>
                  <select
                    value={entry.method}
                    onChange={(e) => handleChange(entry.id, 'method', e.target.value)}
                  >
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Mobile Money</option>
                    <option>Cheque</option>
                  </select>
                </td>

                <td>
                  <button onClick={() => removeRow(entry.id)}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={addRow} className="p-4 flex items-center gap-2 text-blue-600">
          <Plus size={18} /> Add Row
        </button>
      </div>
    </div>
  );
};

export default AddBulkRepayment;