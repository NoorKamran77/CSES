import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJudgeStatus } from '../hooks/useJudgeStatus';
import VerdictBadge from '../components/VerdictBadge';

export default function SubmissionPage() {
  const { id } = useParams();
  const { apiFetch } = useAuth();
  const judgeOnline = useJudgeStatus();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const pollTimerRef = useRef(null);

  const fetchSubmission = async () => {
    try {
      const res = await apiFetch(`/submit/submissions/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmission(data.data);
        return data.data;
      } else {
        setError(data.message || 'Submission not found');
      }
    } catch (err) {
      setError(err.message || 'Error loading submission');
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    async function poll() {
      const sub = await fetchSubmission();
      if (!isMounted) return;

      // If submission is still processing, poll again (slower if judge is offline)
      if (sub && ['Pending', 'Queued', 'Compiling', 'Running'].includes(sub.status)) {
        const interval = judgeOnline === false ? 4000 : 1500;
        pollTimerRef.current = setTimeout(poll, interval);
      }
    }

    poll();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [id, judgeOnline]);

  const handleCopyCode = () => {
    if (submission?.sourceCode) {
      navigator.clipboard.writeText(submission.sourceCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="page-container"><p className="status-text">Loading submission details...</p></div>;
  }

  if (error || !submission) {
    return (
      <div className="page-container">
        <div className="error-box">{error || 'Submission not found'}</div>
        <Link to="/" className="btn-back">← Back to problem set</Link>
      </div>
    );
  }

  const isProcessing = ['Pending', 'Queued', 'Compiling', 'Running'].includes(submission.status);

  return (
    <div className="page-container submission-view-page">
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/">Problems</Link> /{' '}
          {submission.problemId ? (
            <Link to={`/problem/${submission.problemId.slug}`}>{submission.problemId.title}</Link>
          ) : (
            'Problem'
          )}{' '}
          / <span>Submission #{id.slice(-6)}</span>
        </div>
        <h2>Submission Details</h2>
      </div>

      <div className="submission-card">
        {isProcessing && judgeOnline === false && (
          <div
            className="error-box"
            style={{
              backgroundColor: '#fff3e0',
              borderColor: '#ffb74d',
              color: '#e65100',
              marginBottom: '20px',
            }}
          >
            ⚠️ <strong>Judge Worker Offline:</strong> The judge service on the host machine is currently offline. Your submission is waiting in the queue and will be processed automatically as soon as the judge worker connects.
          </div>
        )}

        <div className="submission-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Problem:</span>
            <span className="meta-value">
              {submission.problemId ? (
                <Link to={`/problem/${submission.problemId.slug}`} className="problem-link">
                  {submission.problemId.title}
                </Link>
              ) : (
                'Unknown'
              )}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Verdict:</span>
            <span className="meta-value">
              <VerdictBadge status={submission.status} />
              {isProcessing && (
                judgeOnline === false ? (
                  <span className="processing-hint" style={{ color: '#e65100' }}>
                    Judge offline — queued
                  </span>
                ) : (
                  <span className="processing-hint">Judging in progress...</span>
                )
              )}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Language:</span>
            <span className="meta-value">
              <strong>{submission.language?.toUpperCase()}</strong>
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Execution Time:</span>
            <span className="meta-value">
              {submission.executionTime !== undefined ? `${(submission.executionTime / 1000).toFixed(2)} s` : '-'}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Submitted:</span>
            <span className="meta-value">
              {new Date(submission.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="meta-item">
            <span className="meta-label">Submitted By:</span>
            <span className="meta-value">
              {submission.userId?.username || 'User'}
            </span>
          </div>
        </div>

        {submission.compilerOutput && (
          <div className="error-output-section">
            <h4>Compiler Output:</h4>
            <pre className="code-block compiler-output">{submission.compilerOutput}</pre>
          </div>
        )}

        {submission.errorMessage && (
          <div className="error-output-section">
            <h4>Judge Feedback:</h4>
            <pre className="code-block compiler-output">{submission.errorMessage}</pre>
          </div>
        )}

        <div className="source-code-section">
          <div className="section-title-row">
            <h4>Submitted Source Code:</h4>
            <button onClick={handleCopyCode} className="btn-copy">
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <pre className="code-block source-code-block">{submission.sourceCode}</pre>
        </div>

        <div className="submission-actions">
          {submission.problemId && (
            <Link to={`/problem/${submission.problemId.slug}`} className="btn-secondary">
              ← Return to Problem
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

