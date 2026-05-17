import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'English', 'History', 'Geography',
  'Economics', 'Art', 'Music', 'Physical Education', 'Other',
];

export default function CreateAssignmentPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: '',
    totalMarks: '',
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.subject) errs.subject = 'Subject is required';
    if (!form.dueDate) errs.dueDate = 'Due date is required';
    if (!form.totalMarks || Number(form.totalMarks) < 1)
      errs.totalMarks = 'Total marks must be at least 1';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append('attachment', file);

      await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Assignment created!');
      navigate('/assignments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  // Min date = today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxWidth: '680px' }}>
      <div className="page-header">
        <div>
          <Link to="/assignments" className="btn btn-ghost btn-sm" style={{ marginBottom: '0.5rem' }}>
            ← Back
          </Link>
          <h1 className="page-title">Create Assignment</h1>
          <p className="page-subtitle">Fill in the details below to post a new assignment.</p>
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
              placeholder="e.g. Chapter 5 Review Questions"
              value={form.title}
              onChange={handleChange}
              maxLength={100}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select
                name="subject"
                className="form-select"
                value={form.subject}
                onChange={handleChange}
              >
                <option value="">Select subject…</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.subject && <span className="form-error">{errors.subject}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Total Marks *</label>
              <input
                type="number"
                name="totalMarks"
                className="form-input"
                placeholder="e.g. 100"
                value={form.totalMarks}
                onChange={handleChange}
                min={1}
                max={1000}
              />
              {errors.totalMarks && <span className="form-error">{errors.totalMarks}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date *</label>
            <input
              type="date"
              name="dueDate"
              className="form-input"
              value={form.dueDate}
              onChange={handleChange}
              min={today}
            />
            {errors.dueDate && <span className="form-error">{errors.dueDate}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Describe the assignment, instructions, requirements…"
              value={form.description}
              onChange={handleChange}
              rows={6}
            />
            {errors.description && <span className="form-error">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Attachment (optional)</label>
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

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Link to="/assignments" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : '✅ Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
