import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../lib/api/api';
import { createCollateral } from '../../lib/api/collateral';

type Borrower = {
  _id: string;
  name?: string;
  userId?: {
    name?: string;
  };
};

type LoanOption = {
  _id: string;
  borrowerId?: {
    _id?: string;
  };
  status?: string;
};

const AddCollateral = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans, setLoans] = useState<LoanOption[]>([]);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    borrowerId: '',
    loanId: '',
    productName: '',
    type: '',
    serialNumber: '',
    value: '0',
    status: 'Deposited'
  });

  useEffect(() => {
    const fetchBorrowersAndLoans = async () => {
      try {
        const [borrowersRes, loansRes] = await Promise.all([
          API.get<Borrower[]>('/borrowers'),
          API.get<LoanOption[]>('/loans')
        ]);
        setBorrowers(borrowersRes.data || []);
        setLoans(loansRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBorrowersAndLoans();
  }, []);

  useEffect(() => {
    const borrowerIdParam = String(searchParams.get('borrowerId') || '').trim();
    const loanIdParam = String(searchParams.get('loanId') || '').trim();
    if (!borrowerIdParam && !loanIdParam) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      ...(borrowerIdParam ? { borrowerId: borrowerIdParam } : {}),
      ...(loanIdParam ? { loanId: loanIdParam } : {})
    }));
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (formError) setFormError('');
    const { name, value } = e.target;
    if (name === 'borrowerId') {
      setFormData((prev) => ({ ...prev, borrowerId: value, loanId: '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const borrowerLoans = loans.filter((loan) => (loan.borrowerId?._id || '') === formData.borrowerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setFormError('');
      await createCollateral({
        borrowerId: formData.borrowerId,
        ...(formData.loanId ? { loanId: formData.loanId } : {}),
        productName: formData.productName,
        type: formData.type,
        serialNumber: formData.serialNumber,
        value: Number(formData.value),
        status: formData.status as 'Deposited' | 'Returned' | 'Sold'
      });
      navigate('/collateral/view');
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to add collateral');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Collateral</h1>
        <button onClick={() => navigate('/collateral/view')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">Close</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded border dark:border-gray-700 space-y-4">
        {!!formError && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {formError}
          </div>
        )}

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Borrower</label>
          <select
            name="borrowerId"
            value={formData.borrowerId}
            onChange={handleChange}
            required
            className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <option value="">Select Borrower</option>
            {borrowers.map((b) => (
              <option key={b._id} value={b._id}>{b.userId?.name || b.name || 'Unknown'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Linked Loan (optional)</label>
          <select
            name="loanId"
            value={formData.loanId}
            onChange={handleChange}
            disabled={!formData.borrowerId}
            className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
          >
            <option value="">No linked loan</option>
            {borrowerLoans.map((loan) => (
              <option key={loan._id} value={loan._id}>
                {`Loan ${loan._id.slice(-6)} (${loan.status || 'unknown'})`}
              </option>
            ))}
          </select>
          {!formData.borrowerId && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Select a borrower first to link this collateral to one of their loans.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Product Name</label>
            <input name="productName" value={formData.productName} onChange={handleChange} required className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Type</label>
            <input name="type" value={formData.type} onChange={handleChange} required className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Serial Number</label>
            <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} required className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Estimated Value</label>
            <input name="value" type="number" min="1" step="0.01" value={formData.value} onChange={handleChange} required className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <option value="Deposited">Deposited</option>
            <option value="Returned">Returned</option>
            <option value="Sold">Sold</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/collateral/view')} className="px-4 py-2 border rounded dark:border-gray-700 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Cancel</button>
          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Saving...' : 'Add Collateral'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddCollateral;
