import { useState, useEffect } from 'react';
import { Calculator, Download, RefreshCw } from 'lucide-react';

interface AmortizationRow {
    period: number;
    paymentDate: string;
    interest: number;
    principal: number;
    totalPayment: number;
    balance: number;
}

const LoanCalculator = () => {
  const [params, setParams] = useState({
      amount: 10000,
      interestRate: 12, // Annual
      duration: 12,
      cycle: 'Monthly',
      startDate: new Date().toISOString().split('T')[0]
  });

  const [schedule, setSchedule] = useState<AmortizationRow[]>([]);

  const calculateSchedule = () => {
      // Simplified Flat Rate calculation for demo
      // In real app, this would be complex (Reducing Balance, Flat Rate, etc.)
      
      const principal = Number(params.amount);
      const rate = Number(params.interestRate) / 100; // Annual
      const duration = Number(params.duration); // periods
      
      // Assume Flat Rate for simplicity
      
      // Flat Rate Formula per month:
      const monthlyPrincipal = principal / duration;
      const monthlyInterest = (principal * rate) / 12;
      const monthlyPayment = monthlyPrincipal + monthlyInterest;

      const rows: AmortizationRow[] = [];
      let balance = principal;

      for (let i = 1; i <= duration; i++) {
          balance -= monthlyPrincipal;
          // adjusting last payment for floating point errors
          if (i === duration) balance = 0;

          const date = new Date(params.startDate);
          date.setMonth(date.getMonth() + i);

          rows.push({
              period: i,
              paymentDate: date.toISOString().split('T')[0],
              interest: monthlyInterest,
              principal: monthlyPrincipal,
              totalPayment: monthlyPayment,
              balance: balance > 0 ? balance : 0
          });
      }
      setSchedule(rows);
  };

  useEffect(() => {
    calculateSchedule();
  }, []); // Run once on mount

  const handleCalculate = (e: React.FormEvent) => {
      e.preventDefault();
      calculateSchedule();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setParams({ ...params, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Calculator</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Calculate repayment schedules and interest</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Controls */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-fit">
               <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 flex items-center gap-2">
                   <Calculator size={20} className="text-blue-500"/>
                   Loan Parameters
               </h3>
               <form onSubmit={handleCalculate} className="space-y-4">
                   <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Principal Amount</label>
                       <input 
                            type="number"
                            name="amount"
                            value={params.amount}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                       />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (% Annual)</label>
                       <input 
                            type="number"
                            name="interestRate"
                            value={params.interestRate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                       />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                           <input 
                                type="number"
                                name="duration"
                                value={params.duration}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                           <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300" disabled>
                               <option>Months</option>
                           </select>
                       </div>
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repayment Cycle</label>
                       <select 
                            name="cycle"
                            value={params.cycle}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                       >
                           <option>Monthly</option>
                           <option>Weekly</option>
                           <option>Bi-Weekly</option>
                           <option>One-off</option>
                       </select>
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                       <input 
                            type="date"
                            name="startDate"
                            value={params.startDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                       />
                   </div>
                   
                   <div className="pt-2">
                       <button 
                            type="submit" 
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition"
                       >
                           <RefreshCw size={16} />
                           Calculate Schedule
                       </button>
                   </div>
               </form>
           </div>

           {/* Results Table */}
           <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
               <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                   <h3 className="text-lg font-medium text-gray-900 dark:text-white">Amortization Schedule</h3>
                   <button className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                       <Download size={16} /> Export PDF
                   </button>
               </div>
               <div className="overflow-auto flex-1 p-0">
                   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                       <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                           <tr>
                               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                               <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Principal</th>
                               <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Interest</th>
                               <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                               <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
                           </tr>
                       </thead>
                       <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                           {schedule.map((row) => (
                               <tr key={row.period} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                   <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{row.period}</td>
                                   <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{row.paymentDate}</td>
                                   <td className="px-4 py-2 text-sm text-gray-900 dark:text-white text-right">{row.principal.toFixed(2)}</td>
                                   <td className="px-4 py-2 text-sm text-gray-900 dark:text-white text-right">{row.interest.toFixed(2)}</td>
                                   <td className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 text-right">{row.totalPayment.toFixed(2)}</td>
                                   <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-right">{row.balance.toFixed(2)}</td>
                               </tr>
                           ))}
                           {schedule.length > 0 && (
                               <tr className="bg-blue-50 dark:bg-blue-900/30 font-bold dark:text-white">
                                   <td className="px-4 py-2 text-sm">Total</td>
                                   <td className="px-4 py-2 text-sm"></td>
                                   <td className="px-4 py-2 text-sm text-right">
                                       {schedule.reduce((acc, r) => acc + r.principal, 0).toFixed(2)}
                                   </td>
                                   <td className="px-4 py-2 text-sm text-right">
                                       {schedule.reduce((acc, r) => acc + r.interest, 0).toFixed(2)}
                                   </td>
                                   <td className="px-4 py-2 text-sm text-right">
                                       {schedule.reduce((acc, r) => acc + r.totalPayment, 0).toFixed(2)}
                                   </td>
                                   <td className="px-4 py-2 text-sm text-right">-</td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
           </div>
       </div>
    </div>
  );
};

export default LoanCalculator;
