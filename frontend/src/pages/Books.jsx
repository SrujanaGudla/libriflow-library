import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookService, borrowingService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import Loading from '../components/Loading';
import { 
  Search, 
  BookOpen, 
  AlertCircle, 
  CheckCircle, 
  X, 
  RotateCcw, 
  LayoutGrid, 
  Table as TableIcon, 
  Loader2,
  BookmarkPlus,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import '../styles/books.css';

export const Books = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchInput, setSearchInput] = useState(urlQuery);
  const [activeQuery, setActiveQuery] = useState(urlQuery);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'OUT_OF_STOCK'
  const [categories, setCategories] = useState(['All']);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [loading, setLoading] = useState(true);
  const [borrowingBookId, setBorrowingBookId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Book Details Modal state
  const [selectedBook, setSelectedBook] = useState(null);

  const { isStudent, isAdmin, isAuthenticated } = useAuth();

  useEffect(() => {
    loadBooks();
  }, []);

  // Sync with URL query parameter
  useEffect(() => {
    if (urlQuery !== activeQuery) {
      setSearchInput(urlQuery);
      setActiveQuery(urlQuery);
    }
  }, [urlQuery]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const res = await bookService.getAllBooks();
      if (res && res.data) {
        setBooks(res.data);
        setFilteredBooks(res.data);

        // Extract distinct categories
        const distinctCategories = ['All', ...new Set(res.data.map((b) => b.category).filter(Boolean))];
        setCategories(distinctCategories);
      }
    } catch (err) {
      console.error('Failed to load books:', err);
      setNotification({ type: 'error', text: 'Failed to load books catalog.' });
    } finally {
      setLoading(false);
    }
  };

  // Filter books by query, category, and availability
  useEffect(() => {
    let result = [...books];

    // 1. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(
        (b) => b.category && b.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // 2. Availability Filter
    if (availabilityFilter === 'AVAILABLE') {
      result = result.filter((b) => (b.availableQuantity || 0) > 0);
    } else if (availabilityFilter === 'OUT_OF_STOCK') {
      result = result.filter((b) => (b.availableQuantity || 0) <= 0);
    }

    // 3. Search Query Filter across Title, Author, Category, ISBN
    if (activeQuery.trim()) {
      const q = activeQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.author && b.author.toLowerCase().includes(q)) ||
          (b.category && b.category.toLowerCase().includes(q)) ||
          (b.isbn && b.isbn.toLowerCase().includes(q))
      );
    }

    setFilteredBooks(result);
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [activeQuery, selectedCategory, availabilityFilter, books]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveQuery(searchInput);
    setSearchParams(searchInput.trim() ? { q: searchInput.trim() } : {});
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setActiveQuery('');
    setSelectedCategory('All');
    setAvailabilityFilter('ALL');
    setSearchParams({});
  };

  // Student Borrow Book Action
  const handleBorrow = async (bookId) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    try {
      setBorrowingBookId(bookId);
      setNotification(null);
      const res = await borrowingService.borrowBook(bookId);
      setNotification({
        type: 'success',
        text: res.message || 'Book borrowed successfully! Due back in 14 days.',
      });
      loadBooks();
      if (selectedBook && selectedBook.id === bookId) {
        setSelectedBook(null);
      }
    } catch (err) {
      console.error('Borrow error:', err);
      const message = err.response?.data?.message || 'Unable to borrow this book.';
      setNotification({ type: 'error', text: message });
    } finally {
      setBorrowingBookId(null);
    }
  };

  if (loading) {
    return <Loading message="Loading catalog..." />;
  }

  // Pagination slice
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="main-content">
      {/* Catalog Header */}
      <div className="catalog-header">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#315F7B', marginBottom: '0.35rem' }}>
            Smart Book Catalog
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Discover and borrow books from our library collection. Filter by genre and availability.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="view-toggle-btns">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Card Grid View"
          >
            <LayoutGrid size={16} /> Cards
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table List View"
          >
            <TableIcon size={16} /> Table
          </button>
        </div>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="search-filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by title, author, category, or ISBN..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>

        <div className="search-actions">
          <button type="button" onClick={handleSearchSubmit} className="btn btn-primary btn-sm">
            Search
          </button>
          {(activeQuery || selectedCategory !== 'All' || availabilityFilter !== 'ALL') && (
            <button type="button" onClick={handleClearFilters} className="btn btn-outline btn-sm">
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Category Chips and Availability Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="category-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Availability Filter Chips */}
        <div className="availability-filter">
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.4rem' }}>
            Availability:
          </span>
          <button
            type="button"
            className={`category-chip ${availabilityFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setAvailabilityFilter('ALL')}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
          >
            All Books
          </button>
          <button
            type="button"
            className={`category-chip ${availabilityFilter === 'AVAILABLE' ? 'active' : ''}`}
            onClick={() => setAvailabilityFilter('AVAILABLE')}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
          >
            Available Now
          </button>
          <button
            type="button"
            className={`category-chip ${availabilityFilter === 'OUT_OF_STOCK' ? 'active' : ''}`}
            onClick={() => setAvailabilityFilter('OUT_OF_STOCK')}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Catalog Display: Cards Grid or Table */}
      {filteredBooks.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="empty-state-icon" />
          <h3 className="empty-state-title">No matching books found</h3>
          <p className="empty-state-desc">
            We couldn't find any titles matching your search criteria. Try modifying your search keywords or clearing filters.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="btn btn-secondary"
            style={{ marginTop: '1.25rem' }}
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="books-grid">
          {paginatedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onBorrow={handleBorrow}
              onViewDetails={(b) => setSelectedBook(b)}
              isBorrowing={borrowingBookId === book.id}
            />
          ))}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>ISBN</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBooks.map((book) => {
                const isAvailable = (book.availableQuantity || 0) > 0;
                return (
                  <tr key={book.id}>
                    <td 
                      style={{ fontWeight: 700, color: '#315F7B', cursor: 'pointer' }}
                      onClick={() => setSelectedBook(book)}
                    >
                      {book.title}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{book.author}</td>
                    <td>
                      <span className="book-category">{book.category}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {book.isbn}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {book.availableQuantity} / {book.quantity}
                    </td>
                    <td>
                      <span className={`badge ${isAvailable ? 'badge-available' : 'badge-out-of-stock'}`}>
                        {isAvailable ? 'Available' : 'Out of Stock'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedBook(book)}
                          className="btn btn-outline btn-sm"
                          title="View Details"
                        >
                          <Info size={14} /> Details
                        </button>

                        {isAuthenticated && isStudent && (
                          isAvailable ? (
                            <button
                              type="button"
                              onClick={() => handleBorrow(book.id)}
                              disabled={borrowingBookId === book.id}
                              className="btn btn-primary btn-sm"
                            >
                              {borrowingBookId === book.id ? (
                                <>
                                  <Loader2 size={13} className="spin-animation" />
                                </>
                              ) : (
                                <>
                                  <BookmarkPlus size={13} /> Borrow
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="btn btn-outline btn-sm"
                              style={{ opacity: 0.5, cursor: 'not-allowed' }}
                            >
                              Unavailable
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="modal-backdrop" onClick={() => setSelectedBook(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Book Specifications</h2>
              <button 
                type="button" 
                onClick={() => setSelectedBook(null)} 
                className="modal-close-btn"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0.5rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#315F7B', margin: '0 0 0.25rem 0' }}>
                    {selectedBook.title}
                  </h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
                    by {selectedBook.author}
                  </p>
                </div>
                <span className="book-category">{selectedBook.category}</span>
              </div>

              <div style={{
                background: '#F8FAFD',
                borderRadius: '10px',
                padding: '1.15rem',
                border: '1px solid var(--border-color)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                    ISBN Code
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#315F7B' }}>
                    {selectedBook.isbn}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                    Circulation Status
                  </span>
                  <span className={`badge ${(selectedBook.availableQuantity || 0) > 0 ? 'badge-available' : 'badge-out-of-stock'}`}>
                    {(selectedBook.availableQuantity || 0) > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                    Total Inventory
                  </span>
                  <span style={{ fontWeight: 700, color: '#315F7B' }}>
                    {selectedBook.quantity} copies
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                    Available to Borrow
                  </span>
                  <span style={{ fontWeight: 700, color: (selectedBook.availableQuantity || 0) > 0 ? 'var(--mint-text)' : 'var(--peach-text)' }}>
                    {selectedBook.availableQuantity} copies
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                This book can be checked out by registered students for a standard 14-day borrowing duration. A late fee of ₹10 per day is applied if returned after the due date.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="btn btn-outline"
              >
                Close
              </button>

              {isAuthenticated && isStudent && (
                (selectedBook.availableQuantity || 0) > 0 ? (
                  <button
                    type="button"
                    onClick={() => handleBorrow(selectedBook.id)}
                    disabled={borrowingBookId === selectedBook.id}
                    className="btn btn-primary"
                  >
                    {borrowingBookId === selectedBook.id ? (
                      <>
                        <Loader2 size={16} className="spin-animation" /> Borrowing...
                      </>
                    ) : (
                      <>
                        <BookmarkPlus size={16} /> Borrow Book (14 Days)
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="btn btn-outline"
                    style={{ opacity: 0.5, cursor: 'not-allowed' }}
                  >
                    Currently Out of Stock
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
