import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleCreatePoll = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/create');
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Brand */}
          <Link to="/" className="navbar-brand">
            <i className="fas fa-poll"></i>
            VoteForm
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav desktop-nav">
            <Link to="/" className="navbar-link">
              Home
            </Link>
            <Link to="/polls" className="navbar-link">
              Browse Polls
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="navbar-link">
                  Dashboard
                </Link>
                <button 
                  onClick={handleCreatePoll}
                  className="btn btn-primary btn-sm"
                >
                  <i className="fas fa-plus"></i>
                  Create Poll
                </button>
                <div className="user-menu">
                  <button 
                    className="user-avatar"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  
                  {isMenuOpen && (
                    <div className="dropdown-menu">
                      <div className="dropdown-header">
                        <div className="user-info">
                          <div className="user-name">{user?.name}</div>
                          <div className="user-email">{user?.email}</div>
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                      <Link 
                        to="/dashboard" 
                        className="dropdown-item"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fas fa-tachometer-alt"></i>
                        Dashboard
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="dropdown-item"
                      >
                        <i className="fas fa-sign-out-alt"></i>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={handleCreatePoll}
                  className="btn btn-outline btn-sm"
                >
                  Create Poll
                </button>
                <Link to="/login" className="btn btn-primary btn-sm">
                  Sign In
                </Link>
              </>
            )}

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="theme-toggle"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mobile-nav">
            <Link 
              to="/" 
              className="mobile-nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/polls" 
              className="mobile-nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Polls
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleCreatePoll}
                  className="mobile-nav-link"
                >
                  Create Poll
                </button>
                <button 
                  onClick={handleLogout}
                  className="mobile-nav-link"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleCreatePoll}
                  className="mobile-nav-link"
                >
                  Create Poll
                </button>
                <Link 
                  to="/login" 
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              </>
            )}
            
            <button 
              onClick={toggleTheme}
              className="mobile-nav-link"
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
