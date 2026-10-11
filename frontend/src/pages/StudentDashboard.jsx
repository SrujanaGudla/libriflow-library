import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { borrowingService, fineService, bookService } from '../services/api';
import { 
  BookOpen, 
  RotateCw, 
  IndianRupee, 
  Search, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import Loading from '../components/Loading';
import '../styles/dashboard.css';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [borrowings, setBorrowings] = useState([]);
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [borrowingsRes, finesRes] = await Promise.all([
        borrowingService.getMyBorrowings(),
        fineService.getMyFines(),
      ]);

      if (borrowingsRes && borrowingsRes.data) setBorrowings(borrowingsRes.data);
      if (finesRes && finesRes.data) setFines(finesRes.data);
    } catch (err) {
      console.error('Error loading student dashboard:', err);
      setNotification({ type: 'error', text: 'Failed to load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (borrowingId) => {
    try {
      setReturningId(borrowingId);
      setNotification(null);
      const res = await borrowingService.returnBook(borrowingId);
      setNotification({
        type: 'success',
        text: res.message || 'Book returned successfully!',
      });
      fetchStudentData();
    } catch (err) {
      console.error('Return book error:', err);
      const msg = err.response?.data?.message || 'Failed to return book.';
      setNotification({ type: 'error', text: msg });
    } finally {
      setReturningId(null);
    }
  };

  if (loading) {
    return <Loading message="Loading LibriFlow Student Portal..." />;
  }

  // Active Loans (BORROWED status)
  const activeLoans = borrowings.filter((b) => b.status === 'BORROWED');
  // Returned Loans
  const returnedLoans = borrowings.filter((b) => b.status === 'RETURNED');
  // Unpaid Fines
  const unpaidFines = fines.filter((f) => f.status === 'UNPAID');
  const outstandingFineAmount = unpaidFines.reduce((sum, f) => sum + (f.amount || 0), 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const studentName = user?.name || 'Geetha Reddy';

  return (
    <div className="main-content">
      {/* 1. Welcome Hero Banner */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <div className="welcome-title-row">
            <span className="welcome-wave">👋</span>
            <h1 className="welcome-heading">Hello, {studentName}!</h1>
          </div>
          <p className="welcome-subtext">
            Welcome to your Student Portal. Manage your borrowed books and fines.
          </p>
        </div>

        {/* Pastel Books Illustration with "Read Learn Grow 💙" */}
        <div className="welcome-graphic">
          <svg width="250" height="110" viewBox="0 0 250 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sprout on left */}
            <path d="M22 85 C22 75, 12 70, 6 72 C5 82, 16 85, 22 85 Z" fill="#9DD9A8" />
            <path d="M23 85 C25 72, 33 65, 39 67 C41 77, 30 84, 23 85 Z" fill="#86CFA0" />
            <path d="M22 92 C22 85, 23 80, 23 75" stroke="#68B884" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M14 62 C18 55, 25 58, 23 68 C18 67, 15 65, 14 62 Z" fill="#A8E2B2" />
            <path d="M26 60 C32 54, 38 58, 35 68 C29 67, 27 64, 26 60 Z" fill="#95D8A3" />

            {/* Bottom Book (Mint #DDF3E4) */}
            <rect x="52" y="70" width="105" height="15" rx="3" fill="#DDF3E4" stroke="#C5E6CD" strokeWidth="1.5" />
            <rect x="56" y="72" width="97" height="11" rx="1.5" fill="#FFFFFF" />
            <rect x="49" y="70" width="8" height="15" rx="2" fill="#BDE5C8" />

            {/* Middle Book (Peach/Yellow #FFF0D9) */}
            <rect x="58" y="52" width="98" height="15" rx="3" fill="#FFF0D9" stroke="#FDE2BC" strokeWidth="1.5" />
            <rect x="62" y="54" width="90" height="11" rx="1.5" fill="#FFFFFF" />
            <rect x="55" y="52" width="8" height="15" rx="2" fill="#FED8A4" />

            {/* Top Book (Lavender/Light Blue #DCEAF3) */}
            <rect x="65" y="34" width="90" height="15" rx="3" fill="#DCEAF3" stroke="#C5DFEF" strokeWidth="1.5" />
            <rect x="69" y="36" width="82" height="11" rx="1.5" fill="#FFFFFF" />
            <rect x="62" y="34" width="8" height="15" rx="2" fill="#AFCDE3" />

            {/* Handwritten text "Read Learn Grow 💙" */}
            <text x="175" y="44" fontFamily="'Plus Jakarta Sans', cursive, sans-serif" fontSize="19" fontStyle="italic" fontWeight="700" fill="#5B8DB8">Read</text>
            <text x="175" y="66" fontFamily="'Plus Jakarta Sans', cursive, sans-serif" fontSize="19" fontStyle="italic" fontWeight="700" fill="#5B8DB8">Learn</text>
            <text x="175" y="88" fontFamily="'Plus Jakarta Sans', cursive, sans-serif" fontSize="19" fontStyle="italic" fontWeight="700" fill="#5B8DB8">Grow 💙</text>
          </svg>
        </div>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* 2. Top Metric Cards (Row of 3 Cards: Active Loans, Outstanding Fines, Returned Books) */}
      <div className="student-stats-grid">
        {/* Card 1: ACTIVE LOANS */}
        <Link to="/borrowings" className="stat-metric-card stat-card-blue">
          <div className="stat-circle-icon icon-bg-blue">
            <BookOpen size={24} strokeWidth={2.2} />
          </div>
          <div className="stat-details">
            <div className="stat-header-row">
              <span className="stat-title">ACTIVE LOANS</span>
              <span className="stat-arrow">&rarr;</span>
            </div>
            <span className="stat-number">{activeLoans.length}</span>
            <span className="stat-caption">Books currently in your care</span>
          </div>
        </Link>

        {/* Card 2: OUTSTANDING FINES */}
        <Link to="/fines" className="stat-metric-card stat-card-mint">
          <div className="stat-circle-icon icon-bg-mint">
            <IndianRupee size={24} strokeWidth={2.4} />
          </div>
          <div className="stat-details">
            <div className="stat-header-row">
              <span className="stat-title">OUTSTANDING FINES</span>
              <span className="stat-arrow">&rarr;</span>
            </div>
            <span className="stat-number">₹{outstandingFineAmount.toFixed(2)}</span>
            <span className="stat-caption">{unpaidFines.length} unpaid fine record(s)</span>
          </div>
        </Link>

        {/* Card 3: RETURNED BOOKS */}
        <Link to="/borrowings" className="stat-metric-card stat-card-lavender">
          <div className="stat-circle-icon icon-bg-lavender">
            <RotateCw size={24} strokeWidth={2.2} />
          </div>
          <div className="stat-details">
            <div className="stat-header-row">
              <span className="stat-title">RETURNED BOOKS</span>
              <span className="stat-arrow">&rarr;</span>
            </div>
            <span className="stat-number">{returnedLoans.length}</span>
            <span className="stat-caption">Lifetime library returns</span>
          </div>
        </Link>
      </div>

      {/* 3. Quick Actions */}
      <div className="section-wrapper">
        <div className="section-title-bar">
          <h2 className="section-main-title">Quick Actions</h2>
        </div>
        <div className="quick-actions-row">
          {/* Action 1: Explore Catalog */}
          <Link to="/books" className="quick-action-box action-box-blue">
            <div className="action-icon-circle">
              <Search size={22} color="#5B8DB8" />
            </div>
            <div>
              <h3 className="action-title">Explore Catalog</h3>
              <p className="action-desc">Find and borrow available books</p>
            </div>
            <span className="action-link-label">
              Browse now &rarr;
            </span>
          </Link>

          {/* Action 2: My Loan History */}
          <Link to="/borrowings" className="quick-action-box action-box-lavender">
            <div className="action-icon-circle">
              <Clock size={22} color="#7C3AED" />
            </div>
            <div>
              <h3 className="action-title">My Loan History</h3>
              <p className="action-desc">View all past and active borrowings</p>
            </div>
            <span className="action-link-label">
              View history &rarr;
            </span>
          </Link>

          {/* Action 3: Fines & Penalties */}
          <Link to="/fines" className="quick-action-box action-box-mint">
            <div className="action-icon-circle">
              <IndianRupee size={22} color="#1E7E34" />
            </div>
            <div>
              <h3 className="action-title">Fines & Penalties</h3>
              <p className="action-desc">Pay overdue fees and view receipts</p>
            </div>
            <span className="action-link-label">
              Manage fines &rarr;
            </span>
          </Link>
        </div>
      </div>

      {/* 4. Currently Borrowed Books Section */}
      <div className="section-wrapper">
        <div className="table-card-container">
          <div className="table-card-header">
            <h2 className="section-main-title">
              <BookOpen size={20} color="#315F7B" /> Currently Borrowed Books
            </h2>
            <Link to="/borrowings" className="section-view-all">
              View all loans &rarr;
            </Link>
          </div>

          {activeLoans.length === 0 ? (
            <div className="empty-state" style={{ border: 'none', padding: '2.5rem 1.5rem' }}>
              <BookOpen className="empty-state-icon" color="#94A3B8" />
              <h3 className="empty-state-title">No books currently borrowed</h3>
              <p className="empty-state-desc">
                You do not have any active loans right now. Head over to the catalog to discover new titles to borrow!
              </p>
              <Link to="/books" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
                Browse Catalog
              </Link>
            </div>
          ) : (
            <div className="table-responsive" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Author</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map((loan) => {
                    const isOverdue = loan.dueDate && new Date(loan.dueDate) < today;
                    return (
                      <tr key={loan.id}>
                        <td style={{ fontWeight: 700, color: '#315F7B' }}>{loan.bookTitle}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{loan.bookAuthor}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{loan.borrowDate}</td>
                        <td style={{ color: isOverdue ? '#DC2626' : 'var(--text-muted)', fontWeight: isOverdue ? 700 : 500 }}>
                          {loan.dueDate} {isOverdue && '(Overdue)'}
                        </td>
                        <td>
                          <span className={`badge ${isOverdue ? 'badge-overdue' : 'badge-active'}`}>
                            {isOverdue ? 'Overdue' : 'Active'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleReturnBook(loan.id)}
                            disabled={returningId === loan.id}
                            className="btn-return-book"
                          >
                            {returningId === loan.id ? (
                              <>
                                <Loader2 size={13} className="spin-animation" /> Returning...
                              </>
                            ) : (
                              'Return Book'
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
