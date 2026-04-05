import PageHeader from '../../components/Shared/PageHeader';

const InviteInvestors = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Invite Investors" description="Send invitation links to potential investors" />
      <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Invitation workflow page is now wired and ready for provider integration.
        </p>
      </div>
    </div>
  );
};

export default InviteInvestors;
