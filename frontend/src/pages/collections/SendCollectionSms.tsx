import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/Shared/PageHeader";
import {
  CollectionSheetRow,
  getMissedCollectionSheet,
  sendCollectionSms,
} from "../../lib/api/collection";

const defaultMessage =
  "Reminder: your loan repayment is overdue. Please clear dues today or contact your branch for assistance.";

const SendCollectionSms = () => {
  const [rows, setRows] = useState<CollectionSheetRow[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [message, setMessage] = useState(defaultMessage);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getMissedCollectionSheet();
        const withPhones = (data.rows || []).filter((row) => !!row.borrowerPhone);
        setRows(withPhones);
        setSelectedPhones(withPhones.map((row) => row.borrowerPhone));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const uniqueRows = useMemo(() => {
    const map = new Map<string, CollectionSheetRow>();
    for (const row of rows) {
      if (!map.has(row.borrowerPhone)) {
        map.set(row.borrowerPhone, row);
      }
    }
    return Array.from(map.values());
  }, [rows]);

  const toggle = (phone: string) => {
    setSelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((item) => item !== phone) : [...prev, phone]
    );
  };

  const send = async () => {
    if (selectedPhones.length === 0 || !message.trim()) {
      window.alert("Select recipients and enter a message");
      return;
    }

    try {
      setSending(true);
      const res = await sendCollectionSms(selectedPhones, message.trim());
      window.alert(`SMS queued successfully for ${res?.data?.sentCount || selectedPhones.length} recipients`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Collection SMS"
        description="Notify overdue borrowers with a targeted reminder message."
        actionLabel={sending ? "Sending..." : "Send SMS"}
        onAction={send}
      />

      <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Selected recipients: <span className="font-semibold">{selectedPhones.length}</span>
        </p>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
        />
      </div>

      <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-gray-500 dark:text-gray-400">Loading recipients...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-4 py-3 text-left">Select</th>
                <th className="px-4 py-3 text-left">Borrower</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {uniqueRows.map((row) => (
                <tr key={row.borrowerPhone} className="border-t dark:border-gray-700">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPhones.includes(row.borrowerPhone)}
                      onChange={() => toggle(row.borrowerPhone)}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{row.borrowerName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.borrowerPhone}</td>
                  <td className="px-4 py-3 text-amber-700 dark:text-amber-300">Rs {row.outstanding.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SendCollectionSms;
