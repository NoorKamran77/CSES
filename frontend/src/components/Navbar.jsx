import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJudgeStatus } from '../hooks/useJudgeStatus';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const judgeOnline = useJudgeStatus();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-title">CSES</Link>
          <span className="brand-subtitle">Problem Set</span>
        </div>

        <nav className="navbar-links">
          <Link to="/" className="nav-link">Problems</Link>
          {user && (
            <Link to="/my-submissions" className="nav-link">My Submissions</Link>
          )}
        </nav>

        <div className="navbar-auth">
          {/* Judge worker online/offline indicator */}
          <div className="judge-status" title={
            judgeOnline === null
              ? 'Checking judge status…'
              : judgeOnline
                ? 'Judge worker is online and accepting submissions'
                : 'Judge worker is offline — submissions will queue until it reconnects'
          }>
            <span
              className={`judge-dot ${judgeOnline === null ? 'judge-dot--loading' :
                judgeOnline ? 'judge-dot--online' : 'judge-dot--offline'
                }`}
            />
            <span className="judge-label">
              {judgeOnline === null ? 'Judge…' : judgeOnline ? 'Judge Online' : 'Judge Offline'}
            </span>
          </div>

          {user ? (
            <div className="user-section">
              <span className="user-name">
                <strong>{user.username}</strong>
                {user.solvedProblems && (
                  <span className="solved-badge" title="Solved problems">
                    {user.solvedProblems.length} ✓
                  </span>
                )}
              </span>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
