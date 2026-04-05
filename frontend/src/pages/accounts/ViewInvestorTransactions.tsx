import PageHeader from '../../components/Shared/PageHeader';

const ViewInvestorTransactions = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Investor Transactions" description="Track deposits, withdrawals, and payouts for investor accounts" />
      <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Transactions module route is now active. Next step is connecting transaction APIs and ledger table.
        </p>
      </div>
    </div>
  );
};

export default ViewInvestorTransactions;
