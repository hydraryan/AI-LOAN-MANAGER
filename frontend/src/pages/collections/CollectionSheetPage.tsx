import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/Shared/PageHeader";
import {
  CollectionEntryItem,
  CollectionSheetResponse,
  CollectionSheetRow,
  createCollectionEntry,
  getCollectionEntries,
} from "../../lib/api/collection";

type SheetFetcher = (date?: string, collectorId?: string) => Promise<CollectionSheetResponse>;

type CollectionSheetPageProps = {
  title: string;
  description: string;
  channel: "call" | "visit" | "sms" | "email";
  fetchSheet: SheetFetcher;
};

const formatDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const currency = (value: number) => `Rs ${Number(value || 0).toLocaleString()}`;

const getIdentityName = (value?: { name?: string; email?: string } | string) => {
  if (!value) return "-";
  if (typeof value === "string") return value;
  return value.name || value.email || "-";
};

const CollectionSheetPage = ({ title, description, channel, fetchSheet }: CollectionSheetPageProps) => {
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [search, setSearch] = useState("");
  const [collectorFilter, setCollectorFilter] = useState("");
  const [rows, setRows] = useState<CollectionSheetRow[]>([]);
  const [summary, setSummary] = useState<CollectionSheetResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logBusyLoanId, setLogBusyLoanId] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyBusyLoanId, setHistoryBusyLoanId] = useState("");
  const [historyRows, setHistoryRows] = useState<CollectionEntryItem[]>([]);
  const [historyContext, setHistoryContext] = useState<CollectionSheetRow | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchSheet(date, collectorFilter || undefined);
      setRows(data.rows || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error(err);
      setError("Failed to load sheet data. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [date, collectorFilter]);

  const filteredRows = useMemo(() => {
    const needle = search.toLowerCase().trim();
    if (!needle) return rows;
    return rows.filter((row) => {
      return (
        row.borrowerName.toLowerCase().includes(needle) ||
        row.borrowerPhone.toLowerCase().includes(needle) ||
        row.loanId.toLowerCase().includes(needle)
      );
    });
  }, [rows, search]);

  const availableCollectors = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      if (row.collectorId && !map.has(row.collectorId)) {
        map.set(row.collectorId, row.collectorName || "Unassigned");
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const openHistory = async (row: CollectionSheetRow) => {
    try {
      setHistoryBusyLoanId(row.loanId);
      const res = await getCollectionEntries(row.loanId, row.borrowerId);
      setHistoryRows(res.entries || []);
      setHistoryContext(row);
      setHistoryOpen(true);
    } catch (err) {
      console.error(err);
      window.alert("Failed to load collection history");
    } finally {
      setHistoryBusyLoanId("");
    }
  };

  const refreshHistory = async () => {
    if (!historyContext) return;
    try {
      setHistoryBusyLoanId(historyContext.loanId);
      const res = await getCollectionEntries(historyContext.loanId, historyContext.borrowerId);
      setHistoryRows(res.entries || []);
    } catch (err) {
      console.error(err);
      window.alert("Failed to refresh collection history");
    } finally {
      setHistoryBusyLoanId("");
    }
  };

  const logAttempt = async (row: CollectionSheetRow) => {
    const notes = window.prompt("Add a quick collection note", "Followed up for overdue repayment") || "";
    const amount = window.prompt("Amount collected now (optional)", "0") || "0";
    const amountCollected = Number(amount || 0);

    try {
      setLogBusyLoanId(row.loanId);
      await createCollectionEntry({
        loanId: row.loanId,
        borrowerId: row.borrowerId,
        collectorId: row.collectorId || undefined,
        channel,
        outcome: amountCollected > 0 ? "paid-partial" : "promised",
        amountCollected,
        notes,
      });
      window.alert("Collection note logged");
      await load();
      if (historyOpen && historyContext?.loanId === row.loanId) {
        await refreshHistory();
      }
    } catch (err) {
      console.error(err);
      window.alert("Failed to log collection note");
    } finally {
      setLogBusyLoanId("");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Rows</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary?.rowCount || 0}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Unique Loans</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary?.uniqueLoans || 0}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Unique Borrowers</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary?.uniqueBorrowers || 0}</p>
        </div>
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Outstanding</p>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-300">{currency(summary?.totalOutstanding || 0)}</p>
        </div>
      </div>

      <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Sheet Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
            />
          </label>
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Collector
            <select
              value={collectorFilter}
              onChange={(e) => setCollectorFilter(e.target.value)}
              className="mt-1 block border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700 min-w-52"
            >
              <option value="">All Collectors</option>
              {availableCollectors.map((collector) => (
                <option key={collector.id} value={collector.id}>
                  {collector.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Borrower, phone, loan ID"
              className="mt-1 block w-72 border rounded px-3 py-2 dark:bg-gray-900 dark:border-gray-700"
            />
          </label>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
        {loading ? (
          <div className="p-6 text-gray-500 dark:text-gray-400">Loading collection sheet...</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-6 text-gray-500 dark:text-gray-400">No rows available for the selected date.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Borrower</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Phone</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Due Date</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Days Overdue</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Outstanding</th>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-200">Collector</th>
                <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${row.loanId}-${row.dueDate}`} className="border-t dark:border-gray-700">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{row.borrowerName}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.borrowerPhone || "-"}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(row.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.daysOverdue}</td>
                  <td className="px-4 py-3 text-amber-700 dark:text-amber-300 font-medium">{currency(row.outstanding)}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{row.collectorName || "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end items-center gap-3">
                      <Link to={`/loans/${row.loanId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                        Loan
                      </Link>
                      <Link to={`/borrowers/profile/${row.borrowerId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                        Borrower
                      </Link>
                      <Link to={`/calendar?loanId=${row.loanId}&borrowerId=${row.borrowerId}`} className="text-blue-600 hover:underline dark:text-blue-400">
                        Calendar
                      </Link>
                      <button
                        onClick={() => openHistory(row)}
                        disabled={historyBusyLoanId === row.loanId}
                        className="px-2 py-1 rounded border dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-60"
                      >
                        {historyBusyLoanId === row.loanId ? "Loading..." : "History"}
                      </button>
                      <button
                        onClick={() => logAttempt(row)}
                        disabled={logBusyLoanId === row.loanId}
                        className="px-2 py-1 rounded border dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-60"
                      >
                        {logBusyLoanId === row.loanId ? "Saving..." : "Log"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {historyOpen && historyContext && (
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Collection History</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {historyContext.borrowerName} • Loan {historyContext.loanId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshHistory}
                className="px-3 py-1 rounded border dark:border-gray-600 text-gray-700 dark:text-gray-200"
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  setHistoryOpen(false);
                  setHistoryRows([]);
                  setHistoryContext(null);
                }}
                className="px-3 py-1 rounded border dark:border-gray-600 text-gray-700 dark:text-gray-200"
              >
                Close
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {historyRows.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No collection activity logged yet.</p>
            ) : (
              historyRows.map((entry) => (
                <div
                  key={entry._id}
                  className="rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 uppercase">
                      {entry.channel}
                    </span>
                    <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {entry.outcome}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(entry.contactedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Collected: <span className="font-medium">{currency(entry.amountCollected || 0)}</span>
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">Note: {entry.notes}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Collector: {getIdentityName(entry.collectorId)} • Logged by {getIdentityName(entry.createdBy)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionSheetPage;
