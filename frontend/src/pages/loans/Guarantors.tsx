import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';

type Loan = {
  _id: string;
  borrowerId?: {
    name?: string;
    userId?: {
      name?: string;
    };
  };
  principal: number;
  status: string;
};

type Guarantor = {
  clientId?: string;
  _id?: string;
  name: string;
  phone?: string;
  relation?: string;
};

const createGuarantorClientId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `g-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const Guarantors = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const fetchGuarantors = async (loanId: string) => {
    try {
      const res = await API.get<{ guarantors: Guarantor[] }>(`/loans/${loanId}/guarantors`);
      setGuarantors(
        (res.data.guarantors || []).map((item) => ({
          ...item,
          clientId: item._id || createGuarantorClientId()
        }))
      );
    } catch (err) {
      console.error(err);
      setGuarantors([]);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setFetchError('');
      const res = await API.get<Loan[]>('/loans');
      setLoans(res.data);
      if (res.data.length > 0) {
        const initialLoanId = res.data[0]._id;
        setSelectedLoanId((prev) => prev || initialLoanId);
        await fetchGuarantors(initialLoanId);
      }
    } catch (err) {
      console.error(err);
      setFetchError('Failed to load loans for guarantor mapping.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  useEffect(() => {
    if (selectedLoanId) {
      fetchGuarantors(selectedLoanId);
    }
  }, [selectedLoanId]);

  const addRow = () => {
    setGuarantors((prev) => [
      ...prev,
      { clientId: createGuarantorClientId(), name: '', phone: '', relation: '' }
    ]);
  };

  const updateRow = (index: number, field: keyof Guarantor, value: string) => {
    setGuarantors((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeRow = (index: number) => {
    setGuarantors((prev) => prev.filter((_, i) => i !== index));
  };

  const saveGuarantors = async () => {
    if (!selectedLoanId) return;
    try {
      setSaving(true);
      setStatusMessage('');
      const payload = guarantors
        .map((item) => ({
          name: String(item.name || '').trim(),
          phone: String(item.phone || '').trim(),
          relation: String(item.relation || '').trim()
        }))
        .filter((item) => item.name.length > 0);

      const res = await API.put<{ guarantors: Guarantor[] }>(`/loans/${selectedLoanId}/guarantors`, {
        guarantors: payload
      });

      setGuarantors(
        (res.data.guarantors || []).map((item) => ({
          ...item,
          clientId: item._id || createGuarantorClientId()
        }))
      );
      setStatusMessage('Guarantors saved successfully.');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err?.response?.data?.error || 'Failed to save guarantors.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Guarantors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage loan guarantors with backend persistence.
          </p>
        </div>
        <button
          onClick={() => navigate('/loans/view')}
          className="px-3 py-2 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-200"
        >
          Back to Loans
        </button>
      </div>

      {!!statusMessage && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          {statusMessage}
        </div>
      )}

      {!!fetchError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 flex items-center justify-between gap-4">
          <span>{fetchError}</span>
          <button onClick={fetchLoans} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Select Loan</h2>
          {loading ? (
            <div className="p-2 text-gray-600 dark:text-gray-300">Loading loans...</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {loans.map((loan) => (
                <button
                  key={loan._id}
                  onClick={() => {
                    setSelectedLoanId(loan._id);
                    setStatusMessage('');
                  }}
                  className={`w-full text-left rounded border px-3 py-2 text-sm ${
                    selectedLoanId === loan._id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500'
                      : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  <p className="font-medium">{loan._id}</p>
                  <p className="text-xs opacity-80">{loan.borrowerId?.userId?.name || loan.borrowerId?.name || 'Unknown'}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded border dark:border-gray-700 overflow-x-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Guarantor Editor</h2>
            <button
              onClick={addRow}
              className="px-3 py-2 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-200"
            >
              Add Guarantor
            </button>
          </div>

          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Name</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Phone</th>
                <th className="px-4 py-3 text-gray-700 dark:text-gray-200">Relation</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {guarantors.map((item, index) => (
                <tr key={item.clientId || item._id || String(index)} className="border-t dark:border-gray-700">
                  <td className="px-4 py-3">
                    <input
                      value={item.name}
                      onChange={(e) => updateRow(index, 'name', e.target.value)}
                      className="w-full border rounded px-2 py-1 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={item.phone || ''}
                      onChange={(e) => updateRow(index, 'phone', e.target.value)}
                      className="w-full border rounded px-2 py-1 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={item.relation || ''}
                      onChange={(e) => updateRow(index, 'relation', e.target.value)}
                      className="w-full border rounded px-2 py-1 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeRow(index)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && guarantors.length === 0 && (
            <div className="py-4 text-gray-500 dark:text-gray-400">No guarantors added for this loan yet.</div>
          )}

          <div className="flex justify-end">
            <button
              onClick={saveGuarantors}
              disabled={!selectedLoanId || saving}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Guarantors'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guarantors;
