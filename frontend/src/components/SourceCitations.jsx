import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, ExternalLink, Percent } from 'lucide-react';

export default function SourceCitations({ sources }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="citations-box">
      <div className="citation-header" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <BookOpen size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>Source Context & Citations ({sources.length})</span>
        </div>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      {isOpen && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sources.map((src, idx) => {
            const scorePercent = src.score ? (src.score * 100).toFixed(0) : null;
            return (
              <div key={idx} className="citation-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    📄 {src.filename} &bull; Page {src.page_number}
                  </span>
                  {scorePercent && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--accent-emerald)',
                        background: 'rgba(16, 185, 129, 0.15)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      {scorePercent}% Match
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    lineHeight: '1.4',
                    background: 'rgba(9, 13, 22, 0.8)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  "{src.content}"
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
