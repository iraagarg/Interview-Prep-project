import { useState, useRef } from 'react';
import api from '../utils/api';
import ResumeAnalysis from '../components/ResumeAnalysis';
import LoadingSpinner from '../components/LoadingSpinner';
import { useEffect } from 'react';
import { Upload, FileText, Trash2, RefreshCw, CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';

const ResumeUpload = () => {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const fetchResume = async () => {
    try {
      const res = await api.get('/resume');
      setResume(res.data.resume);
    } catch {
      setResume(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResume(); }, []);

  const uploadFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      return toast.error('Only PDF files are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('File size must be under 5MB');
    }

    const formData = new FormData();
    formData.append('resume', file);

    setUploading(true);
    try {
      const res = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResume(res.data.resume);
      toast.success('Resume uploaded and analyzed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleReanalyze = async () => {
    if (!resume?._id) return;
    setAnalyzing(true);
    try {
      const res = await api.post(`/resume/${resume._id}/analyze`);
      setResume(res.data.resume);
      toast.success('Resume re-analyzed!');
    } catch {
      toast.error('Re-analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await api.delete(`/resume/${resume._id}`);
      setResume(null);
      toast.success('Resume deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner message="Loading resume..." />;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <div className="section-header">
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} color="var(--color-primary)" /> Resume Analysis
        </h1>
        <p className="section-subtitle">
          Upload your resume to get AI-powered insights and personalized interview prep
        </p>
      </div>

      {/* Upload Zone */}
      {!resume && (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 20,
            padding: '4rem 2rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(108,99,255,0.05)' : 'var(--color-card)',
            transition: 'all 0.3s ease',
            marginBottom: '1.5rem',
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 48, height: 48, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Analyzing your resume with AI...</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>This might take a moment</div>
            </div>
          ) : (
            <>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,212,255,0.1))',
                border: '1px solid rgba(108,99,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}>
                <CloudUpload size={32} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Drop your resume here
              </h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                or click to browse · PDF only · Max 5MB
              </p>
              <div className="btn-primary" style={{ display: 'inline-flex' }}>
                <Upload size={16} /> Select PDF File
              </div>
            </>
          )}
        </div>
      )}

      {/* Resume Actions */}
      {resume && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>
            Analysis Results
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn-secondary"
              onClick={() => fileRef.current?.click()}
              style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
            >
              <Upload size={14} /> Replace
            </button>
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            <button
              className="btn-secondary"
              onClick={handleReanalyze}
              disabled={analyzing}
              style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
            >
              <RefreshCw size={14} style={{ animation: analyzing ? 'spin 1s linear infinite' : 'none' }} />
              Re-analyze
            </button>
            <button className="btn-danger" onClick={handleDelete} style={{ fontSize: '0.85rem' }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}

      {resume && <ResumeAnalysis resume={resume} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ResumeUpload;
