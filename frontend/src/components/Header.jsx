import React from 'react';
import { Cpu, FileText, Database, ShieldCheck } from 'lucide-react';

export default function Header({ statusInfo }) {
  const provider = statusInfo?.llm_provider || 'mock';
  const docCount = statusInfo?.total_documents || 0;
  const chunkCount = statusInfo?.total_chunks || 0;

  return (
    <header className="header-bar">
      <div className="header-brand">
        <div className="brand-icon">
          <Cpu size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="brand-title">RAGAssist</h1>
            <span className="brand-badge">LangGraph RAG</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Modular PDF Intelligence & Conversational Context
          </p>
        </div>
      </div>

      <div className="header-meta">
        <div className="status-pill">
          <Database size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>{docCount} Docs ({chunkCount} Chunks)</span>
        </div>

        <div className="status-pill">
          <Cpu size={14} style={{ color: 'var(--accent-purple)' }} />
          <span style={{ textTransform: 'capitalize' }}>Model: {provider}</span>
        </div>

        <div className="status-pill">
          <div className="status-dot"></div>
          <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>API Ready</span>
        </div>
      </div>
    </header>
  );
}
