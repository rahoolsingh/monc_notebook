export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface UploadResponse {
  filename?: string;
  originalName: string;
  fileId: string;
  url?: string;
  sourceType?: string;
  processedSegments?: number;
}

export interface ChatResponse {
  response: string;
  chatHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
}

export interface UserSession {
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

class ApiService {
  private getUserId(): string {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<UploadResponse>> {
    const userId = this.getUserId();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${API_BASE_URL}/upload`);
      xhr.send(formData);
    });
  }

  async sendChatMessage(message: string, chatHistory: any[] = []): Promise<ApiResponse<ChatResponse>> {
    const userId = this.getUserId();
    
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId,
        chatHistory,
      }),
    });

    return response.json();
  }

  async getUserSession(): Promise<ApiResponse<UserSession>> {
    const userId = this.getUserId();
    
    const response = await fetch(`${API_BASE_URL}/session/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.json();
  }

  getCurrentUserId(): string {
    return this.getUserId();
  }

  async uploadUrl(url: string, type?: string): Promise<ApiResponse<UploadResponse>> {
    const userId = this.getUserId();
    
    const response = await fetch(`${API_BASE_URL}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        url,
        type
      }),
    });

    return response.json();
  }

  async clearChatHistory(): Promise<ApiResponse<any>> {
    const userId = this.getUserId();
    
    const response = await fetch(`${API_BASE_URL}/session/${userId}/chat`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.json();
  }
}

export const apiService = new ApiService();