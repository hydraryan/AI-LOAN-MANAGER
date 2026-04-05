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
    interestRate: 12,
    duration: 12,
    cycle: 'Monthly',
    startDate: new Date().toISOString().split('T')[0]
  });

  const [schedule, setSchedule] = useState<AmortizationRow[]>([]);

  // 🔥 Calculation logic
  const calculateSchedule = () => {
    const principal = Number(params.amount);
    const rate = Number(params.interestRate) / 100;
    const duration = Number(params.duration);

    if (!principal || !duration) return;

    const monthlyPrincipal = principal / duration;
    const monthlyInterest = (principal * rate) / 12;
    const monthlyPayment = monthlyPrincipal + monthlyInterest;

    const rows: AmortizationRow[] = [];
    let balance = principal;

    for (let i = 1; i <= duration; i++) {
      balance -= monthlyPrincipal;
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
  }, []);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    calculateSchedule();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setParams({
      ...params,
      [e.target.name]:
        e.target.type === 'number'
          ? Number(e.target.value)
          : e.target.value
    });
  };

  // 🔥 totals
  const totalPrincipal = schedule.reduce((acc, r) => acc + r.principal, 0);
  const totalInterest = schedule.reduce((acc, r) => acc + r.interest, 0);
  const totalPayment = schedule.reduce((acc, r) => acc + r.totalPayment, 0);

  const exportSchedule = () => {
    if (schedule.length === 0) {
      return;
    }

    const rows = [
      ['Period', 'Payment Date', 'Principal', 'Interest', 'Total Payment', 'Balance'],
      ...schedule.map((row) => [
        String(row.period),
        row.paymentDate,
        row.principal.toFixed(2),
        row.interest.toFixed(2),
        row.totalPayment.toFixed(2),
        row.balance.toFixed(2)
      ]),
      ['Total', '', totalPrincipal.toFixed(2), totalInterest.toFixed(2), totalPayment.toFixed(2), '']
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `loan-schedule-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold dark:text-white">Loan Calculator</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Calculate repayment schedules and interest
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT PANEL */}
        <div className="bg-white dark:bg-gray-800 p-6 border dark:border-gray-700 rounded">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2 dark:text-white">
            <Calculator size={18} /> Parameters
          </h3>

          <form onSubmit={handleCalculate} className="space-y-4">

            <input
              type="number"
              name="amount"
              value={params.amount}
              onChange={handleChange}
              placeholder="Amount"
              className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white"
            />

            <input
              type="number"
              name="interestRate"
              value={params.interestRate}
              onChange={handleChange}
              placeholder="Interest %"
              className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white"
            />

            <input
              type="number"
              name="duration"
              value={params.duration}
              onChange={handleChange}
              placeholder="Months"
              className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white"
            />

            <input
              type="date"
              name="startDate"
              value={params.startDate}
              onChange={handleChange}
              className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white"
            />

            <button className="w-full bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2">
              <RefreshCw size={16} />
              Calculate
            </button>
          </form>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded overflow-hidden">

          {/* Header */}
          <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
            <h3 className="font-medium dark:text-white">Amortization Schedule</h3>

            <button
              onClick={exportSchedule}
              disabled={schedule.length === 0}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 disabled:opacity-50"
            >
              <Download size={16} /> Export
            </button>
          </div>

          {/* Table */}
          <div className="overflow-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Principal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Interest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>

              <tbody>
                {schedule.map(row => (
                  <tr key={row.period} className="border-t dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3">{row.period}</td>
                    <td className="px-4 py-3">{row.paymentDate}</td>
                    <td className="px-4 py-3">₹{row.principal.toFixed(2)}</td>
                    <td className="px-4 py-3">₹{row.interest.toFixed(2)}</td>
                    <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-medium">
                      ₹{row.totalPayment.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">₹{row.balance.toFixed(2)}</td>
                  </tr>
                ))}

                {schedule.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                      Run a calculation to generate your repayment schedule.
                    </td>
                  </tr>
                )}

                {/* Totals */}
                {schedule.length > 0 && (
                  <tr className="font-bold bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-t dark:border-gray-600">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3">₹{totalPrincipal.toFixed(2)}</td>
                    <td className="px-4 py-3">₹{totalInterest.toFixed(2)}</td>
                    <td className="px-4 py-3">₹{totalPayment.toFixed(2)}</td>
                    <td className="px-4 py-3">-</td>
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