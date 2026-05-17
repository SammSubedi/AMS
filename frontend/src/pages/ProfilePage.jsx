import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleNameSave = async (e) => {
    e.preventDefault();
    if (!nameForm.name.trim()) return;
    setSavingName(true);
    try {
      const res = await api.put('/users/profile', { name: nameForm.name });
      // Update user in context by re-fetching
      const token = localStorage.getItem('ams_token');
      login(token, res.data.user);
      toast.success('Name updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingName(false);
    }
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    setPwError('');

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,12}$/;
    if (!passwordRegex.test(pwForm.newPassword)) {
      setPwError('Password must be 6–12 characters with uppercase, lowercase, and a number');
      return;
    }

    setSavingPw(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed!');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      {/* Avatar & Info */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</div>
            <span
              className={`badge ${user?.role === 'teacher' ? 'badge-primary' : 'badge-info'}`}
              style={{ marginTop: '0.375rem' }}
            >
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Update Name */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Update Name
        </h3>
        <form onSubmit={handleNameSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={nameForm.name}
              onChange={(e) => setNameForm({ name: e.target.value })}
              minLength={2}
              maxLength={50}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingName}>
            {savingName ? 'Saving…' : '💾 Save Name'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Change Password
        </h3>

        {pwError && (
          <div className="alert alert-danger">
            <span>⚠️</span> {pwError}
          </div>
        )}

        <form onSubmit={handlePwSave}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="6–12 chars, upper, lower, number"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={savingPw}>
            {savingPw ? 'Changing…' : '🔒 Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
