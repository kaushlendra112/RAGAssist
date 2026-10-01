import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, Filter, Loader2, RefreshCw } from 'lucide-react';
import ChatMessage from './ChatMessage';

export default function ChatWindow({ messages, isLoading, onSendMessage, selectedDoc, onClearChat }) {
  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef(null);

  const samplePrompts = [
    "Summarize the key findings of the document",
    "What are the main topics discussed on page 1?",
    "List the important conclusions and next steps",
    "Extract any tables or structured data mentioned"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handlePromptClick = (promptText) => {
    if (isLoading) return;
    onSendMessage(promptText);
  };

  return (
    <div className="glass-panel chat-container">
      {/* Header bar of Chat Window */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MessageSquare size={18} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontWeight: 600, fontFamily: 'var(--font-heading)' }}>Interactive RAG Session</span>
          {selectedDoc ? (
            <span
              style={{
                fontSize: '0.725rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Filter size={10} />
              Filtering: {selectedDoc.filename}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.725rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--text-secondary)',
              }}
            >
              All Documents Scoped
            </span>
          )}
        </div>

        <button
          onClick={onClearChat}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.3rem 0.6rem',
            borderRadius: '6px',
          }}
          title="Clear Chat History"
        >
          <RefreshCw size={13} />
          <span>Clear Session</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'var(--gradient-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Sparkles size={30} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Ask your PDF Anything
            </h3>
            <p style={{ fontSize: '0.875rem', maxWidth: '440px', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Upload a document on the sidebar and type your prompt. LangGraph will retrieve relevant context chunks and synthesize an accurate answer.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', maxWidth: '600px' }}>
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(p)}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '20px',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                    e.currentTarget.style.color = 'var(--accent-cyan)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  💡 {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => <ChatMessage key={idx} message={msg} />)
        )}

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-cyan)', fontSize: '0.85rem', padding: '0.5rem' }}>
            <Loader2 className="spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>LangGraph executing retrieve & generate nodes...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="chat-input-wrapper">
        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="chat-input"
            placeholder={
              selectedDoc
                ? `Ask about '${selectedDoc.filename}'...`
                : "Ask a question across all uploaded PDF documents..."
            }
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="send-btn" disabled={!inputQuery.trim() || isLoading}>
            <span>Ask</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
