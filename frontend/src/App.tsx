import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './layouts/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import ViewBorrowers from './pages/borrowers/ViewBorrowers';
import AddBorrower from './pages/borrowers/AddBorrower';
import EditBorrower from './pages/borrowers/EditBorrower.tsx';
import BorrowerProfile from './pages/borrowers/BorrowerProfile';
import ViewBorrowerGroups from './pages/borrowers/ViewBorrowerGroups';
import AddBorrowerGroup from './pages/borrowers/AddBorrowerGroup';
import EditBorrowerGroup from './pages/borrowers/EditBorrowerGroup.tsx';
const ViewLoans = lazy(() => import('./pages/loans/ViewLoans'));
const AddLoan = lazy(() => import('./pages/loans/AddLoan'));
const LoanCalculator = lazy(() => import('./pages/loans/LoanCalculator'));
const LoanDetail = lazy(() => import('./pages/loans/LoanDetail'));
const LoanSegmentView = lazy(() => import('./pages/loans/LoanSegmentView'));
const Guarantors = lazy(() => import('./pages/loans/Guarantors'));
const LoanComments = lazy(() => import('./pages/loans/LoanComments'));
const ViewRepayments = lazy(() => import('./pages/repayments/ViewRepayments'));
const AddBulkRepayment = lazy(() => import('./pages/repayments/AddBulkRepayment'));
const UploadRepaymentsCsv = lazy(() => import('./pages/repayments/UploadRepaymentsCsv'));
const RepaymentCharts = lazy(() => import('./pages/repayments/RepaymentCharts'));
const ApproveRepayments = lazy(() => import('./pages/repayments/ApproveRepayments'));
const ViewCalendar = lazy(() => import('./pages/calendar/ViewCalendar'));
const DailyCollectionSheet = lazy(() => import('./pages/collections/DailyCollectionSheet'));
const MissedRepaymentSheet = lazy(() => import('./pages/collections/MissedRepaymentSheet'));
const PastMaturitySheet = lazy(() => import('./pages/collections/PastMaturitySheet'));
const SendCollectionSms = lazy(() => import('./pages/collections/SendCollectionSms'));
const SendCollectionEmail = lazy(() => import('./pages/collections/SendCollectionEmail'));
import ViewSavings from './pages/savings/ViewSavings';
import AddSavings from './pages/savings/AddSavings';
import EditSavings from './pages/savings/EditSavings';
import ViewTermDeposits from './pages/savings/ViewTermDeposits';
import AddTermDeposit from './pages/savings/AddTermDeposit';
import ViewInvestors from './pages/investors/ViewInvestors';
import AddInvestor from './pages/investors/AddInvestor';
import EditInvestor from './pages/investors/EditInvestor';
import InvestorDetail from './pages/investors/InvestorDetail';
import AddInvestorTransaction from './pages/investors/AddInvestorTransaction';
import InviteInvestors from './pages/investors/InviteInvestors';
import SendInvestorSms from './pages/investors/SendInvestorSms';
import SendInvestorEmail from './pages/investors/SendInvestorEmail';
import ViewInvestorAccounts from './pages/accounts/ViewInvestorAccounts';
import ManageInvestorAccount from './pages/accounts/ManageAccount';
import ViewInvestorTransactions from './pages/accounts/ViewInvestorTransactions';
import ApproveLoanInvestments from './pages/accounts/ApproveLoanInvestments';
import ViewInvestments from './pages/investments/ViewInvestments';
import ManageInvestment from './pages/investments/ManageInvestment';
import ViewCollateral from './pages/collateral/ViewCollateral';
import AddCollateral from './pages/collateral/AddCollateral';
import EditCollateral from './pages/collateral/EditCollateral.tsx';
import ReportsOverview from './pages/reports/ReportsOverview';
import LoanReport from './pages/reports/LoanReport.tsx';
import CollectionsReport from './pages/reports/CollectionsReport.tsx';
import ParReport from './pages/reports/ParReport.tsx';
import SavingsReport from './pages/reports/SavingsReport';
import SavingsFeeReport from './pages/reports/SavingsFeeReport';
import ViewSavingsTransactions from './pages/savings-transactions/ViewSavingsTransactions';
import AddBulkSavingsTransactions from './pages/savings-transactions/AddBulkSavingsTransactions';
import UploadSavingsTransactionsCsv from './pages/savings-transactions/UploadSavingsTransactionsCsv';
import ApproveSavingsTransactions from './pages/savings-transactions/ApproveSavingsTransactions';
import SavingsTransactionsReport from './pages/savings-transactions/SavingsTransactionsReport';
import CashSafeManagement from './pages/savings/CashSafeManagement';
import AccountSettings from './pages/account/AccountSettings';
import ViewAccounting from './pages/accounting/ViewAccounting';
import AddAccount from './pages/accounting/AddAccount';
import EditAccount from './pages/accounting/EditAccount';
import ViewUsers from './pages/users/ViewUsers';
import AddUser from './pages/users/AddUser';
import EditUser from './pages/users/EditUser.tsx';


