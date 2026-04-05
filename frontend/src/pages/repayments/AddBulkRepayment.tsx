import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Upload, Plus, Trash2 } from 'lucide-react';
import {
  bulkRepayment,
  RepaymentBulkSkipped,
  RepaymentBulkWarning
} from '../../lib/api/repayment';

interface BulkEntry {
  id: number;
  loanId: string;
  amount: number;
  date: string;
  method: string;
}

const AddBulkRepayment = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<BulkEntry[]>([
    { id: 1, loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const [skippedRows, setSkippedRows] = useState<RepaymentBulkSkipped[]>([]);
  const [warningRows, setWarningRows] = useState<RepaymentBulkWarning[]>([]);

  const validRowCount = entries.filter(e => e.loanId && e.amount > 0 && e.date && e.method).length;

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
    if (formError) setFormError('');
    if (statusMessage) setStatusMessage('');
    if (skippedRows.length > 0) setSkippedRows([]);
    if (warningRows.length > 0) setWarningRows([]);
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setFormError('');
      setStatusMessage('');
      setSkippedRows([]);
      setWarningRows([]);

      const validEntries = entries.filter(e => e.loanId && e.amount > 0 && e.date && e.method);

      if (validEntries.length === 0) {
        setFormError('Enter at least one valid repayment row (loanId, amount, date, method).');
        return;
      }

      const result = await bulkRepayment(validEntries);
      const processed = Array.isArray(result?.results) ? result.results.length : 0;
      setSkippedRows(Array.isArray(result?.skipped) ? result.skipped : []);
      setWarningRows(Array.isArray(result?.warnings) ? result.warnings : []);
      setStatusType('success');
      setStatusMessage(
        `Payments processed successfully. Processed: ${processed}, Skipped: ${result?.skippedCount || 0}, Warnings: ${result?.warningCount || 0}${result?.idempotentReplay ? ' (idempotent replay)' : ''}.`
      );

      setEntries([
        { id: 1, loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: '' }
      ]);

    } catch (err: any) {
      console.error(err);
      setStatusType('error');
      setFormError(err.response?.data?.error || 'Error processing payments');
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
          <button
            onClick={() => navigate('/repayments/upload')}
            title="Go to repayment CSV upload workflow"
            className="bg-white dark:bg-gray-900 border dark:border-gray-700 px-4 py-2 rounded-md flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Upload size={18} /> Upload CSV
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-60"
          >
            <Save size={18} /> {loading ? "Processing..." : "Process Payments"}
          </button>
        </div>
      </div>

      {!!statusMessage && (
        <div className={`rounded border px-3 py-2 text-sm ${
          statusType === 'success'
            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
        }`}>
          {statusMessage}
        </div>
      )}

      {!!formError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Rows</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{entries.length}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Valid Rows</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">{validRowCount}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">Add at least one valid row before processing.</p>
        </div>
      </div>

      {skippedRows.length > 0 && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="font-semibold mb-1">Skipped Rows</p>
          <ul className="space-y-1">
            {skippedRows.slice(0, 8).map((row) => (
              <li key={`${row.inputIndex}-${row.loanId || 'na'}`}>Row #{row.inputIndex + 1} ({row.loanId || 'N/A'}): {row.reason}</li>
            ))}
          </ul>
          {skippedRows.length > 8 && <p className="mt-1">+{skippedRows.length - 8} more skipped rows.</p>}
        </div>
      )}

      {warningRows.length > 0 && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <p className="font-semibold mb-1">Warnings</p>
          <ul className="space-y-1">
            {warningRows.slice(0, 8).map((row) => (
              <li key={`${row.inputIndex}-${row.loanId}`}>Row #{row.inputIndex + 1} ({row.loanId}): {row.reason}</li>
            ))}
          </ul>
          {warningRows.length > 8 && <p className="mt-1">+{warningRows.length - 8} more warnings.</p>}
        </div>
      )}

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
                    min="0.01"
                    step="0.01"
                    value={entry.amount}
                    onChange={(e) => handleChange(entry.id, 'amount', Number(e.target.value))}
                    className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                  />
                </td>

                <td className="px-4 py-2">
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
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
                  <button
                    onClick={() => removeRow(entry.id)}
                    aria-label={`Remove repayment row ${entry.id}`}
                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  >
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