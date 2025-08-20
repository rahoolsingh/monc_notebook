import { useState, useCallback } from "react";
import { Document } from "../types";

export const useDocuments = () => {
    const [documents, setDocuments] = useState<Document[]>([]);

    const addDocument = useCallback((file: File): Document => {
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

        // Simulate upload progress
        simulateUpload(newDoc.id);

        return newDoc;
    }, []);

    const addUrlDocument = useCallback((url: string) => {
        const newDoc: Document = {
            id: crypto.randomUUID(),
            name: new URL(url).hostname,
            type: "url",
            size: 0,
            uploadProgress: 0,
            processingStatus: "pending",
            uploadedAt: new Date(),
        };

        setDocuments((prev) => [...prev, newDoc]);
        simulateUpload(newDoc.id);
    }, []);

    const handleDocumentUpload = useCallback(
        (files: FileList) => {
            Array.from(files).forEach((file) => {
                addDocument(file);
            });
        },
        [addDocument]
    );

    const simulateUpload = (docId: string) => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 25;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);

                // Update to processing
                setDocuments((prev) =>
                    prev.map((doc) =>
                        doc.id === docId
                            ? {
                                  ...doc,
                                  uploadProgress: 100,
                                  processingStatus: "processing",
                              }
                            : doc
                    )
                );

                // Simulate processing completion
                setTimeout(() => {
                    setDocuments((prev) =>
                        prev.map((doc) =>
                            doc.id === docId
                                ? {
                                      ...doc,
                                      processingStatus: "completed",
                                  }
                                : doc
                        )
                    );
                }, 2000);
            } else {
                setDocuments((prev) =>
                    prev.map((doc) =>
                        doc.id === docId
                            ? { ...doc, uploadProgress: progress }
                            : doc
                    )
                );
            }
        }, 200);
    };

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
            default:
                return "txt";
        }
    };

    return {
        documents,
        handleDocumentUpload,
        addUrlDocument,
    };
};
