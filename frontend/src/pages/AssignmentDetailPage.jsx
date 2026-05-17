import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === 'teacher';

  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  // Submit form state
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const res = await api.get(`/assignments/${id}`);
      setAssignment(res.data);

      // For students, check if already submitted
      if (user?.role === 'student') {
        try {
          const allRes = await api.get('/assignments');
          const found = allRes.data.find((a) => a._id === id);
          if (found?.submission) setSubmission(found.submission);
        } catch (_) {}
      }
    } catch (err) {
      toast.error('Assignment not found');
      navigate('/assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      toast.error('Please provide text or upload a file');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', id);
      if (content.trim()) formData.append('content', content.trim());
      if (file) formData.append('file', file);

      const res = await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmission(res.data.submission);
      toast.success('Assignment submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this assignment and all its submissions?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted');
      navigate('/assignments');
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (!assignment) return null;

  const isOverdue = new Date(assignment.dueDate) < new Date();
  const isClosed = assignment.status === 'closed';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Link to="/assignments" className="btn btn-ghost btn-sm">
              ← Back
            </Link>
            <span className="badge badge-primary">{assignment.subject}</span>
            {isClosed ? (
              <span className="badge badge-muted">Closed</span>
            ) : isOverdue ? (
              <span className="badge badge-danger">Overdue</span>
            ) : (
              <span className="badge badge-success">Active</span>
            )}
          </div>
          <h1 className="page-title">{assignment.title}</h1>
          <p className="page-subtitle">
            Posted by {assignment.teacher?.name} ·{' '}
            {new Date(assignment.createdAt).toLocaleDateString()}
          </p>
        </div>
        {isTeacher && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to={`/assignments/${id}/submissions`} className="btn btn-secondary">
              📥 View Submissions
            </Link>
            <Link to={`/assignments/${id}/edit`} className="btn btn-secondary">
              ✏️ Edit
            </Link>
            <button className="btn btn-danger" onClick={handleDelete}>
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      <div className="detail-grid">
        {/* Left: Main content */}
        <div>
          {/* Description */}
          <div className="detail-section">
            <h3>Description</h3>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text)' }}>
              {assignment.description}
            </p>
          </div>

          {/* Attachment */}
          {assignment.attachmentUrl && (
            <div className="detail-section">
              <h3>Attachment</h3>
              <a
                href={assignment.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                📎 {assignment.attachmentName || 'Download File'}
              </a>
            </div>
          )}

          {/* Student: Submission form or result */}
          {!isTeacher && (
            <div className="detail-section">
              <h3>Your Submission</h3>

              {submission ? (
                <SubmissionResult submission={submission} assignment={assignment} />
              ) : isClosed ? (
                <div className="alert alert-warning">
                  ⚠️ This assignment is closed and no longer accepting submissions.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {isOverdue && (
                    <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                      ⚠️ The due date has passed. Your submission will be marked as late.
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Your Answer</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Write your answer here…"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Attach File (optional)</label>
                    <label className="file-upload-area">
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.zip"
                      />
                      {file ? (
                        <span>📎 {file.name}</span>
                      ) : (
                        <span>Click to upload · PDF, DOC, DOCX, JPG, PNG, TXT, ZIP (max 10MB)</span>
                      )}
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting…' : '📤 Submit Assignment'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right: Details sidebar */}
        <div>
          <div className="detail-section">
            <h3>Details</h3>
            <div className="detail-row">
              <span className="label">Subject</span>
              <span className="value">{assignment.subject}</span>
            </div>
            <div className="detail-row">
              <span className="label">Total Marks</span>
              <span className="value">{assignment.totalMarks}</span>
            </div>
            <div className="detail-row">
              <span className="label">Due Date</span>
              <span className="value" style={{ color: isOverdue ? 'var(--danger)' : 'inherit' }}>
                {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Status</span>
              <span className="value">
                {isClosed ? (
                  <span className="badge badge-muted">Closed</span>
                ) : isOverdue ? (
                  <span className="badge badge-danger">Overdue</span>
                ) : (
                  <span className="badge badge-success">Active</span>
                )}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Teacher</span>
              <span className="value">{assignment.teacher?.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Posted</span>
              <span className="value">
                {new Date(assignment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionResult({ submission, assignment }) {
  const statusColors = {
    graded: 'badge-success',
    submitted: 'badge-info',
    late: 'badge-warning',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <span className={`badge ${statusColors[submission.status] || 'badge-muted'}`}>
          {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
        </span>
        <span className="text-muted text-sm">
          Submitted {new Date(submission.submittedAt).toLocaleString()}
        </span>
      </div>

      {submission.content && (
        <div
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.9rem',
            lineHeight: 1.7,
            marginBottom: '1rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {submission.content}
        </div>
      )}

      {submission.fileUrl && (
        <a
          href={submission.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ marginBottom: '1rem' }}
        >
          📎 {submission.fileName || 'View File'}
        </a>
      )}

      {submission.status === 'graded' && (
        <div
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: '10px',
            padding: '1rem',
          }}
        >
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>
            {submission.marks} / {assignment.totalMarks}
            <span style={{ fontSize: '1rem', fontWeight: 500, marginLeft: '0.5rem', color: 'var(--text-muted)' }}>
              ({Math.round((submission.marks / assignment.totalMarks) * 100)}%)
            </span>
          </div>
          {submission.feedback && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              💬 {submission.feedback}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
