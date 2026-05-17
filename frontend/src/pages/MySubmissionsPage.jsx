import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/submissions/my')
      .then((res) => setSubmissions(res.data))
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  const gradedCount = submissions.filter((s) => s.status === 'graded').length;
  const avgScore =
    gradedCount > 0
      ? Math.round(
          submissions
            .filter((s) => s.status === 'graded')
            .reduce(
              (sum, s) => sum + (s.marks / s.assignment.totalMarks) * 100,
              0
            ) / gradedCount
        )
      : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Submissions</h1>
          <p className="page-subtitle">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Stats */}
      {submissions.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon">📤</div>
            <div className="stat-value">{submissions.length}</div>
            <div className="stat-label">Total Submitted</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{gradedCount}</div>
            <div className="stat-label">Graded</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-value">{submissions.length - gradedCount}</div>
            <div className="stat-label">Awaiting Grade</div>
          </div>
          {avgScore !== null && (
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{avgScore}%</div>
              <div className="stat-label">Average Score</div>
            </div>
          )}
        </div>
      )}

      {submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No submissions yet</h3>
          <p>You haven't submitted any assignments yet.</p>
          <Link to="/assignments" className="btn btn-primary">
            Browse Assignments
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {submissions.map((sub) => (
            <SubmissionCard key={sub._id} submission={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ submission }) {
  const { assignment } = submission;
  const statusMap = {
    graded: { label: 'Graded', cls: 'badge-success' },
    submitted: { label: 'Submitted', cls: 'badge-info' },
    late: { label: 'Late', cls: 'badge-warning' },
  };
  const status = statusMap[submission.status] || { label: submission.status, cls: 'badge-muted' };
  const percent =
    submission.status === 'graded'
      ? Math.round((submission.marks / assignment.totalMarks) * 100)
      : null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>{assignment?.title}</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            📚 {assignment?.subject} · 👨‍🏫 {assignment?.teacher?.name}
          </div>
        </div>
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>

      {submission.content && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {submission.content}
        </p>
      )}

      {submission.fileUrl && (
        <a
          href={submission.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: 'flex-start' }}
        >
          📎 {submission.fileName || 'View File'}
        </a>
      )}

      {submission.status === 'graded' && (
        <div
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ade80' }}>
              {submission.marks}/{assignment.totalMarks}
            </span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              ({percent}%)
            </span>
          </div>
          {submission.feedback && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', flex: 1 }}>
              💬 {submission.feedback}
            </p>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          Submitted {new Date(submission.submittedAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </span>
        <Link to={`/assignments/${assignment?._id}`} className="btn btn-ghost btn-sm">
          View Assignment →
        </Link>
      </div>
    </div>
  );
}
