import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCreatePoll = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate('/create');
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Create Beautiful
                <span className="text-gradient"> Interactive Forms</span>
                <br />
                & Polls in Minutes
              </h1>
              <p className="hero-description">
                Build engaging surveys, polls, and forms with real-time results. 
                Share them anywhere and collect responses instantly with our 
                powerful, easy-to-use platform.
              </p>
              <div className="hero-actions">
                <button 
                  onClick={handleCreatePoll}
                  className="btn btn-primary btn-lg"
                >
                  <i className="fas fa-plus"></i>
                  Create Your First Poll
                </button>
                <Link to="/polls" className="btn btn-outline btn-lg">
                  <i className="fas fa-eye"></i>
                  View All Polls
                </Link>
              </div>
            </div>
            <div className="hero-visual">
              <div className="poll-preview">
                <div className="poll-card">
                  <h3>What's your favorite programming language?</h3>
                  <div className="poll-options">
                    <div className="poll-option">
                      <span>JavaScript</span>
                      <div className="poll-bar">
                        <div className="poll-fill" style={{width: '45%'}}></div>
                      </div>
                      <span>45%</span>
                    </div>
                    <div className="poll-option">
                      <span>Python</span>
                      <div className="poll-bar">
                        <div className="poll-fill" style={{width: '30%'}}></div>
                      </div>
                      <span>30%</span>
                    </div>
                    <div className="poll-option">
                      <span>React</span>
                      <div className="poll-bar">
                        <div className="poll-fill" style={{width: '25%'}}></div>
                      </div>
                      <span>25%</span>
                    </div>
                  </div>
                  <div className="poll-stats">
                    <span><i className="fas fa-users"></i> 1,234 votes</span>
                    <span className="live-indicator">
                      <i className="fas fa-circle"></i> Live
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose VoteForm?</h2>
            <p>Everything you need to create, share, and analyze polls & forms</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-bolt"></i>
              </div>
              <h3>Real-time Results</h3>
              <p>Watch responses come in live with instant updates and beautiful visualizations.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3>Mobile Responsive</h3>
              <p>Your polls look great and work perfectly on any device, anywhere.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-share-alt"></i>
              </div>
              <h3>Easy Sharing</h3>
              <p>Share your polls with a simple link. No registration required for voters.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <h3>Rich Analytics</h3>
              <p>Get detailed insights with charts, graphs, and exportable data.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-palette"></i>
              </div>
              <h3>Customizable</h3>
              <p>Multiple question types, themes, and customization options.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-lock"></i>
              </div>
              <h3>Privacy Control</h3>
              <p>Choose between public polls or private, invitation-only surveys.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join thousands of users creating engaging polls and forms</p>
            <div className="cta-actions">
              <button 
                onClick={handleCreatePoll}
                className="btn btn-primary btn-lg"
              >
                Start Creating Now
              </button>
              {!isAuthenticated && (
                <Link to="/register" className="btn btn-outline btn-lg">
                  Sign Up Free
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
