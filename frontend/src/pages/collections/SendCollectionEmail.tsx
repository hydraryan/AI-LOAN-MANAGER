import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/Shared/PageHeader";
import {
  CollectionSheetRow,
  getMissedCollectionSheet,
  sendCollectionEmail,
} from "../../lib/api/collection";

const defaultSubject = "Overdue Loan Repayment Reminder";
const defaultBody =
  "Your repayment is overdue. Please make payment at the earliest or contact support for assistance.";

const SendCollectionEmail = () => {
  const [rows, setRows] = useState<CollectionSheetRow[]>([]);
  const [selectedBorrowerIds, setSelectedBorrowerIds] = useState<string[]>([]);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultBody);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getMissedCollectionSheet();
        setRows(data.rows || []);
        setSelectedBorrowerIds((data.rows || []).map((row) => row.borrowerId));
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
      if (!map.has(row.borrowerId)) {
        map.set(row.borrowerId, row);
      }
    }
    return Array.from(map.values());
  }, [rows]);

  const toggle = (borrowerId: string) => {
    setSelectedBorrowerIds((prev) =>
      prev.includes(borrowerId) ? prev.filter((item) => item !== borrowerId) : [...prev, borrowerId]
    );
  };

  const send = async () => {
    if (selectedBorrowerIds.length === 0 || !subject.trim() || !message.trim()) {
      window.alert("Select recipients and complete subject/body");
      return;
    }

    try {
      setSending(true);
      const recipients = selectedBorrowerIds;
      const res = await sendCollectionEmail(recipients, subject.trim(), message.trim());
      window.alert(`Email queued successfully for ${res?.data?.sentCount || recipients.length} recipients`);
    } catch (err) {
      console.error(err);
      window.alert("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Collection Email"
        description="Compose and send formal repayment reminders to selected borrowers."
        actionLabel={sending ? "Sending..." : "Send Email"}
        onAction={send}
      />

      <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Selected recipients: <span className="font-semibold">{selectedBorrowerIds.length}</span>
        </p>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
          placeholder="Subject"
        />
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
          placeholder="Email body"
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
                <th className="px-4 py-3 text-left">Borrower ID</th>
                <th className="px-4 py-3 text-left">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {uniqueRows.map((row) => (
                <tr key={row.borrowerId} className="border-t dark:border-gray-700">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedBorrowerIds.includes(row.borrowerId)}
                      onChange={() => toggle(row.borrowerId)}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{row.borrowerName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.borrowerId}</td>
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

export default SendCollectionEmail;
