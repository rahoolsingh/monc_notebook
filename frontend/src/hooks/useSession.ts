import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export interface SessionData {
  userId: string;
  files: Array<{
    id: string;
    originalName: string;
    uploadedAt: string;
  }>;
  chatHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

export const useSession = () => {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      const userId = apiService.getCurrentUserId();
      const response = await apiService.getUserSession();
      
      if (response.success && response.data) {
        setSessionData({
          userId,
          files: response.data.files,
          chatHistory: response.data.chatHistory,
        });
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    await initializeSession();
  };

  return {
    sessionData,
    isLoading,
    refreshSession,
  };
};