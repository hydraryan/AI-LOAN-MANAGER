import PageHeader from '../../components/Shared/PageHeader';

const SendInvestorSms = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Send SMS to Investors" description="Broadcast SMS updates to investor audience" />
      <div className="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          SMS messaging page is wired. Next step is integrating an SMS provider and templates.
        </p>
      </div>
    </div>
  );
};

export default SendInvestorSms;
