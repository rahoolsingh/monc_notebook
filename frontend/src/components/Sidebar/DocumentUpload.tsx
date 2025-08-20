import React, { useRef, useState, useCallback } from "react";
import {
    Upload,
    File,
    Link,
    AlertCircle,
    CheckCircle,
    X,
    Trash2,
    FileText,
    Table,
    Play,
    Globe,
} from "lucide-react";
import { Document, UploadState } from "../../types";

interface DocumentUploadProps {
    documents: Document[];
    isUploading: boolean;
    onDocumentUpload: (files: FileList) => void;
    onUrlAdd: (url: string) => void;
    onDocumentRemove: (docId: string) => void;
    onClearDocuments: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
    documents,
    isUploading,
    onDocumentUpload,
    onUrlAdd,
    onDocumentRemove,
    onClearDocuments,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadState, setUploadState] = useState<UploadState>({
        isDragging: false,
        uploadProgress: {},
        errors: {},
    });
    const [urlInput, setUrlInput] = useState("");

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setUploadState((prev) => ({ ...prev, isDragging: true }));
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setUploadState((prev) => ({ ...prev, isDragging: false }));
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setUploadState((prev) => ({ ...prev, isDragging: false }));

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                onDocumentUpload(files);
            }
        },
        [onDocumentUpload]
    );

    const handleFileSelect = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && !isUploading) {
            onDocumentUpload(files);
            // Reset input
            e.target.value = "";
        }
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (urlInput.trim() && !isUploading) {
            onUrlAdd(urlInput.trim());
            setUrlInput("");
        }
    };

    const getFileIcon = (type: Document["type"]) => {
        switch (type) {
            case "pdf":
                return <File className="file-icon" />;
            case "csv":
                return <Table className="file-icon" />;
            case "txt":
            case "md":
                return <FileText className="file-icon" />;
            case "youtube":
                return <Play className="file-icon" />;
            case "webpage":
            case "url":
                return <Globe className="file-icon" />;
            default:
                return <File className="file-icon" />;
        }
    };

    const getStatusIcon = (status: Document["processingStatus"]) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="status-icon success" />;
            case "error":
                return <AlertCircle className="status-icon error" />;
            default:
                return <div className="spinner" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    };

    return (
        <div className="document-upload">
            <div className="upload-section">
                <div className="section-header">
                    <h2 className="section-title">Upload Documents</h2>
                </div>

                <div
                    className={`upload-zone ${
                        uploadState.isDragging ? "dragging" : ""
                    } ${isUploading ? "uploading" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleFileSelect}
                >
                    <Upload className="upload-icon" />
                    <p className="upload-text">
                        {isUploading ? (
                            "Uploading..."
                        ) : (
                            <>
                                Drop files here or{" "}
                                <span className="upload-link">browse</span>
                            </>
                        )}
                    </p>
                    <p className="upload-subtitle">
                        Supports PDF, CSV files (Max 10MB each)
                    </p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.csv,.txt,.md,.docx,.doc"
                    onChange={handleFileChange}
                    className="file-input"
                    disabled={isUploading}
                />
            </div>

            <div className="url-section">
                <h3 className="section-subtitle">Add URL Content</h3>
                <form onSubmit={handleUrlSubmit} className="url-form">
                    <div className="url-input-group">
                        <Link className="url-icon" />
                        <input
                            type="url"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder="URL..."
                            className="url-input"
                            disabled={isUploading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="url-submit"
                        disabled={!urlInput.trim() || isUploading}
                    >
                        {isUploading ? "Processing..." : "Add URL"}
                    </button>
                </form>
                <p className="url-help">
                    Supports YouTube videos and web pages
                </p>
            </div>

            <div className="documents-list">
                <h3 className="list-title">Documents ({documents.length})</h3>
                <div className="documents-container">
                    {documents.length === 0 ? (
                        <div className="empty-state">
                            <File size={32} className="empty-icon" />
                            <p className="empty-text">
                                No documents uploaded yet
                            </p>
                            <p className="empty-subtitle">
                                Upload your first document to get started
                            </p>
                        </div>
                    ) : (
                        documents.map((doc) => (
                            <div key={doc.id} className="document-card">
                                <div className="document-header">
                                    <div className="document-icon">
                                        {getFileIcon(doc.type)}
                                    </div>
                                    <div className="document-info">
                                        <h4
                                            className="document-name"
                                            title={doc.name}
                                        >
                                            {doc.name}
                                        </h4>
                                        <p className="document-meta">
                                            <span
                                                className={`document-type-badge ${doc.type}`}
                                            >
                                                {doc.type.toUpperCase()}
                                            </span>
                                            {doc.size > 0 &&
                                                ` • ${formatFileSize(
                                                    doc.size
                                                )}`}
                                        </p>
                                        {doc.sourceUrl && (
                                            <p
                                                className="document-source"
                                                title={doc.sourceUrl}
                                            >
                                                {doc.sourceUrl.length > 50
                                                    ? doc.sourceUrl.substring(
                                                          0,
                                                          50
                                                      ) + "..."
                                                    : doc.sourceUrl}
                                            </p>
                                        )}
                                    </div>
                                    <div className="document-actions">
                                        <div className="document-status">
                                            {getStatusIcon(
                                                doc.processingStatus
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDocumentRemove(doc.id);
                                            }}
                                            className="remove-doc-btn"
                                            title="Remove document"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>

                                {doc.uploadProgress !== undefined &&
                                    doc.uploadProgress < 100 && (
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${doc.uploadProgress}%`,
                                                }}
                                            />
                                            <span className="progress-text">
                                                {doc.uploadProgress}%
                                            </span>
                                        </div>
                                    )}

                                {doc.summary && (
                                    <div className="document-summary">
                                        <p className="summary-text">
                                            {doc.summary}
                                        </p>
                                    </div>
                                )}

                                {doc.keyInsights &&
                                    doc.keyInsights.length > 0 && (
                                        <div className="key-insights">
                                            <p className="insights-label">
                                                Key Insights:
                                            </p>
                                            <ul className="insights-list">
                                                {doc.keyInsights.map(
                                                    (insight, index) => (
                                                        <li
                                                            key={index}
                                                            className="insight-item"
                                                        >
                                                            {insight}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentUpload;
