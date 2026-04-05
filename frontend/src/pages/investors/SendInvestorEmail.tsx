import PageHeader from '../../components/Shared/PageHeader';

const SendInvestorEmail = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Send Email to Investors" description="Broadcast email updates to investor audience" />
      <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Email broadcasting page is wired. Next step is integrating templates and delivery service.
        </p>
      </div>
    </div>
  );
};

export default SendInvestorEmail;
