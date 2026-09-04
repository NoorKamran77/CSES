import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProblemListPage() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { apiFetch, user } = useAuth();

  useEffect(() => {
    async function loadProblems() {
      try {
        setLoading(true);
        const res = await apiFetch('/problem/grouped');
        const data = await res.json();
        if (res.ok && data.success) {
          setSections(data.sections || []);
        } else {
          setError(data.message || 'Failed to load problems');
        }
      } catch (err) {
        setError(err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    }

    loadProblems();
  }, [apiFetch, user]);

  if (loading) {
    return <div className="page-container"><p className="status-text">Loading problem set...</p></div>;
  }

  if (error) {
    return <div className="page-container"><div className="error-box">{error}</div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>CSES Problem Set</h2>
        <p className="page-description">
          A collection of algorithmic programming problems. Submit your solutions to test against our custom judge.
        </p>
      </div>

      {sections.length === 0 ? (
        <div className="empty-box">No problems published yet.</div>
      ) : (
        <div className="sections-container">
          {sections.map((sec) => (
            <div key={sec.category} className="category-section">
              <div className="category-header">
                <h3 className="category-title">{sec.category}</h3>
                <span className="category-stats">
                  {user ? `${sec.solvedCount} / ${sec.totalCount} solved` : `${sec.totalCount} problems`}
                </span>
              </div>

              <div className="table-responsive">
                <table className="problem-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                      <th style={{ width: '40px', textAlign: 'center' }}>Status</th>
                      <th>Problem Title</th>
                      <th style={{ width: '120px' }}>Difficulty</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>Limits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.problems.map((prob, idx) => (
                      <tr key={prob.id || prob.slug} className={prob.isSolved ? 'row-solved' : ''}>
                        <td style={{ textAlign: 'center', color: '#888' }}>{prob.order || idx + 1}</td>
                        <td style={{ textAlign: 'center' }}>
                          {prob.isSolved ? (
                            <span className="solved-check" title="Solved">✓</span>
                          ) : (
                            <span className="unsolved-dot">·</span>
                          )}
                        </td>
                        <td>
                          <Link to={`/problem/${prob.slug}`} className="problem-link">
                            {prob.title}
                          </Link>
                        </td>
                        <td>
                          <span className={`diff-tag diff-${prob.difficulty?.toLowerCase()}`}>
                            {prob.difficulty || 'Easy'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: '#666', fontSize: '12px' }}>
                          {prob.timeLimit ? `${(prob.timeLimit / 1000).toFixed(2)}s` : '1.00s'} / {prob.memoryLimit || 256}MB
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

