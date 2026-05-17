import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, assignmentsRes] = await Promise.all([
          api.get('/users/stats'),
          api.get('/assignments'),
        ]);
        setStats(statsRes.data);
        setRecentAssignments(assignmentsRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-muted" style={{ marginTop: '0.25rem' }}>
          {isTeacher
            ? 'Manage your assignments and track student submissions.'
            : 'View your assignments and track your progress.'}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid">
          {isTeacher ? (
            <>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-value">{stats.totalAssignments}</div>
                <div className="stat-label">Total Assignments</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{stats.activeAssignments}</div>
                <div className="stat-label">Active</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📥</div>
                <div className="stat-value">{stats.totalSubmissions}</div>
                <div className="stat-label">Total Submissions</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-value">{stats.pendingSubmissions}</div>
                <div className="stat-label">Pending Grading</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{stats.gradedSubmissions}</div>
                <div className="stat-label">Graded</div>
              </div>
            </>
          ) : (
            <>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-value">{stats.totalAssignments}</div>
                <div className="stat-label">Available</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📤</div>
                <div className="stat-value">{stats.submitted}</div>
                <div className="stat-label">Submitted</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{stats.graded}</div>
                <div className="stat-label">Graded</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{stats.averageScore}%</div>
                <div className="stat-label">Avg Score</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Recent Assignments */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
          {isTeacher ? 'Your Assignments' : 'Recent Assignments'}
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {isTeacher && (
            <Link to="/assignments/new" className="btn btn-primary btn-sm">
              ➕ New Assignment
            </Link>
          )}
          <Link to="/assignments" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>
      </div>

      {recentAssignments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No assignments yet</h3>
            <p>
              {isTeacher
                ? 'Create your first assignment to get started.'
                : 'No assignments have been posted yet.'}
            </p>
            {isTeacher && (
              <Link to="/assignments/new" className="btn btn-primary">
                Create Assignment
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Due Date</th>
                <th>Marks</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentAssignments.map((a) => (
                <AssignmentRow key={a._id} assignment={a} isTeacher={isTeacher} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AssignmentRow({ assignment, isTeacher }) {
  const isOverdue = new Date(assignment.dueDate) < new Date();
  const submissionStatus = assignment.submission?.status;

  const getStatusBadge = () => {
    if (isTeacher) {
      return assignment.status === 'active' ? (
        <span className="badge badge-success">Active</span>
      ) : (
        <span className="badge badge-muted">Closed</span>
      );
    }
    if (submissionStatus === 'graded') return <span className="badge badge-success">Graded</span>;
    if (submissionStatus === 'submitted') return <span className="badge badge-info">Submitted</span>;
    if (submissionStatus === 'late') return <span className="badge badge-warning">Late</span>;
    if (isOverdue) return <span className="badge badge-danger">Overdue</span>;
    return <span className="badge badge-muted">Pending</span>;
  };

  return (
    <tr>
      <td style={{ fontWeight: 500 }}>{assignment.title}</td>
      <td className="text-muted">{assignment.subject}</td>
      <td className="text-muted">
        {new Date(assignment.dueDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </td>
      <td>{assignment.totalMarks}</td>
      <td>{getStatusBadge()}</td>
      <td>
        <Link to={`/assignments/${assignment._id}`} className="btn btn-ghost btn-sm">
          View →
        </Link>
      </td>
    </tr>
  );
}
