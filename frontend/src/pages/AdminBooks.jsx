import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookService } from '../services/api';
import Loading from '../components/Loading';
import { 
  BookOpen, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Loader2, 
  AlertTriangle,
  Download
} from 'lucide-react';

export const AdminBooks = () => {
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState([]);
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
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const res = await bookService.getAllBooks();
      if (res && res.data) {
        setBooks(res.data);
        setFilteredBooks(res.data);
      }
    } catch (err) {
      console.error('Failed to load books for admin:', err);
      setNotification({ type: 'error', text: 'Failed to load books catalog.' });
    } finally {
      setLoading(false);
    }
  };

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
        setNotification({ type: 'success', text: 'Book specifications updated successfully' });
      } else {
        await bookService.addBook(payload);
        setNotification({ type: 'success', text: 'Book cataloged and added successfully' });
      }

      handleCloseModal();
      loadBooks();
    } catch (err) {
      console.error('Book save error:', err);
      const msg = err.response?.data?.message || 'Unable to save book details';
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
      loadBooks();
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

  // Export CSV Report
  const handleExportCSV = () => {
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
    link.setAttribute('download', `libriflow_books_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Loading message="Loading book inventory..." />;
  }

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#315F7B', marginBottom: '0.35rem' }}>
            Manage Books Inventory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Create new books, adjust copies in circulation, and review ISBN codes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm">
            <PlusCircle size={15} /> Add Book
          </button>
          {books.length > 0 && (
            <button onClick={handleExportCSV} className="btn btn-outline btn-sm">
              <Download size={15} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="table-card-container">
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', maxWidth: '380px', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
              placeholder="Search by title, author, category, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total <strong>{filteredBooks.length}</strong> titles
          </span>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="empty-state" style={{ border: 'none' }}>
            <BookOpen className="empty-state-icon" />
            <h3 className="empty-state-title">No books found</h3>
            <p className="empty-state-desc">
              No book records match the search query "{searchQuery}". Click "Add Book" to catalog a title.
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
                  <th>Total Copies</th>
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
                          title="Edit Book Details"
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
                  placeholder="e.g. Design Patterns"
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
                  placeholder="e.g. Erich Gamma, Richard Helm"
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
                    placeholder="978-0201633610"
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
                Are you sure you want to delete this book?
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
                This action cannot be undone. To prevent database corruption and preserve student loan history, deletion will be rejected if any borrowing records exist for this book.
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

export default AdminBooks;
