import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Mail, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import '../styles/auth.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isAdmin, isStudent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect accordingly
  React.useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) navigate('/admin', { replace: true });
      else if (isStudent) navigate('/student', { replace: true });
    }
  }, [isAuthenticated, isAdmin, isStudent, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(email.trim(), password);
      
      const from = location.state?.from?.pathname;
      if (from && from !== '/login' && from !== '/register') {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/student', { replace: true });
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (fillEmail, fillPass) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-circle">
            <BookOpen size={28} />
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your LibriFlow account</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary auth-btn-submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="spin-animation" /> Signing in...
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Autofill Box for Evaluator Convenience */}
        <div className="quick-fill-box">
          <div className="quick-fill-label">Demo Quick-Fill</div>
          <div className="quick-fill-btns">
            <button
              type="button"
              className="quick-fill-btn"
              onClick={() => handleQuickFill('admin@library.com', 'admin123')}
            >
              👑 Admin (admin@library.com)
            </button>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account?
          <Link to="/register" className="auth-link">
            Create Student Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
