import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment and all its submissions?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
      toast.success('Assignment deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = assignments.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.subject.toLowerCase().includes(search.toLowerCase());

    if (filter === 'all') return matchSearch;
    if (filter === 'active') return matchSearch && a.status === 'active';
    if (filter === 'closed') return matchSearch && a.status === 'closed';
    if (filter === 'submitted') return matchSearch && a.submission;
    if (filter === 'pending') return matchSearch && !a.submission;
    return matchSearch;
  });

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assignments</h1>
          <p className="page-subtitle">
            {isTeacher
              ? `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''} created`
              : `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''} available`}
          </p>
        </div>
        {isTeacher && (
          <Link to="/assignments/new" className="btn btn-primary">
            ➕ New Assignment
          </Link>
        )}
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Search by title or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '280px' }}
        />
        <select
          className="form-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ maxWidth: '160px' }}
        >
          <option value="all">All</option>
          {isTeacher ? (
            <>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </>
          ) : (
            <>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
            </>
          )}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No assignments found</h3>
          <p>
            {search
              ? 'Try a different search term.'
              : isTeacher
              ? 'Create your first assignment.'
              : 'No assignments have been posted yet.'}
          </p>
          {isTeacher && !search && (
            <Link to="/assignments/new" className="btn btn-primary">
              Create Assignment
            </Link>
          )}
        </div>
      ) : (
        <div className="assignments-grid">
          {filtered.map((a) => (
            <AssignmentCard
              key={a._id}
              assignment={a}
              isTeacher={isTeacher}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({ assignment, isTeacher, onDelete }) {
  const isOverdue = new Date(assignment.dueDate) < new Date();
  const sub = assignment.submission;

  const getStatusBadge = () => {
    if (isTeacher) {
      return assignment.status === 'active' ? (
        <span className="badge badge-success">Active</span>
      ) : (
        <span className="badge badge-muted">Closed</span>
      );
    }
    if (sub?.status === 'graded') return <span className="badge badge-success">Graded</span>;
    if (sub?.status === 'submitted') return <span className="badge badge-info">Submitted</span>;
    if (sub?.status === 'late') return <span className="badge badge-warning">Late</span>;
    if (isOverdue) return <span className="badge badge-danger">Overdue</span>;
    return <span className="badge badge-muted">Pending</span>;
  };

  return (
    <div className="assignment-card">
      <div className="assignment-card-header">
        <div>
          <div className="assignment-title">{assignment.title}</div>
          <div className="assignment-subject">📚 {assignment.subject}</div>
        </div>
        {getStatusBadge()}
      </div>

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
        {assignment.description}
      </p>

      <div className="assignment-meta">
        <span>
          📅{' '}
          {new Date(assignment.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
        <span>🏆 {assignment.totalMarks} marks</span>
        {isTeacher && (
          <span>👤 {assignment.teacher?.name}</span>
        )}
      </div>

      {/* Student: show marks if graded */}
      {!isTeacher && sub?.status === 'graded' && (
        <div
          style={{
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            color: '#4ade80',
          }}
        >
          Score: {sub.marks} / {assignment.totalMarks} (
          {Math.round((sub.marks / assignment.totalMarks) * 100)}%)
        </div>
      )}

      <div className="assignment-card-footer">
        <Link to={`/assignments/${assignment._id}`} className="btn btn-primary btn-sm">
          View Details
        </Link>
        {isTeacher && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to={`/assignments/${assignment._id}/submissions`}
              className="btn btn-secondary btn-sm"
            >
              📥 Submissions
            </Link>
            <Link
              to={`/assignments/${assignment._id}/edit`}
              className="btn btn-ghost btn-sm"
            >
              ✏️
            </Link>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onDelete(assignment._id)}
              style={{ color: 'var(--danger)' }}
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
