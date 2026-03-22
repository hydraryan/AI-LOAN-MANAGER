import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DATA_COLLECTIONS = [
    { name: 'Jan', collections: 400000 },
    { name: 'Feb', collections: 300000 },
    { name: 'Mar', collections: 200000 },
    { name: 'Apr', collections: 278000 },
    { name: 'May', collections: 189000 },
    { name: 'Jun', collections: 239000 },
    { name: 'Jul', collections: 349000 },
];

const DATA_LOAN_STATUS = [
    { name: 'Active', value: 400 },
    { name: 'Pending', value: 300 },
    { name: 'Defaulted', value: 100 },
    { name: 'Paid', value: 200 },
];

const DATA_PORTFOLIO = [
    { name: 'Business', value: 45 },
    { name: 'Personal', value: 25 },
    { name: 'Emergency', value: 15 },
    { name: 'Student', value: 15 },
];

const ReportsOverview = () => {
  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overview of key performance indicators</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Disbursements</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹1.2Cr</h3>
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1"><TrendingUp size={12} className="mr-1"/> +12% from last month</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active Borrowers</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">4,852</h3>
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1"><TrendingUp size={12} className="mr-1"/> +5% new users</p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                        <Users size={24} />
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">PAR (Portfolio At Risk)</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">4.2%</h3>
                        <p className="text-xs text-red-500 dark:text-red-400 flex items-center mt-1"><AlertCircle size={12} className="mr-1"/> +0.2% increase</p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                        <AlertCircle size={24} />
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Savings</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹34.5L</h3>
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1"><TrendingUp size={12} className="mr-1"/> +8% growth</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Monthly Collections</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={DATA_COLLECTIONS}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <RechartsTooltip formatter={(value: any) => [`₹${value?.toLocaleString()}`, 'Collections']} />
                            <Legend />
                            <Line type="monotone" dataKey="collections" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Loan Status Distribution</h3>
                <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={DATA_LOAN_STATUS}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {DATA_LOAN_STATUS.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                     </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Portfolio composition</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={DATA_PORTFOLIO} layout="vertical">
                             <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB"/>
                             <XAxis type="number" axisLine={false} tickLine={false} />
                             <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
                             <RechartsTooltip />
                             <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                {DATA_PORTFOLIO.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                             </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
             
             {/* Key Metrics Table */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Branch Performance</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Branch</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Disbursed</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Repayment %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {[
                                { name: 'Mumbai H.O.', disbursed: '₹50L', rate: '98%' },
                                { name: 'Pune Branch', disbursed: '₹32L', rate: '95%' },
                                { name: 'Bangalore Branch', disbursed: '₹28L', rate: '92%' },
                                { name: 'Delhi Branch', disbursed: '₹45L', rate: '96%' },
                            ].map((branch, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{branch.name}</td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-500 dark:text-gray-400">{branch.disbursed}</td>
                                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">{branch.rate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    </div>
  );
};

export default ReportsOverview;
