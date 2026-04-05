import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText } from 'lucide-react';
import {
  bulkRepayment,
  RepaymentBulkSkipped,
  RepaymentBulkWarning
} from '../../lib/api/repayment';

type CsvEntry = {
  loanId: string;
  amount: number;
  date: string;
  method: string;
};

const MAX_CSV_FILE_SIZE = 5_000_000;

const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime());
};

const detectDelimiter = (line: string) => {
  const commas = (line.match(/,/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
};

const parseCsv = (content: string): CsvEntry[] => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const delimiter = detectDelimiter(lines[0]);

  const hasHeader = /loanid/i.test(lines[0]);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const [loanId = '', amount = '0', date = '', method = ''] = line.split(delimiter).map((value) => value.trim());
    return {
      loanId,
      amount: Number(amount),
      date,
      method
    };
  });
};

const UploadRepaymentsCsv = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<CsvEntry[]>([]);
  const [raw, setRaw] = useState('loanId,amount,date,method');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [skippedRows, setSkippedRows] = useState<RepaymentBulkSkipped[]>([]);
  const [warningRows, setWarningRows] = useState<RepaymentBulkWarning[]>([]);

  const validEntries = useMemo(
    () => entries.filter((entry) => entry.loanId && entry.amount > 0 && isValidIsoDate(entry.date) && entry.method),
    [entries]
  );

  const handleFile = async (file: File) => {
    if (file.size > MAX_CSV_FILE_SIZE) {
      setError('File too large. Maximum allowed size is 5MB.');
      return;
    }

    const text = await file.text();
    setSelectedFileName(file.name);
    setRaw(text);
    setEntries(parseCsv(text));
    setError('');
    setSkippedRows([]);
    setWarningRows([]);
    setMessage('CSV parsed. Review rows before import.');
  };

  const parseTextArea = () => {
    setEntries(parseCsv(raw));
    setError('');
    setSelectedFileName('Pasted CSV text');
    setSkippedRows([]);
    setWarningRows([]);
    setMessage('CSV text parsed.');
  };

  const processEntries = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');
      setSkippedRows([]);
      setWarningRows([]);

      if (validEntries.length === 0) {
        setError('No valid repayment rows found. Ensure loanId, amount, date, and method are populated.');
        return;
      }

      const result = await bulkRepayment(validEntries);
      setSkippedRows(Array.isArray(result?.skipped) ? result.skipped : []);
      setWarningRows(Array.isArray(result?.warnings) ? result.warnings : []);
      setMessage(
        `Repayments imported. Processed: ${result?.processedCount || 0}, Skipped: ${result?.skippedCount || 0}, Warnings: ${result?.warningCount || 0}${result?.idempotentReplay ? ' (idempotent replay)' : ''}.`
      );
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to process repayment CSV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Repayments (CSV)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Import repayment entries with preview and validation.</p>
        </div>
        <button
          onClick={() => navigate('/repayments/view')}
          className="px-3 py-2 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-200"
        >
          Back to Repayments
        </button>
      </div>

      {!!message && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          {message}
        </div>
      )}

      {!!error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Upload CSV File</h2>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white cursor-pointer">
            <Upload size={16} /> Choose File
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFile(file);
                }
              }}
            />
          </label>

          <p className="text-xs text-gray-500 dark:text-gray-400">Expected columns: loanId, amount, date, method</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Selected file: {selectedFileName || 'None'}</p>

          <h3 className="font-medium text-gray-900 dark:text-white pt-2">Or Paste CSV</h3>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-full min-h-52 border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700"
          />

          <button
            onClick={parseTextArea}
            className="px-4 py-2 rounded border dark:border-gray-700 dark:text-white"
          >
            Parse CSV Text
          </button>
        </div>

        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Preview</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Rows parsed: {entries.length} | Valid rows: {validEntries.length}</p>

          <div className="max-h-72 overflow-auto border rounded dark:border-gray-700">
            <table className="min-w-full text-sm text-left">
              <caption className="sr-only">Repayment CSV preview table</caption>
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 py-2 text-gray-700 dark:text-gray-200">Loan ID</th>
                  <th className="px-3 py-2 text-gray-700 dark:text-gray-200">Amount</th>
                  <th className="px-3 py-2 text-gray-700 dark:text-gray-200">Date</th>
                  <th className="px-3 py-2 text-gray-700 dark:text-gray-200">Method</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={`${entry.loanId || 'row'}-${entry.date || 'na'}-${index}`} className="border-t dark:border-gray-700">
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{entry.loanId || '-'}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{entry.amount || 0}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{entry.date || '-'}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{entry.method || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={processEntries}
            disabled={loading}
            className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60 inline-flex items-center gap-2"
          >
            <FileText size={16} /> {loading ? 'Processing...' : 'Process Repayments'}
          </button>

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
        </div>
      </div>
    </div>
  );
};

export default UploadRepaymentsCsv;
