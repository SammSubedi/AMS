import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'English', 'History', 'Geography',
  'Economics', 'Art', 'Music', 'Physical Education', 'Other',
];

export default function EditAssignmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    totalMarks: '',
    status: 'active',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/assignments/${id}`)
      .then((res) => {
        const a = res.data;
        setForm({
          title: a.title,
          description: a.description,
          subject: a.subject,
          dueDate: a.dueDate.split('T')[0],
          totalMarks: a.totalMarks,
          status: a.status,
        });
      })
      .catch(() => {
        toast.error('Assignment not found');
        navigate('/assignments');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append('attachment', file);

      await api.put(`/assignments/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Assignment updated!');
      navigate(`/assignments/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
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

  return (
    <div style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <div>
          <Link to={`/assignments/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: '0.5rem' }}>
            ← Back
          </Link>
          <h1 className="page-title">Edit Assignment</h1>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select name="subject" className="form-select" value={form.subject} onChange={handleChange} required>
                <option value="">Select subject…</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Total Marks *</label>
              <input
                type="number"
                name="totalMarks"
                className="form-input"
                value={form.totalMarks}
                onChange={handleChange}
                required
                min={1}
                max={1000}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                name="dueDate"
                className="form-input"
                value={form.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleChange}
              required
              rows={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Replace Attachment (optional)</label>
            <label className="file-upload-area">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.zip"
              />
              {file ? (
                <span>📎 {file.name}</span>
              ) : (
                <span>Upload a new file to replace the existing one</span>
              )}
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Link to={`/assignments/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
