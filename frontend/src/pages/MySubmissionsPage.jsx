import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VerdictBadge from '../components/VerdictBadge';

export default function MySubmissionsPage() {
  const { user, apiFetch } = useAuth();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function loadSubmissions() {
      try {
        setLoading(true);
        const res = await apiFetch('/submit/my-submissions');
        const data = await res.json();
        if (res.ok && data.success) {
          setSubmissions(data.data || []);
        } else {
          setError(data.message || 'Failed to load submissions');
        }
      } catch (err) {
        setError(err.message || 'Error loading submissions');
      } finally {
        setLoading(false);
      }
    }

    loadSubmissions();
  }, [user, apiFetch, navigate]);

  if (loading) {
    return <div className="page-container"><p className="status-text">Loading your submissions...</p></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>My Submissions</h2>
        <p className="page-description">History of your code submissions across all problems.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      {submissions.length === 0 ? (
        <div className="empty-box">
          <p>You haven't submitted any solutions yet.</p>
          <Link to="/" className="btn-primary" style={{ display: 'inline-block', marginTop: '12px' }}>
            Browse Problems
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="problem-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Date</th>
                <th>Problem</th>
                <th style={{ width: '100px' }}>Language</th>
                <th style={{ width: '160px' }}>Status</th>
                <th style={{ width: '100px', textAlign: 'right' }}>Time</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub._id}>
                  <td style={{ fontSize: '13px', color: '#666' }}>
                    {new Date(sub.createdAt).toLocaleString()}
                  </td>
                  <td>
                    {sub.problemId ? (
                      <Link to={`/problem/${sub.problemId.slug}`} className="problem-link">
                        {sub.problemId.title}
                      </Link>
                    ) : (
                      'Unknown'
                    )}
                  </td>
                  <td>
                    <span className="lang-tag">{sub.language}</span>
                  </td>
                  <td>
                    <VerdictBadge status={sub.status} />
                  </td>
                  <td style={{ textAlign: 'right', color: '#666', fontSize: '13px' }}>
                    {sub.executionTime !== undefined ? `${(sub.executionTime / 1000).toFixed(2)}s` : '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Link to={`/submission/${sub._id}`} className="problem-link">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

