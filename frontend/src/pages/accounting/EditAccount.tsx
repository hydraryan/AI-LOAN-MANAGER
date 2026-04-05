import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../lib/api/api';

type AccountForm = {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  balance: string;
};

const EditAccount = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<AccountForm>({
    code: '',
    name: '',
    type: 'Asset',
    balance: '0'
  });

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setFetching(true);
        const res = await API.get(`/accounts/${id}`);
        const acc = res.data;
        setFormData({
          code: String(acc.code || ''),
          name: String(acc.name || ''),
          type: (acc.type || 'Asset') as AccountForm['type'],
          balance: String(Number(acc.balance || 0))
        });
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Failed to load account');
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setLoading(true);
      setError('');
      await API.put(`/accounts/${id}`, {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        balance: Number(formData.balance)
      });
      navigate('/accounting');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-6 text-gray-600 dark:text-gray-300">Loading account...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Ledger Account</h1>
        <button onClick={() => navigate('/accounting')} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">Close</button>
      </div>

      <div className="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/account/settings/accounting-setup')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Settings: Accounting Setup</button>
          <button onClick={() => navigate('/reports/overview')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Reports</button>
          <button onClick={() => navigate('/audit-trail')} className="rounded border px-3 py-1.5 text-sm dark:border-gray-600 dark:text-gray-200">Audit Trail</button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Account Code</label>
          <input name="code" value={formData.code} onChange={handleChange} required className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Account Name</label>
          <input name="name" value={formData.name} onChange={handleChange} required className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Type</label>
          <select name="type" value={formData.type} onChange={handleChange} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expense</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">Balance</label>
          <input name="balance" type="number" value={formData.balance} onChange={handleChange} className="w-full rounded border px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/accounting')} className="rounded border px-4 py-2 dark:border-gray-700 dark:text-gray-200">Cancel</button>
          <button disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{loading ? 'Saving...' : 'Update Account'}</button>
        </div>
      </form>
    </div>
  );
};

export default EditAccount;
