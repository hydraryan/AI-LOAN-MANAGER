import { useEffect, useState } from 'react';
import { Search, Shield } from 'lucide-react';
import { getUsers } from '../../lib/api/user';

interface User {
    id: string;
    name: string;
    email: string;
  role: 'Admin';
    lastActive: string;
}

const ViewUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  // 🔥 fetch from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View admin users with system access</p>
       </div>

       <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="relative w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
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

       <div className="rounded-xl shadow-lg border dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto animate-fadein">
         {users.length === 0 ? (
           <div className="p-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center">
             <Shield className="w-10 h-10 mb-2 text-gray-300 dark:text-gray-600" />
             No users found
           </div>
         ) : (
           <table className="min-w-full text-sm text-left">
             <thead className="bg-gray-50 dark:bg-gray-900/60">
               <tr>
                 <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">User</th>
                 <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Role</th>
                 <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right">Last Active</th>
                 <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               {users
                 .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                 .map((user) => (
                   <tr key={user.id} className="transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                     <td className="px-6 py-4 text-sm">
                       <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                       <div className="text-gray-500 dark:text-gray-400">{user.email}</div>
                     </td>
                     <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                       <Shield size={14} /> {user.role}
                     </td>
                     <td className="px-6 py-4 text-right text-sm text-gray-500">{user.lastActive}</td>
                     <td className="px-6 py-4 text-right flex gap-2 justify-end">
                       <button className="text-blue-600 hover:underline">Edit</button>
                       <button className="text-red-500 hover:underline">Delete</button>
                     </td>
                   </tr>
                 ))}
             </tbody>
           </table>
         )}
       </div>
    </div>
  );
};

export default ViewUsers;