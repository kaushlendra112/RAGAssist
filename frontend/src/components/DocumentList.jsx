import React from 'react';
import { FileText, Trash2, Layers, Calendar, CheckSquare, Square } from 'lucide-react';

export default function DocumentList({ documents, selectedDocId, onSelectDoc, onDeleteDoc }) {
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="glass-panel doc-list-card">
      <div className="section-title">
        <span>Indexed Knowledge Base</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {documents.length} File{documents.length === 1 ? '' : 's'}
        </span>
      </div>

      <div style={{ marginBottom: '0.85rem' }}>
        <button
          onClick={() => onSelectDoc(null)}
          style={{
            width: '100%',
            padding: '0.55rem 0.85rem',
            borderRadius: '8px',
            border: `1px solid ${selectedDocId === null ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
            background: selectedDocId === null ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.4)',
            color: selectedDocId === null ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            fontSize: '0.825rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease',
          }}
        >
          <span>Search All Documents</span>
          {selectedDocId === null ? <CheckSquare size={14} /> : <Square size={14} />}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.2rem' }}>
        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <FileText size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            No documents uploaded yet.
            <br />
            Upload a PDF above to get started.
          </div>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDocId === doc.id;
            return (
              <div
                key={doc.id}
                className={`doc-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectDoc(doc.id)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--text-primary)',
                      }}
                      title={doc.filename}
                    >
                      {doc.filename}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="doc-meta-badge">
                      <Layers size={10} style={{ display: 'inline', marginRight: '3px' }} />
                      {doc.chunk_count} Chunks
                    </span>
                    <span className="doc-meta-badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}>
                      {doc.page_count} Pages
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {formatBytes(doc.file_size_bytes)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete document "${doc.filename}"?`)) {
                      onDeleteDoc(doc.id);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.35rem',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Delete Document"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
