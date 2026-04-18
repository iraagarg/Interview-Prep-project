import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { User, Mail, Briefcase, Award, Save, Lock, Plus, X, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const LabelRow = ({ label, icon: Icon }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
    {Icon && <Icon size={14} color="var(--color-primary)" />}
    {label}
  </label>
);

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    targetRole: user?.targetRole || '',
    experience: user?.experience || 'fresher',
    skills: user?.skills || [],
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setSavingPassword(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPassword(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profileForm.skills.includes(newSkill.trim())) {
      setProfileForm(f => ({ ...f, skills: [...f.skills, newSkill.trim()] }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setProfileForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }));
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <div className="section-header">
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <User size={28} color="var(--color-primary)" /> Profile Settings
        </h1>
        <p className="section-subtitle">Manage your account and preferences</p>
      </div>

      {/* Avatar Section */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'white',
          flexShrink: 0,
        }}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.3rem', marginBottom: '0.25rem' }}>{user?.name}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {user?.totalInterviews > 0 && (
              <span className="badge badge-primary">
                <Award size={11} /> {user.totalInterviews} interviews
              </span>
            )}
            {user?.averageScore > 0 && (
              <span className="badge badge-success">
                Avg {user.averageScore}/100
              </span>
            )}
            <span className="badge badge-secondary">{user?.experience || 'fresher'}</span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleProfileSave}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="var(--color-primary)" /> Personal Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <LabelRow label="Full Name" icon={User} />
              <input
                className="input"
                value={profileForm.name}
                onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>

            <div>
              <LabelRow label="Email Address" icon={Mail} />
              <input className="input" value={user?.email} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>Email cannot be changed</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <LabelRow label="Target Role" icon={Briefcase} />
                <input
                  className="input"
                  value={profileForm.targetRole}
                  onChange={e => setProfileForm(f => ({ ...f, targetRole: e.target.value }))}
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <LabelRow label="Experience Level" />
                <select
                  className="input"
                  value={profileForm.experience}
                  onChange={e => setProfileForm(f => ({ ...f, experience: e.target.value }))}
                >
                  <option value="fresher">Fresher</option>
                  <option value="1-2 years">1-2 Years</option>
                  <option value="3-5 years">3-5 Years</option>
                  <option value="5+ years">5+ Years</option>
                </select>
              </div>
            </div>

            {/* Skills */}
            <div>
              <LabelRow label="Skills" icon={Tag} />
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  className="input"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill (e.g. React, Python)"
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn-primary" onClick={addSkill} style={{ padding: '0.75rem', flexShrink: 0 }}>
                  <Plus size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {profileForm.skills.map(skill => (
                  <span key={skill} className="badge badge-primary" style={{ cursor: 'pointer' }} onClick={() => removeSkill(skill)}>
                    {skill} <X size={11} />
                  </span>
                ))}
                {profileForm.skills.length === 0 && (
                  <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>No skills added yet</span>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={savingProfile} style={{ justifyContent: 'center' }}>
              {savingProfile ? '...' : <><Save size={16} /> Save Profile</>}
            </button>
          </div>
        </div>
      </form>

      {/* Password Form */}
      <form onSubmit={handlePasswordSave}>
        <div className="card">
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={18} color="var(--color-primary)" /> Change Password
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['currentPassword', 'newPassword', 'confirmPassword'].map((field) => (
              <div key={field}>
                <LabelRow label={field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'} icon={Lock} />
                <input
                  type="password"
                  className="input"
                  value={passwordForm[field]}
                  onChange={e => setPasswordForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>
            ))}
            <button type="submit" className="btn-primary" disabled={savingPassword} style={{ justifyContent: 'center' }}>
              {savingPassword ? '...' : <><Lock size={16} /> Change Password</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;
