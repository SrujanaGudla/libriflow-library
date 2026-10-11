import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { borrowingService, fineService } from '../services/api';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  User, 
  LogOut, 
  Menu, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  CreditCard
} from 'lucide-react';

export const Header = ({ onToggleMobileSidebar }) => {
  const { user, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch in-app notification alerts
  useEffect(() => {
    loadInAppNotifications();
  }, [user]);

  const loadInAppNotifications = async () => {
    try {
      const notifs = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isStudent) {
        const [borrowingsRes, finesRes] = await Promise.all([
          borrowingService.getMyBorrowings(),
          fineService.getMyFines(),
        ]);

        const myLoans = borrowingsRes?.data || [];
        const myFines = finesRes?.data || [];

        // Check active loans for due-soon or overdue
        myLoans.filter(b => b.status === 'BORROWED').forEach(loan => {
          if (loan.dueDate) {
            const dueDate = new Date(loan.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              notifs.push({
                id: `overdue-${loan.id}`,
                type: 'danger',
                title: 'Overdue Book Warning',
                message: `"${loan.bookTitle}" was due on ${loan.dueDate}. Late fee of ₹10/day applies.`,
                link: '/borrowings'
              });
            } else if (diffDays <= 3) {
              notifs.push({
                id: `due-soon-${loan.id}`,
                type: 'warning',
                title: 'Due Date Reminder',
                message: `"${loan.bookTitle}" is due in ${diffDays === 0 ? 'today' : `${diffDays} day(s)`} (${loan.dueDate}).`,
                link: '/borrowings'
              });
            }
          }
        });

        // Check unpaid fines
        myFines.filter(f => f.status === 'UNPAID').forEach(fine => {
          notifs.push({
            id: `fine-${fine.id}`,
            type: 'peach',
            title: 'Outstanding Fine Notice',
            message: `Unpaid penalty of ₹${fine.amount?.toFixed(2)} for "${fine.bookTitle}".`,
            link: '/fines'
          });
        });
      } else if (isAdmin) {
        const finesRes = await fineService.getAllFines();
        const unpaid = finesRes?.data?.filter(f => f.status === 'UNPAID') || [];
        if (unpaid.length > 0) {
          notifs.push({
            id: 'admin-unpaid',
            type: 'warning',
            title: 'Unpaid Fines Pending',
            message: `There are ${unpaid.length} unsettled student fine records across the library.`,
            link: '/fines'
          });
        }
      }

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/books?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/books');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || (isAdmin ? 'Admin' : 'Geetha Reddy');
  const displayRole = isAdmin ? 'Admin' : 'Student';

  return (
    <header className="header-container">
      {/* Mobile Toggle Button */}
      <button 
        className="header-mobile-toggle"
        onClick={onToggleMobileSidebar}
        aria-label="Open navigation menu"
      >
        <Menu size={22} />
      </button>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="header-search-form">
        <div className="header-search-wrapper">
          <Search size={18} className="header-search-icon" />
          <input
            type="text"
            className="header-search-input"
            placeholder="Search books, authors, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Header Right Actions */}
      <div className="header-actions">
        {/* Notification Bell */}
        <div className="header-dropdown-wrap" ref={notifRef}>
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => setNotificationOpen(!notificationOpen)}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && <span className="header-notif-dot" />}
          </button>

          {notificationOpen && (
            <div className="header-dropdown notif-dropdown">
              <div className="notif-header">
                <span className="notif-title">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    className="notif-clear-btn"
                    onClick={() => setUnreadCount(0)}
                  >
                    Mark as read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <CheckCircle2 size={24} color="#1E7E34" />
                    <p>All caught up! No pending alerts or overdue fees.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <Link
                      key={notif.id}
                      to={notif.link}
                      className={`notif-item notif-item-${notif.type}`}
                      onClick={() => setNotificationOpen(false)}
                    >
                      <div className="notif-icon-col">
                        {notif.type === 'danger' ? (
                          <AlertTriangle size={16} />
                        ) : notif.type === 'peach' ? (
                          <CreditCard size={16} />
                        ) : (
                          <Clock size={16} />
                        )}
                      </div>
                      <div className="notif-text-col">
                        <span className="notif-item-title">{notif.title}</span>
                        <p className="notif-item-desc">{notif.message}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="header-dropdown-wrap" ref={profileRef}>
          <button
            type="button"
            className="header-profile-btn"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            aria-label="User profile menu"
          >
            <div className="header-avatar">
              <User size={18} color="#315F7B" />
            </div>
            <div className="header-user-info">
              <span className="header-user-name">
                {displayName}
                <ChevronDown size={14} className="header-chevron" />
              </span>
              <span className="header-user-role">{displayRole}</span>
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="header-dropdown profile-dropdown">
              <div className="profile-dropdown-user">
                <span className="dropdown-user-name">{displayName}</span>
                <span className="dropdown-user-email">{user?.email || 'user@library.com'}</span>
                <span className={isAdmin ? 'badge badge-admin' : 'badge badge-student'} style={{ marginTop: '0.35rem' }}>
                  {displayRole}
                </span>
              </div>

              <div className="profile-dropdown-links">
                <Link
                  to="/profile"
                  className="profile-dropdown-item"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <User size={16} />
                  <span>View Profile</span>
                </Link>

                <button
                  type="button"
                  className="profile-dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
