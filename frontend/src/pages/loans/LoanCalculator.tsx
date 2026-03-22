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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Loan Calculator</h1>
        <p className="text-sm text-gray-500">
          Calculate repayment schedules and interest
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT PANEL */}
        <div className="bg-white p-6 border rounded">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Calculator size={18} /> Parameters
          </h3>

          <form onSubmit={handleCalculate} className="space-y-4">

            <input
              type="number"
              name="amount"
              value={params.amount}
              onChange={handleChange}
              placeholder="Amount"
              className="w-full border px-3 py-2 rounded"
            />

            <input
              type="number"
              name="interestRate"
              value={params.interestRate}
              onChange={handleChange}
              placeholder="Interest %"
              className="w-full border px-3 py-2 rounded"
            />

            <input
              type="number"
              name="duration"
              value={params.duration}
              onChange={handleChange}
              placeholder="Months"
              className="w-full border px-3 py-2 rounded"
            />

            <input
              type="date"
              name="startDate"
              value={params.startDate}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />

            <button className="w-full bg-blue-600 text-white py-2 rounded flex items-center justify-center gap-2">
              <RefreshCw size={16} />
              Calculate
            </button>
          </form>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-2 bg-white border rounded overflow-hidden">

          {/* Header */}
          <div className="p-4 flex justify-between items-center border-b">
            <h3 className="font-medium">Amortization Schedule</h3>

            <button className="flex items-center gap-2 text-blue-600">
              <Download size={16} /> Export
            </button>
          </div>

          {/* Table */}
          <div className="overflow-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Total</th>
                  <th>Balance</th>
                </tr>
              </thead>

              <tbody>
                {schedule.map(row => (
                  <tr key={row.period}>
                    <td>{row.period}</td>
                    <td>{row.paymentDate}</td>
                    <td>₹{row.principal.toFixed(2)}</td>
                    <td>₹{row.interest.toFixed(2)}</td>
                    <td className="text-blue-600 font-medium">
                      ₹{row.totalPayment.toFixed(2)}
                    </td>
                    <td>₹{row.balance.toFixed(2)}</td>
                  </tr>
                ))}

                {/* Totals */}
                {schedule.length > 0 && (
                  <tr className="font-bold bg-gray-100">
                    <td>Total</td>
                    <td></td>
                    <td>₹{totalPrincipal.toFixed(2)}</td>
                    <td>₹{totalInterest.toFixed(2)}</td>
                    <td>₹{totalPayment.toFixed(2)}</td>
                    <td>-</td>
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