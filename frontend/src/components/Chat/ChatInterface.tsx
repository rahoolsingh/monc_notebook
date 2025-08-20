import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { ChatMessage } from '../../types';
import MarkdownMessage from './MarkdownMessage';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isTyping,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      setIsExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-expand textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
      setIsExpanded(textarea.scrollHeight > 48);
    }
  };

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Invalid time';
      }
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      return 'Invalid time';
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2 className="chat-title">AI Assistant</h2>
        <p className="chat-subtitle">Ask questions about your documents • Responses formatted with Markdown</p>
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-avatar">
                {message.sender === 'user' ? (
                  <User className="avatar-icon" />
                ) : (
                  <Bot className="avatar-icon" />
                )}
              </div>
              
              <div className="message-content">
                <div className="message-bubble">
                  <MarkdownMessage 
                    content={message.content} 
                    isUser={message.sender === 'user'} 
                  />
                </div>
                <div className="message-meta">
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                  {message.status && (
                    <span className={`message-status ${message.status}`}>
                      {message.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message ai-message typing">
              <div className="message-avatar">
                <Bot className="avatar-icon" />
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className={`input-container ${isExpanded ? 'expanded' : ''}`}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your documents..."
            className="chat-input"
            rows={1}
          />
          
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="send-button"
            aria-label="Send message"
          >
            <Send className="send-icon" />
          </button>
        </div>
        
        <div className="input-hints">
          <p className="hint-text">
            Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to send
          </p>
          <p className="char-count">
            {inputValue.length}/2000
          </p>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;