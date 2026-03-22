import { useState } from 'react';
import { UserPlus, Search, Shield } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Staff' | 'Manager';
    status: 'Active' | 'Inactive';
    lastActive: string;
}

const MOCK_USERS: User[] = [
    { id: 'USR-001', name: 'Admin User', email: 'admin@system.com', role: 'Admin', status: 'Active', lastActive: 'Just now' },
    { id: 'USR-002', name: 'Loan Officer 1', email: 'officer1@system.com', role: 'Staff', status: 'Active', lastActive: '2 hours ago' },
    { id: 'USR-003', name: 'Branch Manager', email: 'manager@system.com', role: 'Manager', status: 'Inactive', lastActive: '3 days ago' },
];

const ViewUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage system access and roles</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
            <UserPlus size={18} /> Add User
          </button>
       </div>

       <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="relative w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 dark:text-gray-400" />
                </div>
                <input 
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Active</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {MOCK_USERS.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                                <div className="text-gray-500 dark:text-gray-400">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Shield size={14} /> {user.role}
                            </td>
                            <td className="px-6 py-4 text-sm">
                                <span className={`px-2 text-xs font-semibold rounded-full ${
                                    user.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                    {user.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-gray-500 dark:text-gray-400">{user.lastActive}</td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                Edit Permissions
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
       </div>
    </div>
  );
};

export default ViewUsers;
