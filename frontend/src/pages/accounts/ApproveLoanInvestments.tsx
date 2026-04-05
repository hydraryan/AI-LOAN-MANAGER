import PageHeader from '../../components/Shared/PageHeader';

const ApproveLoanInvestments = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Approve Loan Investments" description="Review and approve pending investment allocations" />
      <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Approval workflow route is now active. Next step is adding queue filtering and approve/reject actions.
        </p>
      </div>
    </div>
  );
};

export default ApproveLoanInvestments;
