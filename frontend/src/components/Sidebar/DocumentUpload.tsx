import React, { useRef, useState, useCallback } from 'react';
import { Upload, File, Link, AlertCircle, CheckCircle } from 'lucide-react';
import { Document, UploadState } from '../../types';

interface DocumentUploadProps {
  documents: Document[];
  onDocumentUpload: (files: FileList) => void;
  onUrlAdd: (url: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  onDocumentUpload,
  onUrlAdd,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isDragging: false,
    uploadProgress: {},
    errors: {},
  });
  const [urlInput, setUrlInput] = useState('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragging: false }));
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onDocumentUpload(files);
    }
  }, [onDocumentUpload]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      onDocumentUpload(files);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onUrlAdd(urlInput.trim());
      setUrlInput('');
    }
  };

  const getFileIcon = (type: Document['type']) => {
    return <File className="file-icon" />;
  };

  const getStatusIcon = (status: Document['processingStatus']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="status-icon success" />;
      case 'error':
        return <AlertCircle className="status-icon error" />;
      default:
        return <div className="spinner" />;
    }
  };

  return (
    <div className="document-upload">
      <div className="upload-section">
        <h2 className="section-title">Upload Documents</h2>
        
        <div
          className={`upload-zone ${uploadState.isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileSelect}
        >
          <Upload className="upload-icon" />
          <p className="upload-text">
            Drop files here or <span className="upload-link">browse</span>
          </p>
          <p className="upload-subtitle">
            Supports PDF, DOCX, TXT, MD files
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileChange}
          className="file-input"
        />
      </div>

      <div className="url-section">
        <form onSubmit={handleUrlSubmit} className="url-form">
          <div className="url-input-group">
            <Link className="url-icon" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Add URL to analyze..."
              className="url-input"
            />
          </div>
          <button type="submit" className="url-submit" disabled={!urlInput.trim()}>
            Add
          </button>
        </form>
      </div>

      <div className="documents-list">
        <h3 className="list-title">Documents ({documents.length})</h3>
        <div className="documents-container">
          {documents.map((doc) => (
            <div key={doc.id} className="document-card">
              <div className="document-header">
                <div className="document-icon">
                  {getFileIcon(doc.type)}
                </div>
                <div className="document-info">
                  <h4 className="document-name">{doc.name}</h4>
                  <p className="document-meta">
                    {doc.type.toUpperCase()} • {(doc.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="document-status">
                  {getStatusIcon(doc.processingStatus)}
                </div>
              </div>
              
              {doc.uploadProgress !== undefined && doc.uploadProgress < 100 && (
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${doc.uploadProgress}%` }}
                  />
                </div>
              )}
              
              {doc.summary && (
                <div className="document-summary">
                  <p className="summary-text">{doc.summary}</p>
                </div>
              )}
              
              {doc.keyInsights && doc.keyInsights.length > 0 && (
                <div className="key-insights">
                  <p className="insights-label">Key Insights:</p>
                  <ul className="insights-list">
                    {doc.keyInsights.map((insight, index) => (
                      <li key={index} className="insight-item">{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;