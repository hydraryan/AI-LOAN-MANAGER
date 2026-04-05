import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';

type Loan = {
  _id: string;
  borrowerId?: {
    name?: string;
    userId?: {
      name?: string;
    };
  };
};

type LoanComment = {
  _id: string;
  text: string;
  createdAt: string;
};

const LoanComments = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState<LoanComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  const fetchComments = async (loanId: string) => {
    try {
      const res = await API.get<{ comments: LoanComment[] }>(`/loans/${loanId}/comments`);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error(err);
      setComments([]);
    }
  };

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        setFetchError('');
        const res = await API.get<Loan[]>('/loans');
        setLoans(res.data);
        if (res.data.length > 0) {
          const initialLoanId = res.data[0]._id;
          setSelectedLoanId((prev) => prev || initialLoanId);
          await fetchComments(initialLoanId);
        }
      } catch (err) {
        console.error(err);
        setFetchError('Failed to load loans for comments.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  useEffect(() => {
    if (selectedLoanId) {
      fetchComments(selectedLoanId);
    }
  }, [selectedLoanId]);

  const selectedBorrower = useMemo(() => {
    const loan = loans.find((item) => item._id === selectedLoanId);
    return loan?.borrowerId?.userId?.name || loan?.borrowerId?.name || 'Unknown';
  }, [loans, selectedLoanId]);

  const saveComment = async () => {
    if (!selectedLoanId) return;

    const text = draft.trim();
    if (!text) {
      setStatusType('error');
      setStatusMessage('Please enter a comment before saving.');
      return;
    }

    try {
      setSaving(true);
      setStatusMessage('');
      const res = await API.post<{ comments: LoanComment[] }>(`/loans/${selectedLoanId}/comments`, { text });
      setComments(res.data.comments || []);
      setDraft('');
      setStatusType('success');
      setStatusMessage('Comment saved.');
    } catch (err: any) {
      console.error(err);
      setStatusType('error');
      setStatusMessage(err?.response?.data?.error || 'Failed to save comment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Loan Comments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Capture and persist review notes per loan.</p>
        </div>

        <button
          onClick={() => navigate('/loans/view')}
          className="px-3 py-2 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-200"
        >
          Back to Loans
        </button>
      </div>

      {!!statusMessage && (
        <div className={`rounded border px-3 py-2 text-sm ${
          statusType === 'success'
            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
        }`}>
          {statusMessage}
        </div>
      )}

      {!!fetchError && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {fetchError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Loans</h2>
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading loans...</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-auto">
              {loans.map((loan) => (
                <button
                  key={loan._id}
                  onClick={() => {
                    setSelectedLoanId(loan._id);
                    setDraft('');
                    setStatusMessage('');
                  }}
                  className={`w-full text-left rounded border px-3 py-2 text-sm ${
                    selectedLoanId === loan._id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500'
                      : 'border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  <p className="font-medium">{loan._id}</p>
                  <p className="text-xs opacity-80">{loan.borrowerId?.userId?.name || loan.borrowerId?.name || 'Unknown'}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 rounded border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Comment Editor</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Borrower: {selectedBorrower}</p>

          <div className="max-h-44 overflow-auto rounded border dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet for this loan.</p>
            ) : (
              <ul className="space-y-2">
                {[...comments].reverse().map((comment) => (
                  <li key={comment._id} className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <textarea
            id="loan-comment-draft"
            aria-label="Loan comment"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !saving && selectedLoanId) {
                e.preventDefault();
                saveComment();
              }
            }}
            placeholder="Write loan review comments, repayment concerns, or follow-up notes..."
            className="w-full min-h-56 border rounded px-3 py-2 dark:bg-gray-900 dark:text-white dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">Tip: Press Ctrl+Enter (or Cmd+Enter on macOS) to save quickly.</p>

          <div className="flex justify-end">
            <button
              onClick={saveComment}
              disabled={!selectedLoanId || saving}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {saving ? 'Saving...' : 'Save Comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanComments;
