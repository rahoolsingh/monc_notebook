import { useState, useCallback } from "react";
import { Document } from "../types";
import { apiService } from "../services/api";

export const useDocuments = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const addDocument = useCallback(async (file: File): Promise<Document> => {
        const newDoc: Document = {
            id: crypto.randomUUID(),
            name: file.name,
            type: getFileType(file.name),
            size: file.size,
            uploadProgress: 0,
            processingStatus: "pending",
            uploadedAt: new Date(),
        };

        setDocuments((prev) => [...prev, newDoc]);
        setIsUploading(true);

        try {
            // Real upload with progress tracking
            const response = await apiService.uploadFile(file, (progress) => {
                setDocuments((prev) =>
                    prev.map((doc) =>
                        doc.id === newDoc.id
                            ? { ...doc, uploadProgress: progress }
                            : doc
                    )
                );
            });

            if (response.success) {
                // Update document with server response
                setDocuments((prev) =>
                    prev.map((doc) =>
                        doc.id === newDoc.id
                            ? {
                                  ...doc,
                                  id: response.data?.fileId || doc.id,
                                  uploadProgress: 100,
                                  processingStatus: "processing",
                              }
                            : doc
                    )
                );

                // Simulate processing time
                setTimeout(() => {
                    setDocuments((prev) =>
                        prev.map((doc) =>
                            doc.id === newDoc.id ||
                            doc.id === response.data?.fileId
                                ? {
                                      ...doc,
                                      processingStatus: "completed",
                                  }
                                : doc
                        )
                    );
                }, 2000);
            } else {
                // Handle upload error
                setDocuments((prev) =>
                    prev.map((doc) =>
                        doc.id === newDoc.id
                            ? {
                                  ...doc,
                                  processingStatus: "error",
                              }
                            : doc
                    )
                );
            }
        } catch (error) {
            console.error("Upload error:", error);
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.id === newDoc.id
                        ? {
                              ...doc,
                              processingStatus: "error",
                          }
                        : doc
                )
            );
        } finally {
            setIsUploading(false);
        }

        return newDoc;
    }, []);

    const removeDocument = useCallback((docId: string) => {
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    }, []);

    const addUrlDocument = useCallback(async (url: string) => {
        // Determine document type based on URL
        let docType: Document['type'] = 'webpage';
        let docName = url;
        
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            docType = 'youtube';
            docName = `YouTube: ${url}`;
        } else {
            try {
                docName = `Web: ${new URL(url).hostname}`;
            } catch {
                docName = `Web: ${url}`;
            }
        }

        const newDoc: Document = {
            id: crypto.randomUUID(),
            name: docName,
            type: docType,
            size: 0,
            uploadProgress: 0,
            processingStatus: "pending",
            uploadedAt: new Date(),
            sourceUrl: url,
        };

        setDocuments((prev) => [...prev, newDoc]);
        setIsUploading(true);

        try {
            // Start progress simulation
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress < 90) {
                    setDocuments((prev) =>
                        prev.map((doc) =>
                            doc.id === newDoc.id
                                ? { ...doc, uploadProgress: Math.min(progress, 90) }
                                : doc
                        )
                    );
                }
            }, 500);

            // Upload URL to backend
            const response = await apiService.uploadUrl(url, docType);
            
            clearInterval(progressInterval);
            
            if (response.success) {
                setDocuments((prev) =>
                    prev.map((doc) =>
                        doc.id === newDoc.id
                            ? {
                                  ...doc,
                                  id: response.data?.fileId || doc.id,
                                  name: response.data?.originalName || doc.name,
                                  uploadProgress: 100,
                                  processingStatus: "completed",
                              }
                            : doc
                    )
                );
            } else {
                setDocuments((prev) =>
                    prev.map((doc) =>
                        doc.id === newDoc.id
                            ? {
                                  ...doc,
                                  processingStatus: "error",
                              }
                            : doc
                    )
                );
            }
        } catch (error) {
            console.error("URL upload error:", error);
            setDocuments((prev) =>
                prev.map((doc) =>
                    doc.id === newDoc.id
                        ? {
                              ...doc,
                              processingStatus: "error",
                          }
                        : doc
                )
            );
        } finally {
            setIsUploading(false);
        }
    }, []);

    const handleDocumentUpload = useCallback(
        async (files: FileList) => {
            const fileArray = Array.from(files);

            // Process files sequentially to avoid overwhelming the server
            for (const file of fileArray) {
                await addDocument(file);
            }
        },
        [addDocument]
    );

    const loadSessionDocuments = useCallback(
        (
            sessionFiles: Array<{
                id: string;
                originalName: string;
                uploadedAt: string;
            }>
        ) => {
            const sessionDocs: Document[] = sessionFiles.map((file) => ({
                id: file.id,
                name: file.originalName,
                type: getFileType(file.originalName),
                size: 0,
                uploadProgress: 100,
                processingStatus: "completed",
                uploadedAt: new Date(file.uploadedAt),
            }));

            setDocuments(sessionDocs);
        },
        []
    );

    const clearDocuments = useCallback(() => {
        setDocuments([]);
    }, []);

    const getFileType = (filename: string): Document["type"] => {
        const extension = filename.split(".").pop()?.toLowerCase();
        switch (extension) {
            case "pdf":
                return "pdf";
            case "docx":
            case "doc":
                return "docx";
            case "txt":
                return "txt";
            case "md":
                return "md";
            case "csv":
                return "csv";
            case "url":
                // Check if it's a YouTube URL or webpage
                if (filename.includes('youtube')) {
                    return "youtube";
                }
                return "webpage";
            default:
                return "txt";
        }
    };

    return {
        documents,
        isUploading,
        handleDocumentUpload,
        addUrlDocument,
        loadSessionDocuments,
        removeDocument,
        clearDocuments,
    };
};
