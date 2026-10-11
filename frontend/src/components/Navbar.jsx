import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  LayoutDashboard, 
  Library, 
  BookmarkCheck, 
  DollarSign, 
  LogOut, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  GraduationCap, 
  Menu, 
  X 
} from 'lucide-react';

export const Navbar = () => {
  const { isAuthenticated, user, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: isActive ? '#ffffff' : 'var(--text-muted)',
    background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
    border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
    transition: 'all 0.2s ease',
  });

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand Logo: 📚 LibriFlow */}
        <Link to={isAdmin ? '/admin' : isStudent ? '/student' : '/login'} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 800,
          fontSize: '1.25rem',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.02em',
          textDecoration: 'none',
        }}>
          <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>📚</span>
          <span style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
          }}>
            LibriFlow
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav style={{
          display: 'none',
          alignItems: 'center',
          gap: '0.5rem',
        }} className="desktop-nav">
          {isAuthenticated ? (
            <>
              {/* ADMIN LINKS */}
              {isAdmin && (
                <>
                  <NavLink to="/admin" style={navLinkStyle}>
                    <LayoutDashboard size={17} /> Admin Dashboard
                  </NavLink>
                  <NavLink to="/admin/books" style={navLinkStyle}>
                    <BookOpen size={17} /> Manage Books
                  </NavLink>
                  <NavLink to="/borrowings" style={navLinkStyle}>
                    <BookmarkCheck size={17} /> Borrowings
                  </NavLink>
                  <NavLink to="/fines" style={navLinkStyle}>
                    <DollarSign size={17} /> Fines
                  </NavLink>
                </>
              )}

              {/* STUDENT LINKS - strictly Student functionality */}
              {isStudent && (
                <>
                  <NavLink to="/student" style={navLinkStyle}>
                    <LayoutDashboard size={17} /> Dashboard
                  </NavLink>
                  <NavLink to="/books" style={navLinkStyle}>
                    <BookOpen size={17} /> Books
                  </NavLink>
                  <NavLink to="/borrowings" style={navLinkStyle}>
                    <BookmarkCheck size={17} /> My Borrowings
                  </NavLink>
                  <NavLink to="/fines" style={navLinkStyle}>
                    <DollarSign size={17} /> My Fines
                  </NavLink>
                </>
              )}
            </>
          ) : (
            <>
              <NavLink to="/books" style={navLinkStyle}>
                <BookOpen size={17} /> Books
              </NavLink>
            </>
          )}
        </nav>

        {/* User Account / Auth Actions */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '1rem',
        }} className="desktop-nav">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}>
                {isAdmin ? (
                  <span className="badge badge-admin">
                    <ShieldCheck size={12} /> Admin
                  </span>
                ) : (
                  <span className="badge badge-student">
                    <GraduationCap size={12} /> Student
                  </span>
                )}
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {user?.name}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title="Log Out"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} /> Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} /> Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-toggle-btn"
          style={{
            display: 'block',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            padding: '0.5rem',
          }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={{
          padding: '1rem 1.5rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-dark)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {isAuthenticated ? (
            <>
              <div style={{
                padding: '0.5rem 0',
                marginBottom: '0.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: 600 }}>{user?.name}</span>
                <span className={isAdmin ? 'badge badge-admin' : 'badge badge-student'}>
                  {isAdmin ? 'Admin' : 'Student'}
                </span>
              </div>

              {isAdmin ? (
                <>
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0' }}>Admin Dashboard</Link>
                  <Link to="/admin/books" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0' }}>Manage Books</Link>
                  <Link to="/borrowings" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0' }}>Borrowings</Link>
                  <Link to="/fines" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0' }}>Fines</Link>
                </>
              ) : (
                <>
                  <Link to="/student" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0' }}>Dashboard</Link>
                  <Link to="/books" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0' }}>Books</Link>
                  <Link to="/borrowings" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0' }}>My Borrowings</Link>
                  <Link to="/fines" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0' }}>My Fines</Link>
                </>
              )}

              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="btn btn-danger btn-sm"
                style={{ marginTop: '0.5rem' }}
              >
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Link to="/books" onClick={() => setMobileMenuOpen(false)} style={{ padding: '0.5rem 0' }}>Books</Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary">Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary">Register</Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 820px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
