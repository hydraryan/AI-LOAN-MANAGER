import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, X, Calendar, DollarSign, User } from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { LoanExtended } from '../../context/MockDataContext';

const AddLoan = () => {
  const navigate = useNavigate();
  const { borrowers, setLoans } = useMockData();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
      borrowerId: '',
      productId: '1',
      amount: '',
      interestRate: '',
      duration: '',
      releaseDate: '',
      repaymentCycle: 'Monthly'
  });

  const getBorrowerName = (id: string) => {
      const b = borrowers.find(b => b.id === id);
      return b ? `${b.firstName} ${b.lastName}` : 'Unknown';
  };

  const steps = [
      { id: 1, title: 'Borrower', icon: User },
      { id: 2, title: 'Loan Terms', icon: DollarSign },
      { id: 3, title: 'Schedule', icon: Calendar },
      { id: 4, title: 'Review', icon: Check },
  ];

  const handleNext = () => {
      if (currentStep < totalSteps) {
          if (currentStep === 1 && !formData.borrowerId) {
              alert('Please select a borrower');
              return;
          }
          setCurrentStep(currentStep + 1);
      }
  };

  const handleSubmit = () => {
      const loanAmount = Number(formData.amount);
      const interest = Number(formData.interestRate);
      
      const newLoan: LoanExtended = {
          id: `LN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          borrowerId: formData.borrowerId,
          borrowerName: getBorrowerName(formData.borrowerId),
          amount: loanAmount,
          releaseDate: formData.releaseDate,
          maturityDate: '2025-12-31', // Mock calculation
          status: 'Open',
          interestRate: interest,
          duration: Number(formData.duration),
          productName: formData.productId === '1' ? 'Business Loan' : 'Personal Loan',
          nextRepayment: '2025-03-01', // Mock
          amountPaid: 0
      };

      setLoans(prev => [newLoan, ...prev]);
      navigate('/loans/view');
  };

  const handlePrev = () => {
      if (currentStep > 1) {
          setCurrentStep(currentStep - 1);
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const renderStepContent = () => {
      switch(currentStep) {
          case 1:
              return (
                  <div className="space-y-4 animate-fadeIn">
                       <h3 className="text-xl font-semibold mb-4 dark:text-white">Select Borrower</h3>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Borrower</label>
                           <select 
                                name="borrowerId"
                                value={formData.borrowerId}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                           >
                               <option value="">Select a borrower...</option>
                               {borrowers.map(b => (
                                   <option key={b.id} value={b.id}>
                                       {b.firstName} {b.lastName} ({b.businessName})
                                   </option>
                               ))}
                           </select>
                           <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Or <button onClick={() => navigate('/borrowers/add')} className="text-blue-600 hover:underline dark:text-blue-400">add a new borrower</button></p>
                       </div>
                  </div>
              );
          case 2:
              return (
                  <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xl font-semibold mb-4 dark:text-white">Loan Terms</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Product</label>
                              <select 
                                   name="productId"
                                   value={formData.productId}
                                   onChange={handleChange}
                                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                              >
                                  <option value="1">Business Loan</option>
                                  <option value="2">Personal Loan</option>
                                  <option value="3">Emergency Loan</option>
                              </select>
                          </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Principal Amount</label>
                               <div className="relative">
                                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                       <span className="text-gray-500 dark:text-gray-400">$</span>
                                   </div>
                                    <input 
                                            type="number"
                                            name="amount"
                                            value={formData.amount}
                                            onChange={handleChange}
                                            className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                                            placeholder="0.00"
                                    />
                               </div>
                           </div>
                           <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Release Date</label>
                                <input 
                                        type="date"
                                        name="releaseDate"
                                        value={formData.releaseDate}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                                />
                           </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div>
                               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</label>
                               <input 
                                        type="number"
                                        name="interestRate"
                                        value={formData.interestRate}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                                        placeholder="12"
                                />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration</label>
                               <div className="flex gap-2">
                                   <input 
                                            type="number"
                                            name="duration"
                                            value={formData.duration}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                                            placeholder="12"
                                    />
                                    <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
                                        <option>Months</option>
                                        <option>Weeks</option>
                                    </select>
                               </div>
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repayment Cycle</label>
                               <select 
                                    name="repaymentCycle"
                                    value={formData.repaymentCycle}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
                               >
                                   <option>Daily</option>
                                   <option>Weekly</option>
                                   <option>Bi-Weekly</option>
                                   <option>Monthly</option>
                               </select>
                           </div>
                      </div>
                  </div>
              );
          case 3:
               return (
                  <div className="space-y-4 animate-fadeIn">
                       <h3 className="text-xl font-semibold mb-4 dark:text-white">Repayment Schedule Preview</h3>
                       <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4 border border-blue-100 dark:border-blue-800">
                           <div className="flex justify-between text-sm mb-2 dark:text-gray-300">
                               <span>Total Principal:</span>
                               <span className="font-bold">${Number(formData.amount || 0).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between text-sm mb-2 dark:text-gray-300">
                               <span>Total Interest:</span>
                               <span className="font-bold text-green-600 dark:text-green-400">${(Number(formData.amount || 0) * (Number(formData.interestRate || 0)/100)).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between text-lg font-bold border-t border-blue-200 dark:border-blue-800 pt-2 mt-2 dark:text-gray-200">
                               <span>Total Amount:</span>
                               <span className="text-blue-700 dark:text-blue-300">${(Number(formData.amount || 0) * (1 + (Number(formData.interestRate || 0)/100))).toLocaleString()}</span>
                           </div>
                       </div>
                       
                       <p className="text-sm text-gray-500 dark:text-gray-400 italic">This is a dynamic calculation based on the terms above. (Mock calculation)</p>
                  </div>
               );
          case 4:
              return (
                  <div className="space-y-4 animate-fadeIn">
                      <h3 className="text-xl font-semibold mb-4 text-center dark:text-white">Review Loan Application</h3>
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Check size={32} />
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">Ready to Submit</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
                              Please review the loan details carefully before submitting. This action will create a new loan application in "Active" status.
                          </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-6 dark:text-gray-300">
                            <div className="text-gray-500 dark:text-gray-400 text-right">Borrower:</div>
                            <div className="font-medium">{getBorrowerName(formData.borrowerId)}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-right">Amount:</div>
                            <div className="font-medium">${Number(formData.amount).toLocaleString()}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-right">Duration:</div>
                            <div className="font-medium">{formData.duration} {Number(formData.duration) === 1 ? 'Month' : 'Months'}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-right">Repayment:</div>
                            <div className="font-medium">{formData.repaymentCycle}</div>
                      </div>
                  </div>
              );
          default:
              return null;
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Loan</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Step {currentStep} of {totalSteps}</p>
            </div>
            <button 
                onClick={() => navigate('/loans/view')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
                <X size={24} />
            </button>
       </div>

       {/* Stepper Header */}
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
           <div className="flex items-center justify-between">
               {steps.map((step, index) => (
                   <div key={step.id} className="flex-1">
                       <div className="flex items-center">
                           <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                               currentStep >= step.id 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500'
                           }`}>
                               <step.icon size={16} />
                           </div>
                           <div className={`ml-2 text-sm font-medium hidden sm:block ${
                               currentStep >= step.id ? 'text-blue-900 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                           }`}>
                               {step.title}
                           </div>
                           {index < steps.length - 1 && (
                               <div className={`flex-1 h-0.5 mx-4 ${
                                   currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                               }`} />
                           )}
                       </div>
                   </div>
               ))}
           </div>
       </div>

       {/* Step Content */}
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 min-h-100">
           {renderStepContent()}
       </div>

       {/* Footer Actions */}
       <div className="flex justify-between pt-4">
           <button 
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
           >
               Back
           </button>
           
           {currentStep < totalSteps ? (
               <button 
                    onClick={handleNext}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 flex items-center gap-2"
               >
                   Next Step <ChevronRight size={16} />
               </button>
           ) : (
               <button 
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 flex items-center gap-2"
               >
                   Submit Application <Check size={16} />
               </button>
           )}
       </div>
    </div>
  );
};

export default AddLoan;
