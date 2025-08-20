import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. Upload some documents and I\'ll help you analyze and understand their content. What would you like to know?',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: crypto.randomUUID(),
        content: generateAIResponse(content),
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  }, []);

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "I'd be happy to help you with that. Based on your uploaded documents, I can provide detailed analysis and insights.",
      "That's an interesting question! Let me analyze the relevant sections from your documents to give you a comprehensive answer.",
      "I can see you're looking for specific information. From what I've processed in your documents, here's what I found...",
      "Great question! The documents you've uploaded contain several relevant points about this topic. Let me break it down for you.",
      "I understand you want to know more about this. Based on the content analysis, I can provide you with detailed insights and key findings."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return {
    messages,
    isTyping,
    sendMessage,
  };
};