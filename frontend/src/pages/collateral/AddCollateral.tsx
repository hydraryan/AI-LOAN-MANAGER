import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';

type Borrower = {
  _id: string;
  name?: string;
  userId?: {
    name?: string;
  };
};

const AddCollateral = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [formData, setFormData] = useState({
    borrowerId: '',
    productName: '',
    type: '',
    serialNumber: '',
    value: '0',
    status: 'Deposited'
  });

  useEffect(() => {
    const fetchBorrowers = async () => {
      try {
        const res = await API.get<Borrower[]>('/borrowers');
        setBorrowers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchBorrowers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await API.post('/collateral', {
        borrowerId: formData.borrowerId,
        productName: formData.productName,
        type: formData.type,
        serialNumber: formData.serialNumber,
        value: Number(formData.value),
        status: formData.status
      });
      navigate('/collateral/view');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add collateral');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add Collateral</h1>
        <button onClick={() => navigate('/collateral/view')} className="text-gray-500 hover:text-gray-700">Close</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded border space-y-4">
        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Borrower</label>
          <select
            name="borrowerId"
            value={formData.borrowerId}
            onChange={handleChange}
            required
            className="w-full border dark:border-gray-700 rounded px-3 py-2 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Select Borrower</option>
            {borrowers.map((b) => (
              <option key={b._id} value={b._id}>{b.userId?.name || b.name || 'Unknown'}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Product Name</label>
            <input name="productName" value={formData.productName} onChange={handleChange} required className="w-full border rounded px-3 py-2 dark:bg-gray-900" />
          </div>
          <div>
            <label className="block text-sm mb-1">Type</label>
            <input name="type" value={formData.type} onChange={handleChange} required className="w-full border rounded px-3 py-2 dark:bg-gray-900" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Serial Number</label>
            <input name="serialNumber" value={formData.serialNumber} onChange={handleChange} required className="w-full border rounded px-3 py-2 dark:bg-gray-900" />
          </div>
          <div>
            <label className="block text-sm mb-1">Estimated Value</label>
            <input name="value" type="number" min="0" value={formData.value} onChange={handleChange} required className="w-full border rounded px-3 py-2 dark:bg-gray-900" />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full border rounded px-3 py-2 dark:bg-gray-900">
            <option value="Deposited">Deposited</option>
            <option value="Returned">Returned</option>
            <option value="Sold">Sold</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/collateral/view')} className="px-4 py-2 border rounded">Cancel</button>
          <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Saving...' : 'Add Collateral'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddCollateral;
