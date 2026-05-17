import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function SubmissionsPage() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(null); // submission being graded
  const [gradeForm, setGradeForm] = useState({ marks: '', feedback: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        api.get(`/assignments/${id}`),
        api.get(`/assignments/${id}/submissions`),
      ]);
      setAssignment(aRes.data);
      setSubmissions(sRes.data);
    } catch (err) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const openGrade = (sub) => {
    setGrading(sub);
    setGradeForm({ marks: sub.marks ?? '', feedback: sub.feedback ?? '' });
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    if (gradeForm.marks === '' || gradeForm.marks === null) {
      toast.error('Please enter marks');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/submissions/${grading._id}/grade`, {
        marks: Number(gradeForm.marks),
        feedback: gradeForm.feedback,
      });
      setSubmissions((prev) =>
        prev.map((s) => (s._id === grading._id ? res.data.submission : s))
      );
      setGrading(null);
      toast.success('Submission graded!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Grading failed');
    } finally {
      setSaving(false);
    }
  };

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
            .reduce((sum, s) => sum + (s.marks / assignment.totalMarks) * 100, 0) /
            gradedCount
        )
      : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to={`/assignments/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: '0.5rem' }}>
            ← Back to Assignment
          </Link>
          <h1 className="page-title">Submissions</h1>
          <p className="page-subtitle">{assignment?.title}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon">📥</div>
          <div className="stat-value">{submissions.length}</div>
          <div className="stat-label">Total Submissions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{gradedCount}</div>
          <div className="stat-label">Graded</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{submissions.length - gradedCount}</div>
          <div className="stat-label">Pending</div>
        </div>
        {avgScore !== null && (
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{avgScore}%</div>
            <div className="stat-label">Class Average</div>
          </div>
        )}
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No submissions yet</h3>
          <p>Students haven't submitted this assignment yet.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Marks</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{sub.student?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {sub.student?.email}
                    </div>
                  </td>
                  <td className="text-muted text-sm">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </td>
                  <td>
                    {sub.status === 'graded' && <span className="badge badge-success">Graded</span>}
                    {sub.status === 'submitted' && <span className="badge badge-info">Submitted</span>}
                    {sub.status === 'late' && <span className="badge badge-warning">Late</span>}
                  </td>
                  <td>
                    {sub.status === 'graded' ? (
                      <span style={{ fontWeight: 600 }}>
                        {sub.marks}/{assignment.totalMarks}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {sub.fileUrl ? (
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-sm"
                      >
                        📎 View
                      </a>
                    ) : (
                      <span className="text-muted text-sm">Text only</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openGrade(sub)}
                    >
                      {sub.status === 'graded' ? '✏️ Re-grade' : '🏆 Grade'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grade Modal */}
      {grading && (
        <div className="modal-overlay" onClick={() => setGrading(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Grade Submission</h2>
              <button className="modal-close" onClick={() => setGrading(null)}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 600 }}>{grading.student?.name}</p>
              <p className="text-muted text-sm">{grading.student?.email}</p>
            </div>

            {grading.content && (
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.875rem',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  marginBottom: '1rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {grading.content}
              </div>
            )}

            {grading.fileUrl && (
              <a
                href={grading.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: '1rem', display: 'inline-flex' }}
              >
                📎 {grading.fileName || 'View File'}
              </a>
            )}

            <form onSubmit={handleGrade}>
              <div className="form-group">
                <label className="form-label">
                  Marks (out of {assignment.totalMarks}) *
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={gradeForm.marks}
                  onChange={(e) => setGradeForm({ ...gradeForm, marks: e.target.value })}
                  min={0}
                  max={assignment.totalMarks}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Feedback (optional)</label>
                <textarea
                  className="form-textarea"
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  placeholder="Write feedback for the student…"
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setGrading(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : '✅ Submit Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
