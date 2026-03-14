import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Search } from 'lucide-react';

// Mock borrowers for selection
const MOCK_BORROWERS_SELECT = [
    { id: '1001', name: 'John Doe' },
    { id: '1002', name: 'Jane Smith' },
    { id: '1005', name: 'Sarah Davis' },
    { id: '1006', name: 'James Wilson' },
    { id: '1007', name: 'Patricia Brown' },
];

const AddBorrowerGroup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    leaderId: '',
    collectorId: ''
  });
  
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleMember = (id: string) => {
      setSelectedMembers(prev => 
        prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
      );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Group Created:', { ...formData, members: selectedMembers });
    setTimeout(() => {
        alert('Borrower Group created successfully!');
        navigate('/borrowers/groups');
    }, 500);
  };

  const filteredBorrowers = MOCK_BORROWERS_SELECT.filter(b => 
      b.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Borrower Group</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Create a new group and assign members</p>
            </div>
            <button 
                onClick={() => navigate('/borrowers/groups')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
                <X size={24} />
            </button>
       </div>

       <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Column: Group Details */}
           <div className="lg:col-span-2 space-y-6">
               <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
                       <Users size={20} className="text-blue-500"/>
                       Group Details
                   </h3>
                   <div className="grid grid-cols-1 gap-6">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Name <span className="text-red-500">*</span></label>
                           <input 
                                type="text"
                                name="groupName"
                                value={formData.groupName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                           <textarea 
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                           />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group Leader</label>
                                <select 
                                        name="leaderId"
                                        value={formData.leaderId}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                                >
                                    <option value="">Select a Leader...</option>
                                    {selectedMembers.map(id => {
                                        const member = MOCK_BORROWERS_SELECT.find(m => m.id === id);
                                        return member ? <option key={id} value={id}>{member.name}</option> : null;
                                    })}
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add members first to select a leader.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Collector</label>
                                <select 
                                        name="collectorId"
                                        value={formData.collectorId}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                                >
                                    <option value="">Select Staff...</option>
                                    <option value="1">Admin User</option>
                                    <option value="2">Loan Officer 1</option>
                                </select>
                            </div>
                       </div>
                   </div>
               </div>

               <div className="flex justify-end gap-4">
                   <button 
                        type="button" 
                        onClick={() => navigate('/borrowers/groups')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                   >
                       Cancel
                   </button>
                   <button 
                        type="submit" 
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                   >
                       Save Group
                   </button>
               </div>
           </div>

           {/* Right Column: Add Members */}
           <div className="lg:col-span-1">
               <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b dark:border-gray-700 pb-2 mb-4">Add Members</h3>
                   
                   <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Search borrowers..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                        />
                   </div>

                   <div className="flex-1 overflow-y-auto max-h-96 space-y-2">
                       {filteredBorrowers.map(borrower => (
                           <div 
                                key={borrower.id}
                                onClick={() => toggleMember(borrower.id)}
                                className={`flex items-center justify-between p-3 rounded-md cursor-pointer border transition-colors ${
                                    selectedMembers.includes(borrower.id)
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                                    : 'bg-gray-50 dark:bg-gray-700/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                           >
                               <div className="flex items-center gap-3">
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                       selectedMembers.includes(borrower.id) ? 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-100' : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-200'
                                   }`}>
                                       {borrower.name.charAt(0)}
                                   </div>
                                   <div>
                                       <p className={`text-sm font-medium ${selectedMembers.includes(borrower.id) ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                                           {borrower.name}
                                       </p>
                                       <p className="text-xs text-gray-500 dark:text-gray-400">ID: {borrower.id}</p>
                                   </div>
                               </div>
                               <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                   selectedMembers.includes(borrower.id)
                                   ? 'bg-blue-600 border-blue-600'
                                   : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'
                               }`}>
                                   {selectedMembers.includes(borrower.id) && (
                                       <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                       </svg>
                                   )}
                               </div>
                           </div>
                       ))}
                       {filteredBorrowers.length === 0 && (
                           <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No borrowers found.</p>
                       )}
                   </div>
                   
                   <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 text-center">
                       {selectedMembers.length} members selected
                   </div>
               </div>
           </div>

       </form>
    </div>
  );
};

export default AddBorrowerGroup;
