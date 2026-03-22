import { useState, useEffect } from 'react';
import { Eye, Search, Filter, Download, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMockData } from '../../context/MockDataContext';
import PageHeader from '../../components/Shared/PageHeader';

const ViewLoans = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loans } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Parse path to set initial filters
  const path = location.pathname;
  useEffect(() => {
    if (path.includes('/loans/due')) setStatusFilter('Open');
    else if (path.includes('/loans/missed')) setStatusFilter('Defaulted'); // Simplify for now
    else if (path.includes('/loans/arrears')) setStatusFilter('Defaulted');
    else if (path.includes('/loans/past-maturity')) setStatusFilter('Open'); 
    else if (path.includes('/loans/view')) setStatusFilter('All');
  }, [path]);

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = 
        loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPageTitle = () => {
       if (path.includes('due')) return 'Due Loans';
       if (path.includes('arrears')) return 'Loans in Arrears';
       if (path.includes('missed')) return 'Missed Repayments';
       return 'All Loans';
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
          case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
          case 'Fully Paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
          case 'Defaulted': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
          case 'Restructured': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
          default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader 
        title={getPageTitle()}
        description="View and manage loan portfolio"
        actionLabel="Add Loan"
        actionIcon={<Plus size={18} />}
        onAction={() => navigate('/loans/add')}
      />

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
         <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto flex-1">
             <div className="relative flex-1 max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                    type="text"
                    placeholder="Search by name or loan ID..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             
             <select 
                title="Status Filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
             >
                 <option value="All">All Statuses</option>
                 <option value="Open">Open</option>
                 <option value="Pending">Pending</option>
                 <option value="Fully Paid">Fully Paid</option>
                 <option value="Defaulted">Defaulted</option>
             </select>
         </div>

         <div className="flex items-center gap-2 w-full md:w-auto">
             <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm bg-white dark:bg-gray-800 transition-colors">
                 <Filter size={16} />
                 <span>Advanced Filter</span>
             </button>
             <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm bg-white dark:bg-gray-800 transition-colors">
                 <Download size={16} />
                 <span>Export</span>
             </button>
         </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Loan ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Borrower</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Release</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Maturity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Next Payment</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredLoans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                                {loan.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{loan.borrowerName}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{loan.productName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">₹{loan.amount.toLocaleString()}</div>
                                <div className="text-xs text-green-600 dark:text-green-400">Paid: ₹{loan.amountPaid.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                                    {loan.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {loan.releaseDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {loan.maturityDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {loan.nextRepayment}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    <Eye size={18} />
                                </button>
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

export default ViewLoans;
