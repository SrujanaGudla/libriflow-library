import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  ArrowLeftRight, 
  CircleDollarSign, 
  User, 
  GraduationCap, 
  ShieldCheck, 
  X,
  BookMarked
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { user, isAdmin, isStudent } = useAuth();

  const navLinkClass = ({ isActive }) =>
    `sidebar-nav-item ${isActive ? 'active' : ''}`;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Brand Header */}
        <div className="sidebar-brand-header">
          <Link to={isAdmin ? '/admin' : '/student'} className="sidebar-brand-link" onClick={onCloseMobile}>
            <div className="sidebar-brand-icon">
              <BookOpen size={24} color="#5B8DB8" strokeWidth={2.2} />
            </div>
            <div className="sidebar-brand-text">
              <h1 className="sidebar-brand-title">LibriFlow</h1>
              <span className="sidebar-brand-subtitle">Smart Library Management System</span>
            </div>
          </Link>
          <button 
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close sidebar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <NavLink 
            to={isAdmin ? '/admin' : '/student'} 
            className={navLinkClass}
            onClick={onCloseMobile}
            end
          >
            <LayoutDashboard size={19} className="nav-icon" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to={isAdmin ? '/admin/books' : '/books'} 
            className={navLinkClass}
            onClick={onCloseMobile}
          >
            <BookOpen size={19} className="nav-icon" />
            <span>Books</span>
          </NavLink>

          <NavLink 
            to="/borrowings" 
            className={navLinkClass}
            onClick={onCloseMobile}
          >
            <ArrowLeftRight size={19} className="nav-icon" />
            <span>Borrowings</span>
          </NavLink>

          <NavLink 
            to="/fines" 
            className={navLinkClass}
            onClick={onCloseMobile}
          >
            <CircleDollarSign size={19} className="nav-icon" />
            <span>Fines</span>
          </NavLink>

          <NavLink 
            to="/profile" 
            className={navLinkClass}
            onClick={onCloseMobile}
          >
            <User size={19} className="nav-icon" />
            <span>Profile</span>
          </NavLink>
        </nav>

        {/* Bottom Role Card (e.g. Lavender Student Card from image) */}
        <div className="sidebar-footer">
          <div className="sidebar-member-card">
            <div className="member-card-icon">
              {isAdmin ? (
                <ShieldCheck size={20} color="#315F7B" />
              ) : (
                <GraduationCap size={20} color="#315F7B" />
              )}
            </div>
            <div className="member-card-info">
              <span className="member-card-role">{isAdmin ? 'Administrator' : 'Student'}</span>
              <span className="member-card-status">{isAdmin ? 'System Admin' : 'Library Member'}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
