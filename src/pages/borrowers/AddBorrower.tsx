import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { Borrower } from '../../types';

const AddBorrower = () => {
  const navigate = useNavigate();
  const { setBorrowers } = useMockData();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    businessName: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    title: 'Mr',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    uniqueId: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBorrower: Borrower = {
        id: (Date.now()).toString(), // Simple ID generation
        ...formData,
        status: 'Active',
        balance: 0
    };

    setBorrowers(prev => [...prev, newBorrower]);

    // Simulate UX delay
    setTimeout(() => {
        navigate('/borrowers/view');
    }, 100);
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Borrower</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create a new borrower profile</p>
            </div>
            <button 
                onClick={() => navigate('/borrowers/view')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
                <X size={24} />
            </button>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
           <form onSubmit={handleSubmit} className="space-y-8">
               
               {/* Section 1: Personal Info */}
               <div>
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Personal Information</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="md:col-span-1">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                           <select 
                                name="title" 
                                value={formData.title} 
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                               <option>Mr</option>
                               <option>Mrs</option>
                               <option>Miss</option>
                               <option>Dr</option>
                               <option>Prof</option>
                               <option>Rev</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name <span className="text-red-500">*</span></label>
                           <input 
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name <span className="text-red-500">*</span></label>
                           <input 
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                       
                       <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                            <select 
                                name="gender" 
                                value={formData.gender} 
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option>Male</option>
                                <option>Female</option>
                            </select>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                           <input 
                                type="text"
                                name="businessName"
                                value={formData.businessName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unique ID</label>
                           <input 
                                type="text"
                                name="uniqueId"
                                value={formData.uniqueId}
                                onChange={handleChange}
                                placeholder="National ID / Passport"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                   </div>
               </div>

               {/* Section 2: Contact Info */}
               <div>
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Contact Information</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                           <input 
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
                           <input 
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                       <div className="md:col-span-2">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                           <input 
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                           <input 
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State / Province</label>
                           <input 
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zip Code</label>
                           <input 
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                           <input 
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                           />
                       </div>
                   </div>
               </div>

                {/* Section 3: Description */}
               <div>
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Additional Information</h3>
                   <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description / Notes</label>
                       <textarea 
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                       />
                   </div>
               </div>

               <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <button 
                        type="button" 
                        onClick={() => navigate('/borrowers/view')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                   >
                       Cancel
                   </button>
                   <button 
                        type="submit" 
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                   >
                       Save Borrower
                   </button>
               </div>

           </form>
       </div>
    </div>
  );
};

export default AddBorrower;
