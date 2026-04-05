import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import API from '../../lib/api/api';

const EditBorrower = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isUserLinked, setIsUserLinked] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: ''
  });

  useEffect(() => {
    const loadBorrower = async () => {
      if (!id) {
        setError('Invalid borrower id');
        setLoading(false);
        return;
      }

      try {
        const res = await API.get(`/borrowers/${id}`);
        const borrower = res.data;
        const linked = Boolean(borrower.userId?._id || borrower.userId);
        setIsUserLinked(linked);

        setFormData({
          name: borrower.userId?.name || borrower.name || '',
          email: borrower.userId?.email || borrower.email || '',
          phone: borrower.phone || '',
          address: borrower.address || '',
          description: borrower.description || ''
        });
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to load borrower');
      } finally {
        setLoading(false);
      }
    };

    loadBorrower();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError('');
    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = 'Name is required';
    if (!formData.email.trim()) nextErrors.email = 'Email is required';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    try {
      setSaving(true);
      await API.put(`/borrowers/${id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        description: formData.description
      });
      navigate('/borrowers/view');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update borrower');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500 dark:text-gray-400">Loading borrower...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Edit Borrower</h1>
        <button onClick={() => navigate('/borrowers/view')} className="text-gray-600 dark:text-gray-300">
          <X />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded space-y-6">
        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required disabled={isUserLinked} className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed" />
            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
            {isUserLinked && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Name is managed by linked user account.</p>}
          </div>
          <div>
            <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required disabled={isUserLinked} className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed" />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            {isUserLinked && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email is managed by linked user account.</p>}
          </div>
          <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white" />
          <input name="address" placeholder="Address" value={formData.address} onChange={handleChange} className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white" />
        </div>

        <textarea name="description" placeholder="Notes" value={formData.description} onChange={handleChange} className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white" />

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/borrowers/view')} className="border dark:border-gray-700 px-4 py-2 rounded dark:text-white">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">
            {saving ? 'Saving...' : 'Update Borrower'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBorrower;
