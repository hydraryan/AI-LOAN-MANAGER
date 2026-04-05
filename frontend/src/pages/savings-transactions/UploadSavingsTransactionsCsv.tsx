import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp, Upload } from 'lucide-react';
import { bulkCreateSavingsTransactions } from '../../lib/api/savingsTransactions';

type CsvRow = {
  savingsAccountId: string;
  amount: number;
  requestedAmount?: number;
  unappliedAmount?: number;
  method: string;
  status: string;
  date: string;
};

const MAX_CSV_FILE_SIZE = 5 * 1024 * 1024;
const REQUIRED_COLUMNS = ['savingsaccountid', 'amount', 'method', 'status'];

const isValidDate = (value: string) => {
  if (!value) return true;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const hasRequiredColumns = (headerLine: string, delimiter: string) => {
  const header = headerLine
    .split(delimiter)
    .map((col) => col.trim().toLowerCase());
  return REQUIRED_COLUMNS.every((col) => header.includes(col));
};

const parseCsv = (content: string): CsvRow[] => {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const hasHeader = /savingsaccountid/i.test(lines[0]);

  if (hasHeader && !hasRequiredColumns(lines[0], delimiter)) {
    throw new Error('CSV header is invalid. Required columns: savingsAccountId, amount, method, status');
  }

  const dataLines = /savingsaccountid/i.test(lines[0]) ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const [savingsAccountId = '', amount = '0', requestedAmount = '', unappliedAmount = '', method = 'Cash', status = 'pending', date = ''] = line.split(delimiter).map((value) => value.trim());
    return {
      savingsAccountId,
      amount: Number(amount),
      requestedAmount: requestedAmount ? Number(requestedAmount) : undefined,
      unappliedAmount: unappliedAmount ? Number(unappliedAmount) : undefined,
      method,
      status,
      date
    };
  });
};

const UploadSavingsTransactionsCsv = () => {
  const navigate = useNavigate();
  const [raw, setRaw] = useState('savingsAccountId,amount,requestedAmount,unappliedAmount,method,status,date');
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.savingsAccountId &&
          row.amount > 0 &&
          (!Number.isFinite(row.requestedAmount as number) || (row.requestedAmount as number) >= row.amount) &&
          (!Number.isFinite(row.unappliedAmount as number) || (row.unappliedAmount as number) <= row.amount) &&
          isValidDate(row.date)
      ),
    [rows]
  );

  const handleFile = async (file: File) => {
    try {
      if (file.size > MAX_CSV_FILE_SIZE) {
        setError('File is too large. Maximum supported size is 5 MB.');
        return;
      }

      const text = await file.text();
      setRaw(text);
      setRows(parseCsv(text));
      setError('');
      setMessage(`Loaded ${file.name}`);
    } catch (err: any) {
      setRows([]);
      setError(err?.message || 'Failed to parse CSV file');
      setMessage('');
    }
  };

  const parseText = () => {
    try {
      setRows(parseCsv(raw));
      setError('');
      setMessage('CSV parsed for preview');
    } catch (err: any) {
      setRows([]);
      setError(err?.message || 'Failed to parse CSV text');
      setMessage('');
    }
  };

  const processRows = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      if (validRows.length === 0) {
        setError('No valid rows found. Each row needs savingsAccountId and amount.');
        return;
      }

      const result = await bulkCreateSavingsTransactions(
        validRows.map((row) => ({
          savingsAccountId: row.savingsAccountId,
          amount: row.amount,
          requestedAmount: row.requestedAmount ?? row.amount,
          unappliedAmount: row.unappliedAmount ?? 0,
          method: row.method || 'Cash',
          status: row.status || 'pending',
          date: row.date
        }))
      );

      setMessage(`Imported ${result?.processedCount || 0} rows. Skipped ${result?.skippedCount || 0}.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to import CSV rows');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Transactions (CSV)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Parse and preview a transaction CSV before import.</p>
        </div>
        <button onClick={() => navigate('/savings-transactions/view')} className="rounded-md border px-4 py-2 dark:border-gray-700 dark:text-white">
          Back to Transactions
        </button>
      </div>

      {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">File Upload</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Expected columns: savingsAccountId, amount, requestedAmount, unappliedAmount, method, status, date</p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
            <Upload size={18} /> Choose CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleFile(file);
              }
            }} />
          </label>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} className="min-h-64 w-full rounded-lg border px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          <button onClick={parseText} className="inline-flex items-center gap-2 rounded-md border px-4 py-2 dark:border-gray-700 dark:text-white">
            <FileUp size={18} /> Parse Text
          </button>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{rows.length} rows / {validRows.length} valid / {rows.length - validRows.length} invalid</p>
          </div>

          <div className="max-h-72 overflow-auto rounded-lg border dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">Account</th>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">Requested</th>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">Unapplied</th>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">Method</th>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-3 py-2 text-left text-gray-500 dark:text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.savingsAccountId}-${index}`} className="border-t dark:border-gray-800">
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.savingsAccountId || '-'}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.amount || 0}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.requestedAmount ?? '-'}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.unappliedAmount ?? '-'}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.method || '-'}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.status || '-'}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={processRows} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Importing...' : 'Import Rows'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadSavingsTransactionsCsv;
