import React from 'react';
import { CheckCircle, XCircle, BookmarkPlus, Loader2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BookCard = ({ book, onBorrow, onViewDetails, isBorrowing = false }) => {
  const { isStudent, isAdmin, isAuthenticated } = useAuth();
  const isAvailable = (book.availableQuantity || 0) > 0;

  return (
    <div className="book-card">
      {/* Category and Availability Badge */}
      <div className="book-card-top">
        <span className="book-category" title={book.category}>{book.category}</span>
        {isAvailable ? (
          <span className="badge badge-available">
            <CheckCircle size={12} /> {book.availableQuantity} Available
          </span>
        ) : (
          <span className="badge badge-out-of-stock">
            <XCircle size={12} /> Out of Stock
          </span>
        )}
      </div>

      {/* Book Metadata: Title, Author, ISBN */}
      <div 
        style={{ marginBottom: '1.25rem', cursor: onViewDetails ? 'pointer' : 'default' }}
        onClick={() => onViewDetails && onViewDetails(book)}
      >
        <h3 className="book-title" title={book.title}>{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        <p className="book-isbn">ISBN: {book.isbn}</p>
      </div>

      {/* Footer with Copies indicator and Student Borrow CTA */}
      <div className="book-card-footer">
        <div className="stock-indicator">
          <span className="stock-count" style={{ color: isAvailable ? 'var(--mint-text)' : 'var(--peach-text)' }}>
            {book.availableQuantity} / {book.quantity}
          </span>
          <span className="stock-label">
            {isAvailable ? 'Copies Ready' : 'Out of Stock'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(book)}
              className="btn btn-outline btn-sm"
              title="View Book Details"
              style={{ padding: '0.4rem 0.55rem' }}
            >
              <Info size={14} />
            </button>
          )}

          {/* FOR STUDENT: Show "Borrow Book" button when availableQuantity > 0, otherwise "Not Available" */}
          {isAuthenticated && isStudent && (
            isAvailable ? (
              <button
                type="button"
                onClick={() => onBorrow && onBorrow(book.id)}
                disabled={isBorrowing}
                className="btn btn-primary btn-sm"
                title="Borrow this book for 14 days"
              >
                {isBorrowing ? (
                  <>
                    <Loader2 size={14} className="spin-animation" /> Borrowing...
                  </>
                ) : (
                  <>
                    <BookmarkPlus size={14} /> Borrow
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="btn btn-outline btn-sm"
                style={{ opacity: 0.55, cursor: 'not-allowed' }}
                title="This title is currently out of stock"
              >
                <XCircle size={14} /> Unavailable
              </button>
            )
          )}

          {/* FOR ADMIN: Manage in Admin Workspace */}
          {isAdmin && (
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Admin View
            </span>
          )}

          {/* Public Visitor */}
          {!isAuthenticated && (
            <a href="/login" className="btn btn-secondary btn-sm" title="Sign in to borrow books">
              Sign In
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;
