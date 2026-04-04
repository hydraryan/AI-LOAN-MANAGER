import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import API from '../../lib/api/api';

const AddBorrower = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await API.post('/borrowers', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.country}`
      });

      alert('Borrower created successfully');
      navigate('/borrowers/view');

    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.error) {
        alert(err.response.data.error);
      } else {
        alert('Error creating borrower');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Add Borrower</h1>
        <button onClick={() => navigate('/borrowers/view')}>
          <X />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded space-y-6">

        <div className="grid grid-cols-2 gap-4">
          <input name="name" placeholder="Full Name" onChange={handleChange} required className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
          <input name="phone" placeholder="Phone" onChange={handleChange} required className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
          <input name="city" placeholder="City" onChange={handleChange} className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
          <input name="state" placeholder="State" onChange={handleChange} className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
          <input name="country" placeholder="Country" onChange={handleChange} className="border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
        </div>

        <input name="address" placeholder="Address" onChange={handleChange} className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />

        <textarea name="description" placeholder="Notes" onChange={handleChange} className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/borrowers/view')} className="border px-4 py-2 rounded">
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