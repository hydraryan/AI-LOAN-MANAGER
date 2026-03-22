import { useState, useEffect } from 'react';
import { Eye, Search, Filter, Download, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../lib/api/api';
import PageHeader from '../../components/Shared/PageHeader';

type Loan = {
  _id: string;
  borrowerId: {
    userId: {
      name: string;
    };
  };
  principal: number;
  status: string;
  createdAt: string;
  schedule: {
    dueDate: string;
    amount: number;
    paidAmount: number;
    status: string;
  }[];
};

const ViewLoans = () => {
  const navigate = useNavigate();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH REAL DATA
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const res = await API.get<Loan[]>('/loans');
        setLoans(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  // 🔥 FILTER LOGIC
  const filteredLoans = loans.filter((loan) => {
    const name = loan.borrowerId?.userId?.name || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan._id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || loan.status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // 🔥 NEXT PAYMENT
  const getNextPayment = (schedule: Loan['schedule']) => {
    const pending = schedule.find(s => s.status !== 'paid');
    return pending ? pending.dueDate : '-';
  };

  // 🔥 PAID AMOUNT
  const getPaidAmount = (schedule: Loan['schedule']) => {
    return schedule.reduce((sum, s) => sum + s.paidAmount, 0);
  };

  // 🔥 STATUS COLOR
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <PageHeader
        title="All Loans"
        description="Manage loan portfolio"
        actionLabel="Add Loan"
        actionIcon={<Plus size={18} />}
        onAction={() => navigate('/loans/add')}
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded border flex flex-col md:flex-row gap-4 justify-between">

        <div className="flex gap-4 flex-1">

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              placeholder="Search..."
              className="pl-10 pr-3 py-2 border rounded w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option>All</option>
            <option>approved</option>
            <option>pending</option>
            <option>closed</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 border px-3 py-2 rounded">
            <Filter size={16} /> Filter
          </button>

          <button className="flex items-center gap-2 border px-3 py-2 rounded">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border overflow-hidden">

        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Borrower</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Next Payment</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan._id}>

                  <td className="text-blue-600">{loan._id}</td>

                  <td>
                    {loan.borrowerId?.userId?.name || 'Unknown'}
                  </td>

                  <td>
                    ₹{loan.principal.toLocaleString()}
                    <div className="text-xs text-green-600">
                      Paid: ₹{getPaidAmount(loan.schedule).toLocaleString()}
                    </div>
                  </td>

                  <td>
                    <span className={`px-2 rounded ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>

                  <td>
                    {new Date(loan.createdAt).toLocaleDateString()}
                  </td>

                  <td>
                    {getNextPayment(loan.schedule)
                      ? new Date(getNextPayment(loan.schedule)).toLocaleDateString()
                      : '-'}
                  </td>

                  <td>
                    <button
                      onClick={() => navigate(`/loans/${loan._id}`)}
                      className="text-blue-600"
                    >
                      <Eye size={18} />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filteredLoans.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No loans found
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewLoans;