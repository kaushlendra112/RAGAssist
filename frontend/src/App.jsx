import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import ChatWindow from './components/ChatWindow';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [statusInfo, setStatusInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial documents and status info
  const fetchStatusAndDocs = async () => {
    try {
      const [statusRes, docsRes] = await Promise.all([
        fetch('/'),
        fetch('/api/documents'),
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setStatusInfo(sData);
      }

      if (docsRes.ok) {
        const dData = await docsRes.json();
        setDocuments(dData.documents || []);
      }
    } catch (err) {
      console.warn('Backend server not connected yet or loading mock:', err);
    }
  };

  useEffect(() => {
    fetchStatusAndDocs();
  }, []);

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
    fetchStatusAndDocs();
  };

  const handleDeleteDoc = async (docId) => {
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        if (selectedDocId === docId) setSelectedDocId(null);
        fetchStatusAndDocs();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleSendMessage = async (queryText) => {
    const userMessage = { role: 'user', text: queryText };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          doc_id: selectedDocId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Chat query failed');
      }

      const assistantMessage = {
        role: 'assistant',
        text: data.answer,
        sources: data.sources,
        provider: data.llm_provider,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        text: `❌ Error executing RAG query: ${err.message}`,
        sources: [],
        provider: 'system-error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || null;

  return (
    <div className="app-container">
      <Header statusInfo={statusInfo} />

      <main className="main-layout">
        <aside className="sidebar">
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          <DocumentList
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDoc={setSelectedDocId}
            onDeleteDoc={handleDeleteDoc}
          />
        </aside>

        <section style={{ height: '100%', minHeight: 0 }}>
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            selectedDoc={selectedDoc}
            onClearChat={() => setMessages([])}
          />
        </section>
      </main>
    </div>
  );
}
