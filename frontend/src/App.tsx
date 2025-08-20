import React, { useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import ChatInterface from './components/Chat/ChatInterface';
import SessionManager from './components/Session/SessionManager';
import { useDocuments } from './hooks/useDocuments';
import { useChat } from './hooks/useChat';
import { useSession } from './hooks/useSession';
import { apiService } from './services/api';
import './styles/main.css';

function App() {
  const { 
    documents, 
    isUploading,
    handleDocumentUpload, 
    addUrlDocument, 
    loadSessionDocuments,
    removeDocument,
    clearDocuments
  } = useDocuments();
  
  const { 
    messages, 
    isTyping, 
    sendMessage, 
    loadChatHistory, 
    clearChat 
  } = useChat();
  
  const { sessionData, isLoading, refreshSession } = useSession();

  // Load session data when available
  useEffect(() => {
    if (sessionData) {
      loadSessionDocuments(sessionData.files);
      loadChatHistory(sessionData.chatHistory);
    }
  }, [sessionData, loadSessionDocuments, loadChatHistory]);

  // Refresh session after document upload
  const handleDocumentUploadWithRefresh = async (files: FileList) => {
    await handleDocumentUpload(files);
    // Refresh session to get updated file list
    setTimeout(() => refreshSession(), 2000);
  };

  const handleNewSession = () => {
    // Clear localStorage and generate new UUID
    localStorage.removeItem('userId');
    localStorage.removeItem('chatHistory');
    clearDocuments();
    clearChat();
    // Reload the page to start fresh
    window.location.reload();
  };

  const handleDeleteSession = async () => {
    if (sessionData && confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:3000/api/session/${sessionData.userId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          handleNewSession();
        }
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const handleClearChat = async () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      await clearChat();
      refreshSession();
    }
  };

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="app">
          <div className="loading-container" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            gap: '20px'
          }}>
            <div className="loading-spinner"></div>
            <div style={{ fontSize: '18px', color: 'var(--color-text)' }}>
              Loading your session...
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="app">
        <Header />
        
        <main className="main-content">
          <Sidebar
            documents={documents}
            isUploading={isUploading}
            onDocumentUpload={handleDocumentUploadWithRefresh}
            onUrlAdd={addUrlDocument}
            onDocumentRemove={removeDocument}
            onClearDocuments={clearDocuments}
          />
          
          <div className="chat-section">
            {sessionData && (
              <SessionManager
                userId={sessionData.userId}
                onClearChat={handleClearChat}
                onNewSession={handleNewSession}
                onDeleteSession={handleDeleteSession}
                onRefreshSession={refreshSession}
              />
            )}
            
            <ChatInterface
              messages={messages}
              onSendMessage={sendMessage}
              isTyping={isTyping}
            />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;