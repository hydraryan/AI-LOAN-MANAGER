import { useState } from 'react';
import { Eye, Edit, Filter, Download } from 'lucide-react';
import { Repayment } from '../../types';

// Extended Repayment Mock
interface RepaymentDisplay extends Repayment {
    borrowerName: string;
    collectedBy: string;
}

const MOCK_REPAYMENTS: RepaymentDisplay[] = [
    { id: 'TXN-001', loanId: 'LN-2025-001', borrowerName: 'Rajesh Kumar', amount: 8500, date: '2025-01-15', method: 'UPI', status: 'Approved', collectedBy: 'System' },
    { id: 'TXN-002', loanId: 'LN-2024-055', borrowerName: 'Vikram Singh', amount: 50000, date: '2025-01-16', method: 'Bank Transfer', status: 'Approved', collectedBy: 'Admin' },
    { id: 'TXN-003', loanId: 'LN-2025-001', borrowerName: 'Rajesh Kumar', amount: 8500, date: '2025-02-15', method: 'GPay', status: 'Pending', collectedBy: 'System' },
    { id: 'TXN-004', loanId: 'LN-2025-002', borrowerName: 'Priya Sharma', amount: 2000, date: '2025-02-18', method: 'Cash', status: 'Pending', collectedBy: 'Agent 01' },
];

const ViewRepayments = () => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Repayments</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">View and manage loan repayments</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                    + Add Payment
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                     <input 
                         type="text" 
                         className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                         placeholder="Search transaction ID or borrower..."
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                     />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm dark:text-gray-300">
                        <Filter size={16} /> Filter
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-sm dark:text-gray-300">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Transaction ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Borrower / Loan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {MOCK_REPAYMENTS.filter(r => r.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())).map((txn) => (
                                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{txn.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">{txn.borrowerName}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{txn.loanId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                        ₹{txn.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{txn.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{txn.method}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            txn.status === 'Approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 mr-2"><Eye size={18} /></button>
                                        <button className="text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400"><Edit size={18} /></button>
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

export default ViewRepayments;
