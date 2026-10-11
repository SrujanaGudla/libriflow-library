import React, { useState, useEffect } from 'react';
import { borrowingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { 
  ArrowLeftRight, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Loader2, 
  BookOpen, 
  Clock, 
  Download,
  AlertTriangle,
  X
} from 'lucide-react';

export const Borrowings = () => {
  const { isStudent, isAdmin } = useAuth();
  const [borrowings, setBorrowings] = useState([]);
  const [filteredBorrowings, setFilteredBorrowings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'BORROWED' | 'RETURNED' | 'OVERDUE'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Return Confirmation Modal state
  const [confirmReturnLoan, setConfirmReturnLoan] = useState(null);

  useEffect(() => {
    loadBorrowings();
  }, [isStudent]);

  const loadBorrowings = async () => {
    try {
      setLoading(true);
      let res;
      if (isStudent) {
        res = await borrowingService.getMyBorrowings();
      } else {
        res = await borrowingService.getAllBorrowings();
      }

      if (res && res.data) {
        setBorrowings(res.data);
        setFilteredBorrowings(res.data);
      }
    } catch (err) {
      console.error('Failed to load borrowings:', err);
      setNotification({ type: 'error', text: 'Failed to load borrowing records.' });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    let result = [...borrowings];

    // Filter by status
    if (statusFilter === 'BORROWED') {
      result = result.filter((b) => b.status === 'BORROWED');
    } else if (statusFilter === 'RETURNED') {
      result = result.filter((b) => b.status === 'RETURNED');
    } else if (statusFilter === 'OVERDUE') {
      result = result.filter((b) => b.status === 'BORROWED' && b.dueDate && new Date(b.dueDate) < today);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          (b.bookTitle && b.bookTitle.toLowerCase().includes(q)) ||
          (b.bookAuthor && b.bookAuthor.toLowerCase().includes(q)) ||
          (b.userName && b.userName.toLowerCase().includes(q)) ||
          (b.userEmail && b.userEmail.toLowerCase().includes(q)) ||
          (b.bookIsbn && b.bookIsbn.toLowerCase().includes(q))
      );
    }

    setFilteredBorrowings(result);
  }, [statusFilter, searchQuery, borrowings]);

  const handleExecuteReturn = async () => {
    if (!confirmReturnLoan) return;
    const borrowingId = confirmReturnLoan.id;

    try {
      setReturningId(borrowingId);
      setNotification(null);
      const res = await borrowingService.returnBook(borrowingId);
      setNotification({
        type: 'success',
        text: res.message || `"${confirmReturnLoan.bookTitle}" returned successfully!`,
      });
      setConfirmReturnLoan(null);
      loadBorrowings();
    } catch (err) {
      console.error('Return error:', err);
      const msg = err.response?.data?.message || 'Failed to return book.';
      setNotification({ type: 'error', text: msg });
      setConfirmReturnLoan(null);
    } finally {
      setReturningId(null);
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    if (filteredBorrowings.length === 0) return;

    const headers = ['Borrowing ID', 'Book Title', 'Author', 'ISBN', 'Student Name', 'Student Email', 'Borrow Date', 'Due Date', 'Return Date', 'Status'];
    const rows = filteredBorrowings.map(b => [
      b.id,
      `"${(b.bookTitle || '').replace(/"/g, '""')}"`,
      `"${(b.bookAuthor || '').replace(/"/g, '""')}"`,
      b.bookIsbn || '',
      `"${(b.userName || '').replace(/"/g, '""')}"`,
      b.userEmail || '',
      b.borrowDate || '',
      b.dueDate || '',
      b.returnDate || '',
      b.status || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `libriflow_borrowings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Loading message="Loading loan records..." />;
  }

  const activeCount = borrowings.filter((b) => b.status === 'BORROWED').length;
  const returnedCount = borrowings.filter((b) => b.status === 'RETURNED').length;
  const overdueCount = borrowings.filter((b) => b.status === 'BORROWED' && b.dueDate && new Date(b.dueDate) < today).length;

  return (
    <div className="main-content">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#315F7B', marginBottom: '0.35rem' }}>
            {isStudent ? 'My Borrowing History' : 'System Borrowing Ledger'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            {isStudent 
              ? 'Track your active borrowed library books, view due dates, and return books.'
              : 'Audit all member loan transactions, active circulations, and returns across the institution.'}
          </p>
        </div>

        {borrowings.length > 0 && (
          <button 
            type="button" 
            onClick={handleExportCSV} 
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="pastel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--pastel-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#315F7B' }}>
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Records</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#315F7B', display: 'block' }}>{borrowings.length}</span>
          </div>
        </div>

        <div className="pastel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--pastel-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mint-text)' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Loans</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#315F7B', display: 'block' }}>{activeCount}</span>
          </div>
        </div>

        <div className="pastel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--pastel-lavender)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lavender-text)' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Returned</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#315F7B', display: 'block' }}>{returnedCount}</span>
          </div>
        </div>

        <div className="pastel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.15rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--pastel-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--peach-text)' }}>
            <Clock size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overdue</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: overdueCount > 0 ? '#DC2626' : '#315F7B', display: 'block' }}>{overdueCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.65rem' }}
            placeholder={isStudent ? 'Search by book title, author, or ISBN...' : 'Search by book title, student name, or email...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            className={`category-chip ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All
          </button>
          <button
            type="button"
            className={`category-chip ${statusFilter === 'BORROWED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('BORROWED')}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            className={`category-chip ${statusFilter === 'RETURNED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('RETURNED')}
          >
            Returned ({returnedCount})
          </button>
          <button
            type="button"
            className={`category-chip ${statusFilter === 'OVERDUE' ? 'active' : ''}`}
            onClick={() => setStatusFilter('OVERDUE')}
          >
            Overdue ({overdueCount})
          </button>
        </div>
      </div>

      {/* Table */}
      {filteredBorrowings.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <h3 className="empty-state-title">No borrowing records found</h3>
          <p className="empty-state-desc">
            {borrowings.length === 0 
              ? 'No books have been borrowed yet.'
              : 'No records match the current status filter and search query.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Author</th>
                {!isStudent && <th>Student</th>}
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBorrowings.map((b) => {
                const isReturned = b.status === 'RETURNED';
                const isOverdue = !isReturned && b.dueDate && new Date(b.dueDate) < today;

                return (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, color: '#315F7B' }}>{b.bookTitle}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{b.bookAuthor}</td>
                    {!isStudent && (
                      <td>
                        <div style={{ fontWeight: 600, color: '#315F7B' }}>{b.userName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.userEmail}</div>
                      </td>
                    )}
                    <td style={{ color: 'var(--text-muted)' }}>{b.borrowDate}</td>
                    <td>
                      <span style={{
                        color: isOverdue ? '#DC2626' : 'var(--text-muted)',
                        fontWeight: isOverdue ? 700 : 500
                      }}>
                        {b.dueDate} {isOverdue && '(Overdue)'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        isReturned
                          ? 'badge-returned'
                          : isOverdue
                          ? 'badge-overdue'
                          : 'badge-active'
                      }`}>
                        {isReturned ? 'Returned' : isOverdue ? 'Overdue' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {!isReturned ? (
                        <button
                          type="button"
                          onClick={() => setConfirmReturnLoan(b)}
                          disabled={returningId === b.id}
                          className="btn-return-book"
                          title="Return this borrowed book"
                        >
                          {returningId === b.id ? (
                            <>
                              <Loader2 size={13} className="spin-animation" /> Returning...
                            </>
                          ) : (
                            'Return Book'
                          )}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--mint-text)', fontSize: '0.825rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle size={14} /> Returned
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {confirmReturnLoan && (
        <div className="modal-backdrop" onClick={() => setConfirmReturnLoan(null)}>
          <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Book Return</h2>
              <button 
                type="button" 
                onClick={() => setConfirmReturnLoan(null)} 
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0.5rem 0 1rem' }}>
              <p style={{ fontSize: '0.95rem', color: '#315F7B', marginBottom: '1rem' }}>
                Are you ready to return this book to the library?
              </p>

              <div style={{ background: '#F8FAFD', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#315F7B', display: 'block' }}>
                  {confirmReturnLoan.bookTitle}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  by {confirmReturnLoan.bookAuthor}
                </span>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Due Date: <strong>{confirmReturnLoan.dueDate}</strong>
                </div>
              </div>

              {confirmReturnLoan.dueDate && new Date(confirmReturnLoan.dueDate) < today && (
                <div className="alert alert-error" style={{ marginBottom: 0 }}>
                  <AlertTriangle size={16} />
                  <span>This return is overdue. A late penalty fee of ₹10/day will be attached to your ledger upon return.</span>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => setConfirmReturnLoan(null)} 
                className="btn btn-outline"
                disabled={returningId !== null}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleExecuteReturn} 
                className="btn btn-primary"
                disabled={returningId !== null}
              >
                {returningId ? (
                  <>
                    <Loader2 size={16} className="spin-animation" /> Returning...
                  </>
                ) : (
                  'Confirm Return'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Borrowings;
