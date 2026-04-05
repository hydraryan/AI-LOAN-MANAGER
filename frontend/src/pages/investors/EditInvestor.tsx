import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvestor, updateInvestor } from '../../lib/api/investors';
import type { InvestorType, InvestorStatus, KycStatus } from '../../types/investor';

type EditInvestorForm = {
  investorType: InvestorType;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  accountNumber: string;
  accountHolderName: string;
  ifscCode: string;
  kycStatus: KycStatus;
  status: InvestorStatus;
};

const EditInvestor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingInvestor, setLoadingInvestor] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState<EditInvestorForm>({
    investorType: 'Individual',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    kycStatus: 'Pending',
    status: 'Active'
  });

  useEffect(() => {
    const loadInvestor = async () => {
      if (!id) {
        setError('Investor id is missing');
        setLoadingInvestor(false);
        return;
      }

      try {
        setLoadingInvestor(true);
        const investor = await getInvestor(id);
        setName(investor.name);
        setEmail(investor.email);
        setFormData({
          investorType: investor.investorType,
          phone: investor.phone || '',
          address: investor.address || '',
          city: investor.city || '',
          state: investor.state || '',
          pincode: investor.pincode || '',
          accountNumber: investor.accountNumber || '',
          accountHolderName: investor.accountHolderName || '',
          ifscCode: investor.ifscCode || '',
          kycStatus: investor.kycStatus,
          status: investor.status
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load investor');
      } finally {
        setLoadingInvestor(false);
      }
    };

    loadInvestor();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name: field, value } = e.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await updateInvestor(id, {
        investorType: formData.investorType,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        pincode: formData.pincode || undefined,
        accountNumber: formData.accountNumber || undefined,
        accountHolderName: formData.accountHolderName || undefined,
        ifscCode: formData.ifscCode || undefined,
        kycStatus: formData.kycStatus,
        status: formData.status
      });

      setSuccess('Investor updated successfully!');
      setTimeout(() => navigate('/investors/view'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update investor');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvestor) {
    return <div className="text-gray-600 dark:text-gray-300">Loading investor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Investor</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Update investor profile and banking details</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input value={name} disabled className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input value={email} disabled className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Investor Type</label>
            <select name="investorType" value={formData.investorType} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="Individual">Individual</option>
              <option value="Corporate">Corporate</option>
              <option value="Bank">Bank</option>
              <option value="MutualFund">Mutual Fund</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">KYC Status</label>
            <select name="kycStatus" value={formData.kycStatus} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input name="address" value={formData.address} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
            <input name="city" value={formData.city} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
            <input name="state" value={formData.state} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
            <input name="pincode" value={formData.pincode} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
            <input name="accountNumber" value={formData.accountNumber} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Holder Name</label>
            <input name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code</label>
            <input name="ifscCode" value={formData.ifscCode} onChange={handleChange} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/investors/view')} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
          <button type="submit" disabled={loading} className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
};

export default EditInvestor;
