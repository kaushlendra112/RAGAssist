import React, { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DocumentUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setStatusMsg({ type: 'error', text: 'Please select a valid PDF file.' });
      return;
    }

    setIsUploading(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Upload failed');
      }

      setStatusMsg({ type: 'success', text: data.message });
      if (onUploadSuccess) onUploadSuccess(data.document);
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="glass-panel upload-card">
      <div className="section-title">
        <span>Upload PDF Document</span>
        <File size={16} style={{ color: 'var(--accent-cyan)' }} />
      </div>

      <div
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {isUploading ? (
          <div style={{ padding: '0.5rem 0' }}>
            <Loader2 className="upload-icon spin" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>Processing & Chunking PDF...</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Splitting text and building vector embeddings
            </p>
          </div>
        ) : (
          <div>
            <UploadCloud className="upload-icon" />
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>
              Drag & Drop PDF here or <span style={{ color: 'var(--accent-cyan)' }}>browse</span>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Supported: PDF documents up to 50MB
            </p>
          </div>
        )}
      </div>

      {statusMsg && (
        <div
          style={{
            marginTop: '0.85rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: statusMsg.type === 'success' ? '#34d399' : '#f87171',
          }}
        >
          {statusMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
}
