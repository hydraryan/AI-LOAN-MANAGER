import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, Trash2, Upload } from 'lucide-react';
import { bulkCreateSavingsTransactions } from '../../lib/api/savingsTransactions';

type BulkRow = {
  id: number;
  savingsAccountId: string;
  amount: string;
  requestedAmount: string;
  unappliedAmount: string;
  method: string;
  status: string;
  postedDate: string;
};

const createRow = (): BulkRow => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  savingsAccountId: '',
  amount: '',
  requestedAmount: '',
  unappliedAmount: '',
  method: 'Cash',
  status: 'pending',
  postedDate: new Date().toISOString().slice(0, 10)
});

const AddBulkSavingsTransactions = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<BulkRow[]>([createRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const validRows = useMemo(() => rows.filter((row) => row.savingsAccountId && Number(row.amount) > 0), [rows]);

  const updateRow = (id: number, field: keyof BulkRow, value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => setRows((current) => [...current, createRow()]);
  const removeRow = (id: number) => setRows((current) => current.length === 1 ? current : current.filter((row) => row.id !== id));

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      if (validRows.length === 0) {
        setError('Add at least one valid row with a savings account ID and amount.');
        return;
      }

      const result = await bulkCreateSavingsTransactions(
        validRows.map((row) => ({
          savingsAccountId: row.savingsAccountId,
          amount: Number(row.amount),
          requestedAmount: row.requestedAmount ? Number(row.requestedAmount) : Number(row.amount),
          unappliedAmount: row.unappliedAmount ? Number(row.unappliedAmount) : 0,
          method: row.method,
          status: row.status,
          date: row.postedDate
        }))
      );

      setMessage(`Processed ${result?.processedCount || 0} rows. Skipped ${result?.skippedCount || 0}.`);
      setRows([createRow()]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process bulk transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Bulk Transactions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter multiple savings transaction rows at once.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/savings-transactions/upload')} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 dark:border-gray-700 dark:text-white">
            <Upload size={18} /> Upload CSV
          </button>
          <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            <Save size={18} /> {loading ? 'Processing...' : 'Process Rows'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">{message}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard label="Rows" value={rows.length} />
        <MetricCard label="Valid Rows" value={validRows.length} tone="green" />
        <MetricCard label="Invalid Rows" value={rows.length - validRows.length} tone="amber" />
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Account ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Unapplied</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3"><input value={row.savingsAccountId} onChange={(e) => updateRow(row.id, 'savingsAccountId', e.target.value)} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Account ID" /></td>
                  <td className="px-4 py-3"><input type="number" min="0" value={row.amount} onChange={(e) => updateRow(row.id, 'amount', e.target.value)} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="0" /></td>
                  <td className="px-4 py-3"><input type="number" min="0" value={row.requestedAmount} onChange={(e) => updateRow(row.id, 'requestedAmount', e.target.value)} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="0" /></td>
                  <td className="px-4 py-3"><input type="number" min="0" value={row.unappliedAmount} onChange={(e) => updateRow(row.id, 'unappliedAmount', e.target.value)} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="0" /></td>
                  <td className="px-4 py-3">
                    <select value={row.method} onChange={(e) => updateRow(row.id, 'method', e.target.value)} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                      <option>Cash</option>
                      <option>Bank Transfer</option>
                      <option>System</option>
                      <option>Mobile Money</option>
                      <option>Cheque</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={row.status} onChange={(e) => updateRow(row.id, 'status', e.target.value)} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                    </select>
                  </td>
                  <td className="px-4 py-3"><input type="date" value={row.postedDate} onChange={(e) => updateRow(row.id, 'postedDate', e.target.value)} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeRow(row.id)} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:text-white">
                      <Trash2 size={16} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3 dark:border-gray-800">
          <button onClick={addRow} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm dark:border-gray-700 dark:text-white">
            <Plus size={16} /> Add Row
          </button>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter a savings account ID and amount for each row.</p>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, tone }: { label: string; value: string | number; tone?: 'green' | 'amber' }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${tone === 'green' ? 'text-green-600 dark:text-green-400' : tone === 'amber' ? 'text-amber-600 dark:text-amber-300' : 'text-gray-900 dark:text-white'}`}>{value}</p>
  </div>
);

export default AddBulkSavingsTransactions;
