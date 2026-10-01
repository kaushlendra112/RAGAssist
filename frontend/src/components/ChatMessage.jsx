import React, { useState } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import SourceCitations from './SourceCitations';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic formatting for bold and newlines
  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '0.35rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        {isUser ? (
          <>
            <span>You</span>
            <User size={12} style={{ color: 'var(--accent-cyan)' }} />
          </>
        ) : (
          <>
            <Bot size={12} style={{ color: 'var(--accent-purple)' }} />
            <span>RAG Assistant ({message.provider || 'LangGraph'})</span>
          </>
        )}
      </div>

      <div className={`message-bubble ${isUser ? 'message-user' : 'message-assistant'}`}>
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {renderFormattedText(message.text)}
        </div>

        {!isUser && (
          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCopy}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
              title="Copy message"
            >
              {copied ? <Check size={12} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceCitations sources={message.sources} />
        )}
      </div>
    </div>
  );
}
