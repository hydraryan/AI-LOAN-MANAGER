import { useState } from 'react';
import { Eye, Plus, Search, Filter } from 'lucide-react';

interface SavingsAccount {
    id: string;
    accountNumber: string;
    borrowerName: string;
    productName: string;
    balance: number;
    interestRate: number;
    status: 'Active' | 'Dormant' | 'Closed';
}

const MOCK_SAVINGS: SavingsAccount[] = [
    { id: 'SAV-001', accountNumber: 'SA-100199', borrowerName: 'Rajesh Kumar', productName: 'Daily Deposit', balance: 120050, interestRate: 5, status: 'Active' },
    { id: 'SAV-002', accountNumber: 'SA-100200', borrowerName: 'Priya Sharma', productName: 'Fixed Deposit', balance: 500000, interestRate: 8, status: 'Active' },
    { id: 'SAV-003', accountNumber: 'SA-100201', borrowerName: 'Amit Patel', productName: 'Recurring Deposit', balance: 0, interestRate: 6, status: 'Dormant' },
];

const ViewSavings = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Savings Accounts</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage customer savings and deposits</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
            <Plus size={18} /> Add Account
          </button>
       </div>

       <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 dark:text-gray-400" />
                </div>
                <input 
                    type="text"
                    placeholder="Search account or name..."
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Account Holder</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Interest %</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {MOCK_SAVINGS.filter(s => s.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())).map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400">{account.accountNumber}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{account.borrowerName}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{account.productName}</td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">₹{account.balance.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">{account.interestRate}%</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 text-xs font-semibold rounded-full ${
                                    account.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                    {account.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"><Eye size={18} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
       </div>
    </div>
  );
};

export default ViewSavings;
