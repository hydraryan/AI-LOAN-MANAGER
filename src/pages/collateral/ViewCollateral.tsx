import { useState } from 'react';
import { Eye, Plus, Search, Filter } from 'lucide-react';

interface Collateral {
    id: string;
    type: string;
    productName: string; // "Toyota Camry", "Plot 45"
    borrowerName: string;
    value: number;
    serialNumber: string;
    status: 'Deposited' | 'Returned' | 'Sold';
    dateDeposited: string;
}

const MOCK_COLLATERAL: Collateral[] = [
    { id: 'COL-001', type: 'Vehicle', productName: 'Maruti Suzuki Swift', borrowerName: 'Rajesh Kumar', value: 350000, serialNumber: 'ENG-8849302', status: 'Deposited', dateDeposited: '2023-01-15' },
    { id: 'COL-002', type: 'Real Estate', productName: 'Plot at Hinjewadi', borrowerName: 'Priya Sharma', value: 4500000, serialNumber: 'TITLE-33342', status: 'Deposited', dateDeposited: '2023-02-10' },
    { id: 'COL-003', type: 'Electronics', productName: 'Gold Necklace (22k)', borrowerName: 'Sunita Verma', value: 80000, serialNumber: 'NA', status: 'Returned', dateDeposited: '2022-11-05' },
];

const ViewCollateral = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collateral Register</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track assets pledged as security</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
            <Plus size={18} /> Add Collateral
          </button>
       </div>

       <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
             <div className="relative w-full md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 dark:text-gray-400" />
                </div>
                <input 
                    type="text"
                    placeholder="Search collateral or owner..."
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Serial / Ref</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {MOCK_COLLATERAL.filter(c => c.productName.toLowerCase().includes(searchTerm.toLowerCase()) || c.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.productName}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{item.type}</td>
                            <td className="px-6 py-4 text-sm text-blue-600 dark:text-blue-400">{item.borrowerName}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">{item.serialNumber}</td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">₹{item.value.toLocaleString()}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 text-xs font-semibold rounded-full ${
                                    item.status === 'Deposited' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                    item.status === 'Returned' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                    {item.status}
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

export default ViewCollateral;
