import { useState } from 'react';
import { Eye, Edit, Trash2, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BorrowerGroup {
    id: string;
    groupName: string;
    description: string;
    membersCount: number;
    leaderName: string;
    createdDate: string;
}

const MOCK_GROUPS: BorrowerGroup[] = [
    { id: '1', groupName: 'Mahila Shakti Mandal', description: 'Women entrepreneurs group in Mumbai', membersCount: 15, leaderName: 'Sunita Devi', createdDate: '2025-01-10' },
    { id: '2', groupName: 'Pune Auto Union', description: 'Auto rickshaw drivers association', membersCount: 58, leaderName: 'Ramesh Patil', createdDate: '2025-02-05' },
    { id: '3', groupName: 'Tech Startups Hub', description: 'Young entrepreneurs in Bangalore', membersCount: 12, leaderName: 'Ankit Verma', createdDate: '2025-03-12' },
];

const ViewBorrowerGroups = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = MOCK_GROUPS.filter(g => 
    g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.leaderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Borrower Groups</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage borrower groups and associations</p>
         </div>
         <button 
            onClick={() => navigate('/borrowers/groups/add')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2"
         >
            <span>+ Add Borrower Group</span>
         </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
         <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-400" />
            </div>
            <input 
                type="text"
                placeholder="Search groups..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Grid of Groups (Card View can be nice here, but Table is consistent) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
         <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Group Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leader</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Members</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredGroups.map((group) => (
                        <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 shrink-0 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                                        <Users size={20} />
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{group.groupName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{group.description}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {group.leaderName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                                    {group.membersCount} Members
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {group.createdDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <button className="text-gray-400 hover:text-blue-600"><Eye size={18} /></button>
                                    <button className="text-gray-400 hover:text-green-600"><Edit size={18} /></button>
                                    <button className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};

export default ViewBorrowerGroups;
