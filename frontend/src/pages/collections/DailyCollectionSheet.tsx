import CollectionSheetPage from "./CollectionSheetPage";
import { getDailyCollectionSheet } from "../../lib/api/collection";

const DailyCollectionSheet = () => {
  return (
    <CollectionSheetPage
      title="Daily Collection Sheet"
      description="Installments due today, with quick follow-up logging and cross-links to loan, borrower, and calendar context."
      channel="call"
      fetchSheet={getDailyCollectionSheet}
    />
  );
};

export default DailyCollectionSheet;
