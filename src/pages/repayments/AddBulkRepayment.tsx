import { useState } from 'react';
import { Save, Upload, Plus, Trash2 } from 'lucide-react';

interface BulkEntry {
    id: number;
    loanId: string;
    amount: number;
    date: string;
    method: string;
}

const AddBulkRepayment = () => {
    const [entries, setEntries] = useState<BulkEntry[]>([
        { id: 1, loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'Cash' },
        { id: 2, loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'Bank Transfer' },
        { id: 3, loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'Mobile Money' },
    ]);

    const addRow = () => {
        setEntries([...entries, { id: entries.length + 1, loanId: '', amount: 0, date: new Date().toISOString().split('T')[0], method: 'Cash' }]);
    };

    const removeRow = (id: number) => {
        setEntries(entries.filter(e => e.id !== id));
    };

    const handleChange = (id: number, field: keyof BulkEntry, value: string | number) => {
        setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Repayments</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter multiple repayments at once</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <Upload size={18} /> Upload CSV
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
                        <Save size={18} /> Process Payments
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Loan Ref #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Method</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {entries.map((entry) => (
                            <tr key={entry.id}>
                                <td className="px-6 py-2">
                                    <input 
                                        type="text" 
                                        className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                        placeholder="LN-..."
                                        value={entry.loanId}
                                        onChange={(e) => handleChange(entry.id, 'loanId', e.target.value)}
                                    />
                                </td>
                                <td className="px-6 py-2">
                                    <input 
                                        type="number" 
                                        className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                        placeholder="0.00"
                                        value={entry.amount}
                                        onChange={(e) => handleChange(entry.id, 'amount', parseFloat(e.target.value))}
                                    />
                                </td>
                                <td className="px-6 py-2">
                                    <input 
                                        type="date" 
                                        className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                        value={entry.date}
                                        onChange={(e) => handleChange(entry.id, 'date', e.target.value)}
                                    />
                                </td>
                                <td className="px-6 py-2">
                                    <select 
                                        className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                        value={entry.method}
                                        onChange={(e) => handleChange(entry.id, 'method', e.target.value)}
                                    >
                                        <option>Cash</option>
                                        <option>Bank Transfer</option>
                                        <option>Mobile Money</option>
                                        <option>Cheque</option>
                                    </select>
                                </td>
                                <td className="px-6 py-2 text-center">
                                    <button 
                                        onClick={() => removeRow(entry.id)}
                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={addRow}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Another Row
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddBulkRepayment;
