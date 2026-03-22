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
  const [currentStep, setCurrentStep] = useState(1);

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

  // 🔥 Fetch borrowers
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get<Borrower[]>('/borrowers');
        setBorrowers(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.borrowerId) {
      alert('Select borrower');
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      await createLoan({
        borrowerId: formData.borrowerId,
        principal: Number(formData.amount),
        interestRate: Number(formData.interestRate),
        tenureMonths: Number(formData.duration),
        status: 'approved'
      });

      alert('Loan created');
      navigate('/loans/view');
    } catch (err) {
      console.error(err);
      alert('Error creating loan');
    }
  };

  // 🔥 Step content
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <select
            name="borrowerId"
            value={formData.borrowerId}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
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
              className="w-full border px-3 py-2 rounded"
            />

            <input
              name="interestRate"
              placeholder="Interest %"
              type="number"
              value={formData.interestRate}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />

            <input
              name="duration"
              placeholder="Months"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
        );

      case 3:
        return (
          <div>
            <p>
              Total: ₹
              {(
                Number(formData.amount || 0) *
                (1 + Number(formData.interestRate || 0) / 100)
              ).toLocaleString()}
            </p>
          </div>
        );

      case 4:
        return <p>Ready to submit</p>;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">
          Create Loan ({currentStep}/{totalSteps})
        </h1>
        <button onClick={() => navigate('/loans/view')}>
          <X />
        </button>
      </div>

      {/* 🔥 Stepper UI (now used) */}
      <div className="flex justify-between">
        {steps.map(step => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                currentStep >= step.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200'
              }`}
            >
              <step.icon size={16} />
            </div>
            <span className="text-xs">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="border p-6 rounded">{renderStep()}</div>

      {/* Actions */}
      <div className="flex justify-between">
        <button onClick={handlePrev} disabled={currentStep === 1}>
          Back
        </button>

        {currentStep < totalSteps ? (
          <button onClick={handleNext}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Submit <Check size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default AddLoan;