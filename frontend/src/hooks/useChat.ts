import { useState, useCallback, useEffect } from 'react';
import { ChatMessage } from '../types';
import { apiService } from '../services/api';

const CHAT_STORAGE_KEY = 'chatHistory';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setMessages(parsedHistory);
      } catch (error) {
        console.error('Error parsing saved chat history:', error);
        initializeChat();
      }
    } else {
      initializeChat();
    }
  }, []);

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      content: 'Hello! I\'m your AI assistant. Upload some documents and I\'ll help you analyze and understand their content. What would you like to know?',
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const loadChatHistory = useCallback((sessionHistory: Array<{role: string, content: string, timestamp: string}>) => {
    if (sessionHistory.length === 0) {
      initializeChat();
      return;
    }

    const chatMessages: ChatMessage[] = sessionHistory.map((msg, index) => ({
      id: `${index + 1}`,
      content: msg.content,
      sender: msg.role === 'user' ? 'user' : 'ai',
      timestamp: new Date(msg.timestamp),
      status: 'sent',
    }));

    setMessages(chatMessages);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Convert messages to API format for context
      const chatHistory = messages.map(msg => ({
        sender: msg.sender,
        content: msg.content
      }));

      const response = await apiService.sendChatMessage(content, chatHistory);
      
      if (response.success && response.data) {
        const aiResponse: ChatMessage = {
          id: crypto.randomUUID(),
          content: response.data.response,
          sender: 'ai',
          timestamp: new Date(),
        };
        
        // Update user message status to sent
        setMessages(prev => [
          ...prev.map(msg => 
            msg.id === userMessage.id 
              ? { ...msg, status: 'sent' as const }
              : msg
          ),
          aiResponse
        ]);
      } else {
        // Handle error
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          content: response.message || 'Sorry, I encountered an error processing your message.',
          sender: 'ai',
          timestamp: new Date(),
        };
        
        setMessages(prev => [
          ...prev.map(msg => 
            msg.id === userMessage.id 
              ? { ...msg, status: 'error' as const }
              : msg
          ),
          errorMessage
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [
        ...prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' as const }
            : msg
        ),
        errorMessage
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  const clearChat = useCallback(async () => {
    try {
      await apiService.clearChatHistory();
      localStorage.removeItem(CHAT_STORAGE_KEY);
      initializeChat();
    } catch (error) {
      console.error('Error clearing chat history:', error);
      // Still clear locally even if server request fails
      localStorage.removeItem(CHAT_STORAGE_KEY);
      initializeChat();
    }
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    loadChatHistory,
    clearChat,
  };
};