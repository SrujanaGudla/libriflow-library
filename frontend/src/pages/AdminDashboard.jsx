import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookService, borrowingService, fineService, adminService } from '../services/api';
import { 
  BookOpen, 
  Layers, 
  ArrowLeftRight, 
  IndianRupee, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Loader2, 
  ShieldCheck, 
  AlertTriangle,
  Download,
  Users,
  Clock,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import Loading from '../components/Loading';
import '../styles/dashboard.css';

export const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [books, setBooks] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [fines, setFines] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    isbn: '',
    quantity: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAdminDashboardData();
  }, []);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, booksRes, borrowingsRes, finesRes] = await Promise.all([
        adminService.getStats().catch(() => null),
        bookService.getAllBooks(),
        borrowingService.getAllBorrowings(),
        fineService.getAllFines(),
      ]);

      if (statsRes && statsRes.data) setStats(statsRes.data);
      if (booksRes && booksRes.data) {
        setBooks(booksRes.data);
        setFilteredBooks(booksRes.data);
      }
      if (borrowingsRes && borrowingsRes.data) setBorrowings(borrowingsRes.data);
      if (finesRes && finesRes.data) setFines(finesRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setNotification({ type: 'error', text: 'Failed to load administrative overview.' });
    } finally {
      setLoading(false);
    }
  };

  // Filter books by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBooks(books);
    } else {
      const q = searchQuery.toLowerCase().trim();
      setFilteredBooks(
        books.filter(
          (b) =>
            (b.title && b.title.toLowerCase().includes(q)) ||
            (b.author && b.author.toLowerCase().includes(q)) ||
            (b.category && b.category.toLowerCase().includes(q)) ||
            (b.isbn && b.isbn.toLowerCase().includes(q))
        )
      );
    }
  }, [searchQuery, books]);

  // Open Add Book Modal
  const handleOpenAddModal = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      category: '',
      isbn: '',
      quantity: 1,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Book Modal
  const handleOpenEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      quantity: book.quantity,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
    setFormError('');
  };

  // Submit Add or Edit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim() || !formData.author.trim() || !formData.category.trim() || !formData.isbn.trim()) {
      setFormError('All fields (Title, Author, Category, ISBN, Quantity) are required.');
      return;
    }

    if (parseInt(formData.quantity, 10) < 0) {
      setFormError('Quantity cannot be negative.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        category: formData.category.trim(),
        isbn: formData.isbn.trim(),
        quantity: parseInt(formData.quantity, 10),
      };

      if (editingBook) {
        await bookService.updateBook(editingBook.id, payload);
        setNotification({ type: 'success', text: 'Book updated successfully' });
      } else {
        await bookService.addBook(payload);
        setNotification({ type: 'success', text: 'Book added successfully' });
      }

      handleCloseModal();
      fetchAdminDashboardData();
    } catch (err) {
      console.error('Book save error:', err);
      const msg = err.response?.data?.message || 'Unable to process book save request';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Book Confirmation Flow
  const handleOpenDeleteModal = (book) => {
    setBookToDelete(book);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBookToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;

    try {
      setIsDeleting(true);
      setNotification(null);
      await bookService.deleteBook(bookToDelete.id);
      setNotification({
        type: 'success',
        text: `Book "${bookToDelete.title}" deleted successfully`,
      });
      handleCloseDeleteModal();
      fetchAdminDashboardData();
    } catch (err) {
      console.error('Delete book error:', err);
      const msg = err.response?.data?.message || 'Unable to delete book';
      setNotification({
        type: 'error',
        text: msg,
      });
      handleCloseDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  // Export Books Report
  const handleExportBooksCSV = () => {
    if (books.length === 0) return;
    const headers = ['ID', 'Title', 'Author', 'Category', 'ISBN', 'Total Quantity', 'Available Quantity'];
    const rows = books.map(b => [
      b.id,
      `"${(b.title || '').replace(/"/g, '""')}"`,
      `"${(b.author || '').replace(/"/g, '""')}"`,
      `"${(b.category || '').replace(/"/g, '""')}"`,
      b.isbn || '',
      b.quantity || 0,
      b.availableQuantity || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `libriflow_books_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Loading message="Loading LibriFlow Admin Portal..." />;
  }

  // Summary Metrics from real data
  const totalBooksCount = stats?.totalBooks ?? books.length;
  const totalStudentsCount = stats?.totalStudents ?? 0;
  const totalCopiesCount = stats?.totalCopies ?? books.reduce((sum, b) => sum + (b.quantity || 0), 0);
  const availableBooksCount = stats?.availableCopies ?? books.reduce((sum, b) => sum + (b.availableQuantity || 0), 0);
  const activeLoansCount = stats?.activeLoans ?? borrowings.filter(b => b.status === 'BORROWED').length;
  const overdueCount = stats?.overdueLoans ?? 0;
  const unpaidFineAmount = stats?.unpaidFinesAmount ?? fines.filter(f => f.status === 'UNPAID').reduce((sum, f) => sum + (f.amount || 0), 0);

  const categoryEntries = stats?.categoryDistribution 
    ? Object.entries(stats.categoryDistribution) 
    : [];

  const popularBooks = stats?.popularBooks || [];
  const recentBorrowings = borrowings.slice(0, 5);

  return (
    <div className="main-content">
      {/* 1. Admin Header & Welcome Banner */}
      <div className="welcome-banner" style={{ marginBottom: '1.75rem' }}>
        <div className="welcome-content">
          <div className="welcome-title-row">
            <span className="welcome-wave">🛡️</span>
            <h1 className="welcome-heading">Welcome, {user?.name || 'Administrator'}!</h1>
          </div>
          <p className="welcome-subtext">
            Centralized library administration: monitor real-time circulation, inventory health, penalties, and manage books.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm">
            <PlusCircle size={15} /> Add New Book
          </button>
          <button onClick={handleExportBooksCSV} className="btn btn-outline btn-sm">
            <Download size={15} /> Export Catalog
          </button>
        </div>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* 2. Admin Metric Cards (5 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Total Titles */}
        <div className="stat-metric-card stat-card-blue">
          <div className="stat-circle-icon icon-bg-blue">
            <BookOpen size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Total Books</span>
            <span className="stat-number">{totalBooksCount}</span>
            <span className="stat-caption">{totalCopiesCount} total catalog copies</span>
          </div>
        </div>

        {/* Registered Students */}
        <div className="stat-metric-card stat-card-lavender">
          <div className="stat-circle-icon icon-bg-lavender">
            <Users size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Students</span>
            <span className="stat-number">{totalStudentsCount}</span>
            <span className="stat-caption">Registered library members</span>
          </div>
        </div>

        {/* Active Circulations */}
        <div className="stat-metric-card stat-card-mint">
          <div className="stat-circle-icon icon-bg-mint">
            <ArrowLeftRight size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Active Loans</span>
            <span className="stat-number">{activeLoansCount}</span>
            <span className="stat-caption">{availableBooksCount} copies in stock</span>
          </div>
        </div>

        {/* Overdue Loans */}
        <div className="stat-metric-card stat-card-peach">
          <div className="stat-circle-icon icon-bg-peach">
            <Clock size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Overdue Books</span>
            <span className="stat-number" style={{ color: overdueCount > 0 ? '#DC2626' : 'inherit' }}>
              {overdueCount}
            </span>
            <span className="stat-caption">Past 14-day due date</span>
          </div>
        </div>

        {/* Unpaid Fines */}
        <div className="stat-metric-card stat-card-peach">
          <div className="stat-circle-icon icon-bg-peach">
            <IndianRupee size={22} />
          </div>
          <div className="stat-details">
            <span className="stat-title">Unpaid Fines</span>
            <span className="stat-number">₹{unpaidFineAmount.toFixed(0)}</span>
            <span className="stat-caption">Late return balance</span>
          </div>
        </div>
      </div>

      {/* 3. Visual Charts & Analytics (Popular Books & Category Breakdown) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Popular Books Card */}
        <div className="pastel-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <TrendingUp size={20} color="#5B8DB8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#315F7B', margin: 0 }}>
              Most Borrowed Books
            </h3>
          </div>

          {popularBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No borrowing statistics accumulated yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {popularBooks.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', background: '#F8FAFD', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#315F7B', display: 'block' }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      by {item.author}
                    </span>
                  </div>
                  <span className="badge badge-borrowed">
                    {item.borrowCount} loan(s)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="pastel-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <BarChart2 size={20} color="#5B8DB8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#315F7B', margin: 0 }}>
              Catalog Category Distribution
            </h3>
          </div>

          {categoryEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No categories mapped.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {categoryEntries.map(([cat, count]) => {
                const pct = totalBooksCount > 0 ? Math.round((count / totalBooksCount) * 100) : 0;
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: '#315F7B' }}>
                      <span>{cat}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count} titles ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Book Management Table Section */}
      <div className="table-card-container">
        <div className="table-card-header">
          <div>
            <h2 className="section-main-title">
              <BookOpen size={20} color="#315F7B" /> Book Inventory Management
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: '0.25rem 0 0 0' }}>
              Add new catalog entries, update quantities, and maintain catalog integrity.
            </p>
          </div>

          <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm">
            <PlusCircle size={15} /> Add Book
          </button>
        </div>

        {/* Search Toolbar */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
            <Search size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem', paddingRight: '0.85rem', fontSize: '0.875rem' }}
              placeholder="Search by title, author, category, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredBooks.length}</strong> of <strong>{books.length}</strong> book titles
          </span>
        </div>

        {/* Books Table */}
        {filteredBooks.length === 0 ? (
          <div className="empty-state" style={{ border: 'none' }}>
            <BookOpen className="empty-state-icon" />
            <h3 className="empty-state-title">No books match your query</h3>
            <p className="empty-state-desc">
              No book records match "{searchQuery}". Click "Add Book" to create a new title.
            </p>
          </div>
        ) : (
          <div className="table-responsive" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>ISBN</th>
                  <th>Total</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.id}>
                    <td style={{ fontWeight: 700, color: '#315F7B' }}>{book.title}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{book.author}</td>
                    <td>
                      <span className="book-category">{book.category}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {book.isbn}
                    </td>
                    <td style={{ fontWeight: 700 }}>{book.quantity}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: book.availableQuantity > 0 ? 'var(--mint-text)' : 'var(--peach-text)'
                      }}>
                        {book.availableQuantity}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(book)}
                          className="btn btn-outline btn-sm"
                          title="Edit Book"
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(book)}
                          className="btn btn-danger btn-sm"
                          title="Delete Book"
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Book Modal Dialog */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingBook ? 'Edit Book Details' : 'Add New Book to Catalog'}
              </h2>
              <button type="button" onClick={handleCloseModal} className="modal-close-btn" title="Close">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="alert alert-error">
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="book-title">Title *</label>
                <input
                  id="book-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Clean Code"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="book-author">Author *</label>
                <input
                  id="book-author"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Robert C. Martin"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="book-category">Category *</label>
                  <input
                    id="book-category"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Software Engineering"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="book-isbn">ISBN *</label>
                  <input
                    id="book-isbn"
                    type="text"
                    className="form-input"
                    placeholder="978-0132350884"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="book-quantity">Total Quantity *</label>
                <input
                  id="book-quantity"
                  type="number"
                  min="0"
                  className="form-input"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spin-animation" /> Saving...
                    </>
                  ) : editingBook ? (
                    'Save Changes'
                  ) : (
                    'Add Book'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Book Confirmation Modal */}
      {isDeleteModalOpen && bookToDelete && (
        <div className="modal-backdrop" onClick={handleCloseDeleteModal}>
          <div className="modal-dialog" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#DC2626' }}>
                <AlertTriangle size={22} />
                <h2 className="modal-title" style={{ fontSize: '1.2rem' }}>
                  Confirm Deletion
                </h2>
              </div>
              <button type="button" onClick={handleCloseDeleteModal} className="modal-close-btn" title="Close">
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0.5rem 0 1rem' }}>
              <p style={{ fontSize: '0.95rem', color: '#315F7B', marginBottom: '0.75rem' }}>
                Are you sure you want to delete this book from the catalog?
              </p>
              <div style={{
                background: '#F8FAFD',
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.875rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontWeight: 700, color: '#315F7B' }}>{bookToDelete.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Author: {bookToDelete.author}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>ISBN: {bookToDelete.isbn}</div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                This action cannot be undone. To protect borrowing transaction history, deletion will be rejected if any active or past loans exist for this book.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="spin-animation" /> Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
