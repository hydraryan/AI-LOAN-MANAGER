import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';

interface Account {
    id: string;
    code: string;
    name: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
    balance: number;
}

const MOCK_ACCOUNTS: Account[] = [
    { id: 'ACC-001', code: '1000', name: 'Cash on Hand (Petty Cash)', type: 'Asset', balance: 50400.00 },
    { id: 'ACC-002', code: '1010', name: 'Bank - HDFC', type: 'Asset', balance: 1250000.00 },
    { id: 'ACC-003', code: '2000', name: 'Member Savings', type: 'Liability', balance: 3405000.00 },
    { id: 'ACC-004', code: '4000', name: 'Interest Income', type: 'Revenue', balance: 450000.00 },
    { id: 'ACC-005', code: '5000', name: 'Office Rent - Mumbai', type: 'Expense', balance: 20000.00 },
];

const ViewAccounting = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chart of Accounts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage general ledger accounts</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
            <Plus size={18} /> Add Account
          </button>
       </div>

       <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="relative w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 dark:text-gray-400" />
                </div>
                <input 
                    type="text"
                    placeholder="Search account..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white text-sm">
                 <Filter size={16} /> Filter
             </button>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {MOCK_ACCOUNTS.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase())).map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">{account.code}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{account.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{account.type}</td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">₹{account.balance.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                Edit
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
       </div>
    </div>
  );
};

export default ViewAccounting;
