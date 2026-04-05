import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Check,
  X,
  Calendar,
  DollarSign,
  User
} from 'lucide-react';
import API from '../../lib/api/api';
import { createLoan } from '../../lib/api/loan';

type Borrower = {
  id: string;
  name: string;
};

const AddLoan = () => {
  const navigate = useNavigate();

  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [borrowersLoading, setBorrowersLoading] = useState(true);
  const [borrowersError, setBorrowersError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const [formData, setFormData] = useState({
    borrowerId: '',
    amount: '',
    interestRate: '',
    duration: ''
  });

  const totalSteps = 4;

  // 🔥 Stepper (now used)
  const steps = [
    { id: 1, title: 'Borrower', icon: User },
    { id: 2, title: 'Loan Terms', icon: DollarSign },
    { id: 3, title: 'Preview', icon: Calendar },
    { id: 4, title: 'Submit', icon: Check }
  ];

  const loadBorrowers = async () => {
    try {
      setBorrowersLoading(true);
      setBorrowersError('');
      const res = await API.get('/borrowers');
      const list = res.data.map((b: any) => ({
        id: b._id,
        name: b.userId?.name || b.name || 'Unknown'
      }));
      setBorrowers(list);
    } catch (err) {
      console.error(err);
      setBorrowersError('Failed to load borrowers. Please retry.');
    } finally {
      setBorrowersLoading(false);
    }
  };

  // 🔥 Fetch borrowers
  useEffect(() => {
    loadBorrowers();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (formError) setFormError('');
    if (statusMessage) setStatusMessage('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.borrowerId) {
      setFormError('Please select a borrower before continuing.');
      return;
    }

    if (currentStep === 2) {
      const amount = Number(formData.amount);
      const interestRate = Number(formData.interestRate);
      const duration = Number(formData.duration);

      if (!formData.amount || !formData.interestRate || !formData.duration || amount <= 0 || interestRate <= 0 || duration <= 0) {
        setFormError('Enter valid loan amount, interest rate, and duration (all must be greater than 0).');
        return;
      }
    }

    setFormError('');
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setFormError('');
      setStatusMessage('');
      await createLoan({
        borrowerId: formData.borrowerId,
        principal: Number(formData.amount),
        interestRate: Number(formData.interestRate),
        tenureMonths: Number(formData.duration),
        status: 'approved'
      });

      setStatusMessage('Loan created successfully. Redirecting to loans...');
      setTimeout(() => navigate('/loans/view'), 700);
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.error || 'Error creating loan');
    } finally {
      setSubmitting(false);
    }
  };

  // 🔥 Step content
  const renderStep = () => {
    const selectedBorrower = borrowers.find((b) => b.id === formData.borrowerId);
    const borrowerName = selectedBorrower?.name || 'Unknown';
    const principalAmount = Number(formData.amount || 0);
    const interestRate = Number(formData.interestRate || 0);
    const tenureMonths = Number(formData.duration || 0);
    const totalRepayment = principalAmount * (1 + interestRate / 100);

    switch (currentStep) {
      case 1:
        if (borrowersLoading) {
          return <p className="text-sm text-gray-500 dark:text-gray-400">Loading borrowers...</p>;
        }

        if (borrowersError) {
          return (
            <div className="space-y-3">
              <p className="text-sm text-red-600 dark:text-red-300">{borrowersError}</p>
              <button
                type="button"
                onClick={loadBorrowers}
                className="px-3 py-2 rounded border dark:border-gray-700 dark:text-white"
              >
                Retry
              </button>
            </div>
          );
        }

        if (borrowers.length === 0) {
          return (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No borrowers available. Create a borrower first, then return to add a loan.
            </p>
          );
        }

        return (
          <select
            name="borrowerId"
            value={formData.borrowerId}
            onChange={handleChange}
            className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white"
          >
            <option value="">Select borrower</option>
            {borrowers.map(b => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        );

      case 2:
        return (
          <div className="space-y-3">
            <input
              name="amount"
              placeholder="Amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
            />

            <input
              name="interestRate"
              placeholder="Interest %"
              type="number"
              value={formData.interestRate}
              onChange={handleChange}
              className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
            />

            <input
              name="duration"
              placeholder="Months"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              className="w-full border dark:border-gray-700 px-3 py-2 rounded dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
            />
          </div>
        );

      case 3:
        return (
          <div className="rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Loan Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Borrower</p>
                <p className="font-medium text-gray-900 dark:text-white">{borrowerName}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Principal Amount</p>
                <p className="font-medium text-gray-900 dark:text-white">₹{principalAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Interest Rate</p>
                <p className="font-medium text-gray-900 dark:text-white">{interestRate}%</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Tenure</p>
                <p className="font-medium text-gray-900 dark:text-white">{tenureMonths} months</p>
              </div>
              <div className="sm:col-span-2 pt-2 border-t dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">Total Repayment Amount</p>
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-lg">₹{totalRepayment.toLocaleString()}</p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4">
            <p className="text-emerald-700 dark:text-emerald-300 font-medium mb-3">
              All details confirmed. Click Submit to create the loan.
            </p>
            <ul className="text-sm text-emerald-800 dark:text-emerald-200 space-y-1">
              <li>Borrower: {borrowerName}</li>
              <li>Principal: ₹{principalAmount.toLocaleString()}</li>
              <li>Interest: {interestRate}%</li>
              <li>Tenure: {tenureMonths} months</li>
              <li>Total Repayment: ₹{totalRepayment.toLocaleString()}</li>
            </ul>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Create Loan ({currentStep}/{totalSteps})
        </h1>
        <button onClick={() => navigate('/loans/view')} className="text-gray-600 dark:text-gray-300">
          <X />
        </button>
      </div>

      {!!statusMessage && (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          {statusMessage}
        </div>
      )}

      {!!formError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {formError}
        </div>
      )}

      {/* 🔥 Stepper UI (now used) */}
      <div className="flex justify-between">
        {steps.map(step => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                currentStep >= step.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              }`}
            >
              <step.icon size={16} />
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="border dark:border-gray-700 p-6 rounded dark:bg-gray-800">{renderStep()}</div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1 || submitting}
          className="px-4 py-2 rounded border dark:border-gray-700 dark:text-white disabled:opacity-60"
        >
          Back
        </button>

        {currentStep < totalSteps ? (
          <button
            onClick={handleNext}
            disabled={submitting || (currentStep === 1 && borrowersLoading)}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit'} <Check size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default AddLoan;