import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import ChatInterface from './components/Chat/ChatInterface';
import { useDocuments } from './hooks/useDocuments';
import { useChat } from './hooks/useChat';
import './styles/main.css';

function App() {
  const { documents, handleDocumentUpload, addUrlDocument } = useDocuments();
  const { messages, isTyping, sendMessage } = useChat();

  return (
    <ThemeProvider>
      <div className="app">
        <Header />
        
        <main className="main-content">
          <Sidebar
            documents={documents}
            onDocumentUpload={handleDocumentUpload}
            onUrlAdd={addUrlDocument}
          />
          
          <div className="chat-section">
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