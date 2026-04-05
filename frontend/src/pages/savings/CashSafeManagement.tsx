import { useEffect, useMemo, useState } from 'react';
import { getCashSafe, getCashSafeSummary, recordCashSafeMovement, reconcileCashSafe, CashSafe, CashSafeMovement } from '../../lib/api/cashSafe';
import { ArrowLeft, CirclePlus, RefreshCcw, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CashSafeManagement = () => {
  const navigate = useNavigate();
  const [cashSafe, setCashSafe] = useState<CashSafe | null>(null);
  const [movements, setMovements] = useState<CashSafeMovement[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    type: 'deposit' as 'deposit' | 'withdrawal' | 'adjustment',
    amount: '',
    reference: '',
    notes: ''
  });
  const [reconcileBalance, setReconcileBalance] = useState('');
  const [reconcileNotes, setReconcileNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [safeData, summaryData] = await Promise.all([getCashSafe(), getCashSafeSummary()]);
      setCashSafe(safeData.cashSafe);
      setMovements(safeData.movements);
      setSummary(summaryData);
      setReconcileBalance(String(summaryData.currentBalance ?? safeData.cashSafe.currentBalance ?? 0));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load cash safe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = useMemo(() => ({
    currentBalance: summary?.currentBalance ?? cashSafe?.currentBalance ?? 0,
    deposits: summary?.deposits ?? 0,
    withdrawals: summary?.withdrawals ?? 0,
    adjustments: summary?.adjustments ?? 0,
    movements: summary?.movementCount ?? movements.length ?? 0
  }), [summary, cashSafe, movements.length]);

  const submitMovement = async () => {
    try {
      setError('');
      setMessage('');
      if (Number(form.amount) <= 0) {
        setError('Amount must be greater than zero');
        return;
      }

      await recordCashSafeMovement({
        type: form.type,
        amount: Number(form.amount),
        reference: form.reference,
        notes: form.notes,
        postedAt: new Date().toISOString()
      });
      setMessage('Cash safe movement recorded');
      setForm({ type: 'deposit', amount: '', reference: '', notes: '' });
      await loadData();
      setTimeout(() => setMessage(''), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record movement');
    }
  };

  const submitReconcile = async () => {
    try {
      setError('');
      setMessage('');
      await reconcileCashSafe({
        currentBalance: Number(reconcileBalance),
        notes: reconcileNotes
      });
      setMessage('Cash safe reconciled');
      await loadData();
      setTimeout(() => setMessage(''), 2500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reconcile cash safe');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/savings/view')} className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cash Safe Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track deposits, withdrawals, and reconciliations for the main cash safe.</p>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">{message}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Current Balance" value={`₹${Number(metrics.currentBalance || 0).toLocaleString()}`} icon={<Wallet size={18} />} />
        <StatCard label="Deposits" value={`₹${Number(metrics.deposits || 0).toLocaleString()}`} icon={<CirclePlus size={18} />} />
        <StatCard label="Withdrawals" value={`₹${Number(metrics.withdrawals || 0).toLocaleString()}`} icon={<RefreshCcw size={18} />} />
        <StatCard label="Movements" value={metrics.movements} icon={<Wallet size={18} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Record Movement</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Post a deposit, withdrawal, or adjustment to the safe.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <select value={form.type} onChange={(e) => setForm((current) => ({ ...current, type: e.target.value as any }))} className="rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))} placeholder="Amount" className="rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            <input value={form.reference} onChange={(e) => setForm((current) => ({ ...current, reference: e.target.value }))} placeholder="Reference" className="rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white md:col-span-2" />
            <textarea value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Notes" className="min-h-24 rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white md:col-span-2" />
          </div>

          <button onClick={submitMovement} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
            <CirclePlus size={18} /> Save Movement
          </button>
        </div>

        <div className="rounded-lg border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reconcile Safe</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Set the current counted balance and store notes for the reconciliation.</p>
          </div>

          <input type="number" min="0" step="0.01" value={reconcileBalance} onChange={(e) => setReconcileBalance(e.target.value)} className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          <textarea value={reconcileNotes} onChange={(e) => setReconcileNotes(e.target.value)} placeholder="Reconciliation notes" className="min-h-28 w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          <button onClick={submitReconcile} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700">
            <RefreshCcw size={18} /> Reconcile
          </button>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Movements</h2>
        </div>
        {loading ? (
          <div className="p-6 text-gray-600 dark:text-gray-300">Loading cash safe...</div>
        ) : movements.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No movements recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Type</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Reference</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Posted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {movements.map((movement) => (
                  <tr key={movement._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-3 text-sm capitalize text-gray-700 dark:text-gray-300">{movement.type}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">₹{Number(movement.amount || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{movement.reference || '-'}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{movement.notes || '-'}</td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{new Date(movement.postedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="mb-3 inline-flex rounded-md bg-sky-50 p-2 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300">{icon}</div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
);

export default CashSafeManagement;
