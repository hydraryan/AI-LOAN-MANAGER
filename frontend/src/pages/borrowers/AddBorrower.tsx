import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import API from '../../lib/api/api';

const AddBorrower = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    description: ''
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nextErrors: Record<string, string> = {};
    if (!formData.name.trim()) nextErrors.name = 'Name is required';
    if (!formData.email.trim()) nextErrors.email = 'Email is required';

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    const normalizedAddress = [formData.address, formData.city, formData.state, formData.country]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ');

    try {
      setLoading(true);

      await API.post('/borrowers', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: normalizedAddress,
        description: formData.description
      });

      navigate('/borrowers/view');

    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error creating borrower');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold dark:text-white">Add Borrower</h1>
        <button onClick={() => navigate('/borrowers/view')} className="dark:text-white">
          <X />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded space-y-6">

        {error && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <input name="name" placeholder="Full Name" onChange={handleChange} required className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>
          <input name="phone" placeholder="Phone" onChange={handleChange} required className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
          <input name="city" placeholder="City" onChange={handleChange} className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
          <input name="state" placeholder="State" onChange={handleChange} className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
          <input name="country" placeholder="Country" onChange={handleChange} className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
        </div>

        <input name="address" placeholder="Address" onChange={handleChange} className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />

        <textarea name="description" placeholder="Notes" onChange={handleChange} className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/borrowers/view')} className="border dark:border-gray-700 px-4 py-2 rounded dark:text-white">
            Cancel
          </button>

          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
            {loading ? "Saving..." : "Save Borrower"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddBorrower;