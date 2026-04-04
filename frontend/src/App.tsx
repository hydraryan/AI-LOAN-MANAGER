import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import ViewBorrowers from './pages/borrowers/ViewBorrowers';
import AddBorrower from './pages/borrowers/AddBorrower';
import ViewBorrowerGroups from './pages/borrowers/ViewBorrowerGroups';
import AddBorrowerGroup from './pages/borrowers/AddBorrowerGroup';
import ViewLoans from './pages/loans/ViewLoans';
import AddLoan from './pages/loans/AddLoan';
import LoanCalculator from './pages/loans/LoanCalculator';
import ViewRepayments from './pages/repayments/ViewRepayments';
import AddBulkRepayment from './pages/repayments/AddBulkRepayment';
import ViewSavings from './pages/savings/ViewSavings';
import AddSavings from './pages/savings/AddSavings';
import ViewInvestors from './pages/investors/ViewInvestors';
import AddInvestor from './pages/investors/AddInvestor';
import ViewCollateral from './pages/collateral/ViewCollateral';
import AddCollateral from './pages/collateral/AddCollateral';
import ReportsOverview from './pages/reports/ReportsOverview';
import ViewAccounting from './pages/accounting/ViewAccounting';
import AddAccount from './pages/accounting/AddAccount';
import ViewUsers from './pages/users/ViewUsers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
             <Route index element={<Home />} />
             <Route path="borrowers">
                <Route path="view" element={<ViewBorrowers />} />
                <Route path="add" element={<AddBorrower />} />
                <Route path="groups" element={<ViewBorrowerGroups />} />
                <Route path="groups/add" element={<AddBorrowerGroup />} />
                <Route path="*" element={<ViewBorrowers />} />
             </Route>
             <Route path="loans">
                <Route path="view" element={<ViewLoans />} />
                <Route path="add" element={<AddLoan />} />
                <Route path="calculator" element={<LoanCalculator />} />
                <Route path="*" element={<ViewLoans />} />
             </Route>
             <Route path="repayments">
                <Route path="view" element={<ViewRepayments />} />
                <Route path="bulk-add" element={<AddBulkRepayment />} />
                <Route path="*" element={<ViewRepayments />} />
             </Route>
             <Route path="savings">
                 <Route path="view" element={<ViewSavings />} />
               <Route path="add" element={<AddSavings />} />
                 <Route path="*" element={<ViewSavings />} />
             </Route>
             <Route path="investors">
                 <Route path="view" element={<ViewInvestors />} />
               <Route path="add" element={<AddInvestor />} />
                 <Route path="*" element={<ViewInvestors />} />
             </Route>
             <Route path="collateral">
                 <Route path="view" element={<ViewCollateral />} />
               <Route path="add" element={<AddCollateral />} />
                 <Route path="*" element={<ViewCollateral />} />
             </Route>
             <Route path="reports">
                 <Route path="*" element={<ReportsOverview />} />
             </Route>
             <Route path="accounting">
               <Route path="add" element={<AddAccount />} />
                 <Route path="*" element={<ViewAccounting />} />
             </Route>
             <Route path="users">
                 <Route path="*" element={<ViewUsers />} />
             </Route>
             {/* Fallback placeholders for other sections */}
             <Route path="calendar/*" element={<div className="p-10 text-gray-500 font-medium">Calendar Module Coming Soon</div>} />
             <Route path="collections/*" element={<div className="p-10 text-gray-500 font-medium">Collection Sheets Module Coming Soon</div>} />
             <Route path="audit-trail/*" element={<div className="p-10 text-gray-500 font-medium">Audit Trail Module Coming Soon</div>} />
             
             <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