function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6 text-gray-600 dark:text-gray-300">Loading page...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
             <Route index element={<Home />} />
             <Route path="borrowers">
                <Route path="view" element={<ViewBorrowers />} />
                <Route path="add" element={<AddBorrower />} />
               <Route path="edit/:id" element={<EditBorrower />} />
               <Route path="profile/:id" element={<BorrowerProfile />} />
                <Route path="groups" element={<ViewBorrowerGroups />} />
                <Route path="groups/add" element={<AddBorrowerGroup />} />
               <Route path="groups/edit/:id" element={<EditBorrowerGroup />} />
                <Route path="*" element={<ViewBorrowers />} />
             </Route>
             <Route path="loans">
                <Route path="view" element={<ViewLoans />} />
                <Route path="add" element={<AddLoan />} />
                <Route path="calculator" element={<LoanCalculator />} />
               <Route path=":id" element={<LoanDetail />} />
              <Route path="approve" element={<LoanSegmentView title="Approve Loans" description="Pending loans waiting for approval workflow actions." segment="approve" />} />
              <Route path="due" element={<LoanSegmentView title="Due Loans" description="Loans with installments due in the next 7 days." segment="due" />} />
              <Route path="missed" element={<LoanSegmentView title="Missed Repayments" description="Loans with at least one missed installment." segment="missed" />} />
              <Route path="arrears" element={<LoanSegmentView title="Loans in Arrears" description="Loans that have crossed at least one due date without full payment." segment="arrears" />} />
              <Route path="no-repayments" element={<LoanSegmentView title="No Repayments" description="Loans where no repayment has been recorded yet." segment="no-repayments" />} />
              <Route path="past-maturity" element={<LoanSegmentView title="Past Maturity Date" description="Loans past final due date with outstanding balances." segment="past-maturity" />} />
              <Route path="principal-outstanding" element={<LoanSegmentView title="Principal Outstanding" description="All loans that still have outstanding principal or schedule balances." segment="principal-outstanding" />} />
              <Route path="late-1-month" element={<LoanSegmentView title="1 Month Late Loans" description="Loans overdue by at least 30 days and less than 90 days." segment="late-1-month" />} />
              <Route path="late-3-months" element={<LoanSegmentView title="3 Months Late Loans" description="Loans overdue by 90 days or more." segment="late-3-months" />} />
              <Route path="guarantors" element={<Guarantors />} />
              <Route path="comments" element={<LoanComments />} />
                <Route path="*" element={<ViewLoans />} />
             </Route>
             <Route path="repayments">
                <Route path="view" element={<ViewRepayments />} />
                <Route path="bulk-add" element={<AddBulkRepayment />} />
              <Route path="upload" element={<UploadRepaymentsCsv />} />
              <Route path="charts" element={<RepaymentCharts />} />
              <Route path="approve" element={<ApproveRepayments />} />
                <Route path="*" element={<ViewRepayments />} />
             </Route>
             <Route path="savings">
                 <Route path="view" element={<ViewSavings />} />
                 <Route path="add" element={<AddSavings />} />
                 <Route path="edit/:id" element={<EditSavings />} />
                                 <Route path="term-deposits">
                   <Route index element={<ViewTermDeposits />} />
                                   <Route path="view" element={<ViewTermDeposits />} />
                                   <Route path="add" element={<AddTermDeposit />} />
                                   <Route path="*" element={<ViewTermDeposits />} />
                                 </Route>
                 <Route path="report" element={<SavingsReport />} />
                                 <Route path="products-report" element={<Navigate to="/reports/savings" replace />} />
                 <Route path="fee-report" element={<SavingsFeeReport />} />
                                 <Route path="charts" element={<Navigate to="/reports/savings" replace />} />
                 <Route path="cash-safe" element={<CashSafeManagement />} />
                 <Route path="*" element={<ViewSavings />} />
             </Route>
             <Route path="savings-transactions">
               <Route index element={<ViewSavingsTransactions />} />
               <Route path="view" element={<ViewSavingsTransactions />} />
               <Route path="bulk-add" element={<AddBulkSavingsTransactions />} />
               <Route path="upload" element={<UploadSavingsTransactionsCsv />} />
               <Route path="approve" element={<ApproveSavingsTransactions />} />
               <Route path="staff-report" element={<SavingsTransactionsReport />} />
               <Route path="*" element={<ViewSavingsTransactions />} />
             </Route>
             <Route path="investors">
                 <Route path="view" element={<ViewInvestors />} />
               <Route path="add" element={<AddInvestor />} />
               <Route path="add-transaction" element={<AddInvestorTransaction />} />
               <Route path="edit/:id" element={<EditInvestor />} />
               <Route path="detail/:id" element={<InvestorDetail />} />
               <Route path="invite" element={<InviteInvestors />} />
               <Route path="sms" element={<SendInvestorSms />} />
               <Route path="email" element={<SendInvestorEmail />} />
                 <Route path="*" element={<ViewInvestors />} />
             </Route>
             <Route path="accounts">
                 <Route path="view" element={<ViewInvestorAccounts />} />
               <Route path="add" element={<ManageInvestorAccount />} />
               <Route path="edit/:id" element={<ManageInvestorAccount />} />
               <Route path="transactions" element={<ViewInvestorTransactions />} />
               <Route path="approve" element={<ApproveLoanInvestments />} />
                 <Route path="*" element={<ViewInvestorAccounts />} />
             </Route>
             <Route path="investor-accounts">
               <Route path="view" element={<Navigate to="/accounts/view" replace />} />
               <Route path="add" element={<Navigate to="/accounts/add" replace />} />
               <Route path="investments" element={<Navigate to="/investments/view" replace />} />
               <Route path="transactions" element={<Navigate to="/accounts/transactions" replace />} />
               <Route path="approve" element={<Navigate to="/accounts/approve" replace />} />
               <Route path="*" element={<Navigate to="/accounts/view" replace />} />
             </Route>
             <Route path="investments">
                 <Route path="view" element={<ViewInvestments />} />
               <Route path="add" element={<ManageInvestment />} />
               <Route path="edit/:id" element={<ManageInvestment />} />
                 <Route path="*" element={<ViewInvestments />} />
             </Route>
             <Route path="collateral">
                 <Route path="view" element={<ViewCollateral />} />
               <Route path="add" element={<AddCollateral />} />
               <Route path="edit/:id" element={<EditCollateral />} />
                 <Route path="*" element={<ViewCollateral />} />
             </Route>
             <Route path="reports">
               <Route index element={<Navigate to="overview" replace />} />
               <Route path="overview" element={<ReportsOverview />} />
               <Route path="loans" element={<LoanReport />} />
               <Route path="collections" element={<CollectionsReport />} />
               <Route path="par" element={<ParReport />} />
               <Route path="savings" element={<SavingsReport />} />
               <Route path="savings-fees" element={<SavingsFeeReport />} />
               <Route path="fees" element={<Navigate to="/reports/savings-fees" replace />} />
               <Route path="*" element={<Navigate to="/reports/overview" replace />} />
             </Route>
             <Route path="account">
               <Route path="settings" element={<AccountSettings />} />
               <Route path="settings/:tab" element={<AccountSettings />} />
               <Route path="*" element={<Navigate to="settings" replace />} />
             </Route>
             <Route path="accounting">
               <Route index element={<ViewAccounting />} />
               <Route path="edit/:id" element={<EditAccount />} />
               <Route path="add" element={<AddAccount />} />
                 <Route path="*" element={<ViewAccounting />} />
             </Route>
             <Route path="users">
              <Route index element={<ViewUsers />} />
              <Route path="edit/:id" element={<EditUser />} />
              <Route path="add" element={<AddUser />} />
                 <Route path="*" element={<ViewUsers />} />
             </Route>
             <Route path="calendar/*" element={<ViewCalendar />} />
             <Route path="collections">
               <Route path="daily" element={<DailyCollectionSheet />} />
               <Route path="missed" element={<MissedRepaymentSheet />} />
               <Route path="past-maturity" element={<PastMaturitySheet />} />
               <Route path="sms" element={<SendCollectionSms />} />
               <Route path="email" element={<SendCollectionEmail />} />
               <Route path="*" element={<Navigate to="daily" replace />} />
             </Route>
             <Route path="audit-trail/*" element={<div className="p-10 text-gray-500 font-medium">Audit Trail Module Coming Soon</div>} />
             
             <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
