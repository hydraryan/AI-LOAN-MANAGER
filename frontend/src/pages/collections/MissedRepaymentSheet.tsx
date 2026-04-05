import CollectionSheetPage from "./CollectionSheetPage";
import { getMissedCollectionSheet } from "../../lib/api/collection";

const MissedRepaymentSheet = () => {
  return (
    <CollectionSheetPage
      title="Missed Repayment Sheet"
      description="All overdue installments where repayment is still pending. Prioritize larger balances and oldest dues."
      channel="call"
      fetchSheet={getMissedCollectionSheet}
    />
  );
};

export default MissedRepaymentSheet;
