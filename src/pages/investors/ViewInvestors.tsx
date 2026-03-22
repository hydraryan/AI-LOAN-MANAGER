import { useState } from 'react';
import { Eye, Edit, Plus, Search } from 'lucide-react';

interface Investor {
    id: string;
    name: string;
    email: string;
    totalInvested: number;
    activeLoans: number;
    status: 'Active' | 'Pending';
}

const MOCK_INVESTORS: Investor[] = [
    { id: 'INV-001', name: 'Bajaj Finance', email: 'invest@bajajfinserv.in', totalInvested: 50000000, activeLoans: 450, status: 'Active' },
    { id: 'INV-002', name: 'LIC Housing Finance', email: 'support@lichousing.com', totalInvested: 15000000, activeLoans: 120, status: 'Active' },
    { id: 'INV-003', name: 'Muthoot Finance', email: 'admin@muthoot.com', totalInvested: 0, activeLoans: 0, status: 'Pending' },
];

const ViewInvestors = () => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Investors</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage investors and funding sources</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
              <Plus size={18} /> Add Investor
            </button>
         </div>

         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="relative w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 dark:text-gray-400" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search investor..."
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Investor Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Contact</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Invested</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Active Loans</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {MOCK_INVESTORS.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{inv.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{inv.email}</td>
                                <td className="px-6 py-4 text-right text-sm font-bold text-green-600 dark:text-green-400">₹{inv.totalInvested.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white">{inv.activeLoans}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 text-xs font-semibold rounded-full ${
                                        inv.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                        {inv.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-medium">
                                    <button className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 mr-2"><Eye size={18} /></button>
                                    <button className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400"><Edit size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
         </div>
      </div>
    );
};

export default ViewInvestors;
