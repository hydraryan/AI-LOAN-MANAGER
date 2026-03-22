import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import API from '../../lib/api/api';

type RegisterResponse = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

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

      // ✅ typed API call
      const userRes = await API.post<RegisterResponse>('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: "123456"
      });

      const userId = userRes.data.user.id;

      await API.post('/borrowers', {
        userId,
        phone: formData.phone,
        address: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.country}`
      });

      alert('Borrower created successfully');
      navigate('/borrowers/view');

    } catch (err) {
      console.error(err);
      alert('Error creating borrower');
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

      <form onSubmit={handleSubmit} className="bg-white p-6 border rounded space-y-6">

        <div className="grid grid-cols-2 gap-4">
          <input name="name" placeholder="Full Name" onChange={handleChange} required className="border px-3 py-2 rounded" />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required className="border px-3 py-2 rounded" />
          <input name="phone" placeholder="Phone" onChange={handleChange} required className="border px-3 py-2 rounded" />
          <input name="city" placeholder="City" onChange={handleChange} className="border px-3 py-2 rounded" />
          <input name="state" placeholder="State" onChange={handleChange} className="border px-3 py-2 rounded" />
          <input name="country" placeholder="Country" onChange={handleChange} className="border px-3 py-2 rounded" />
        </div>

        <input name="address" placeholder="Address" onChange={handleChange} className="w-full border px-3 py-2 rounded" />

        <textarea name="description" placeholder="Notes" onChange={handleChange} className="w-full border px-3 py-2 rounded" />

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