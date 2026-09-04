import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VerdictBadge from '../components/VerdictBadge';

export default function ProblemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, apiFetch } = useAuth();

  const [problem, setProblem] = useState(null);
  const [samples, setSamples] = useState([]);
  const [problemSubmissions, setProblemSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'submit' | 'submissions'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Submit form state
  const [language, setLanguage] = useState('cpp');
  const [sourceCode, setSourceCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function loadProblemData() {
      try {
        setLoading(true);
        setError('');

        const [probRes, samplesRes] = await Promise.all([
          apiFetch(`/problem/${slug}`),
          apiFetch(`/problem/${slug}/samples`),
        ]);

        const probData = await probRes.json();
        const samplesData = await samplesRes.json();

        if (probRes.ok && probData.success) {
          setProblem(probData.problem);
        } else {
          setError(probData.message || 'Problem not found');
        }

        if (samplesRes.ok && samplesData.success) {
          setSamples(samplesData.samples || []);
        }
      } catch (err) {
        setError(err.message || 'Error loading problem');
      } finally {
        setLoading(false);
      }
    }

    loadProblemData();
  }, [slug, apiFetch]);

  // Load problem submissions when tab is clicked
  useEffect(() => {
    if (activeTab === 'submissions' && user && problem) {
      apiFetch(`/submit/my-submissions?slug=${slug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setProblemSubmissions(data.data || []);
          }
        })
        .catch(() => { });
    }
  }, [activeTab, user, problem, slug, apiFetch]);

  // Handle Tab key in textarea
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = e.target.value;
      setSourceCode(val.substring(0, start) + '    ' + val.substring(end));
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (!sourceCode.trim()) {
      setSubmitError('Source code cannot be empty.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      const res = await apiFetch(`/submit/${slug}`, {
        method: 'POST',
        body: { language, sourceCode },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit solution');
      }

      // Navigate to submission details page
      navigate(`/submission/${data.submission.id}`);
    } catch (err) {
      setSubmitError(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><p className="status-text">Loading problem...</p></div>;
  }

  if (error || !problem) {
    return (
      <div className="page-container">
        <div className="error-box">{error || 'Problem not found'}</div>
        <Link to="/" className="btn-back">← Back to problem set</Link>
      </div>
    );
  }

  return (
    <div className="page-container problem-view-page">
      <div className="problem-header">
        <div className="problem-title-row">
          <h2>{problem.title}</h2>
          <span className={`diff-tag diff-${problem.difficulty?.toLowerCase()}`}>
            {problem.difficulty}
          </span>
        </div>

        <div className="problem-limits">
          <span>Time limit: <strong>{(problem.timeLimit / 1000).toFixed(2)} s</strong></span>
          <span>Memory limit: <strong>{problem.memoryLimit} MB</strong></span>
          {problem.category && <span>Category: <strong>{problem.category}</strong></span>}
        </div>
      </div>

      <div className="problem-tabs">
        <button
          className={`tab-btn ${activeTab === 'statement' ? 'active' : ''}`}
          onClick={() => setActiveTab('statement')}
        >
          Statement
        </button>
        <button
          className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          Submit Solution
        </button>
        {user && (
          <button
            className={`tab-btn ${activeTab === 'submissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            My Submissions
          </button>
        )}
      </div>

      {activeTab === 'statement' && (
        <div className="statement-content">
          {problem.description ? (
            <div className="statement-section">
              <p className="statement-text">{problem.description}</p>
            </div>
          ) : (
            <p className="statement-text text-muted">No description provided for this problem.</p>
          )}

          {problem.inputFormat && (
            <div className="statement-section">
              <h4>Input</h4>
              <p className="statement-text">{problem.inputFormat}</p>
            </div>
          )}

          {problem.outputFormat && (
            <div className="statement-section">
              <h4>Output</h4>
              <p className="statement-text">{problem.outputFormat}</p>
            </div>
          )}

          {problem.constraints && (
            <div className="statement-section">
              <h4>Constraints</h4>
              <p className="statement-text">{problem.constraints}</p>
            </div>
          )}

          {samples.length > 0 && (
            <div className="statement-section">
              <h4>Example</h4>
              {samples.map((sample, idx) => (
                <div key={sample.id || idx} className="sample-block">
                  <div className="sample-col">
                    <span className="sample-label">Input:</span>
                    <pre className="code-block">{sample.input}</pre>
                  </div>
                  <div className="sample-col">
                    <span className="sample-label">Output:</span>
                    <pre className="code-block">{sample.output}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button onClick={() => setActiveTab('submit')} className="btn-primary">
              Submit Solution →
            </button>
          </div>
        </div>
      )}

      {activeTab === 'submit' && (
        <div className="submit-content">
          {!user ? (
            <div className="auth-prompt-box">
              <p>You must be logged in to submit a solution.</p>
              <Link to="/login" className="btn-primary">Login to Submit</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="submit-form">
              {submitError && <div className="error-box">{submitError}</div>}

              <div className="form-group-inline">
                <label htmlFor="language">Language:</label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="select-input"
                >
                  <option value="cpp">C++ (GCC / C++17)</option>
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="java">Java</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sourceCode">Source Code:</label>
                <textarea
                  id="sourceCode"
                  className="code-textarea"
                  rows={18}
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`// Paste your ${language.toUpperCase()} solution code here...`}
                  spellCheck={false}
                  required
                />
              </div>

              <div className="submit-actions">
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Code'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="submissions-content">
          {problemSubmissions.length === 0 ? (
            <p className="text-muted">You have no submissions for this problem yet.</p>
          ) : (
            <table className="problem-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {problemSubmissions.map((sub) => (
                  <tr key={sub._id}>
                    <td style={{ fontSize: '12px', color: '#666' }}>
                      {new Date(sub.createdAt).toLocaleString()}
                    </td>
                    <td>{sub.language}</td>
                    <td><VerdictBadge status={sub.status} /></td>
                    <td>{sub.executionTime ? `${(sub.executionTime / 1000).toFixed(2)}s` : '-'}</td>
                    <td>
                      <Link to={`/submission/${sub._id}`} className="problem-link">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

