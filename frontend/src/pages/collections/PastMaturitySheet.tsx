import CollectionSheetPage from "./CollectionSheetPage";
import { getPastMaturityCollectionSheet } from "../../lib/api/collection";

const PastMaturitySheet = () => {
  return (
    <CollectionSheetPage
      title="Past Maturity Sheet"
      description="Loans that crossed final maturity date and still have outstanding balances requiring recovery action."
      channel="visit"
      fetchSheet={getPastMaturityCollectionSheet}
    />
  );
};

export default PastMaturitySheet;
