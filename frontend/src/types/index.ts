export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'csv' | 'youtube' | 'webpage' | 'url';
  size: number;
  content?: string;
  uploadProgress?: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
  uploadedAt: Date;
  summary?: string;
  keyInsights?: string[];
  sourceUrl?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

export interface Theme {
  name: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
}

export interface UploadState {
  isDragging: boolean;
  uploadProgress: { [key: string]: number };
  errors: { [key: string]: string };
}