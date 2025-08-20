import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DocumentUpload from "../Sidebar/DocumentUpload";
import { Document } from "../../types";

interface SidebarProps {
    documents: Document[];
    isUploading: boolean;
    onDocumentUpload: (files: FileList) => void;
    onUrlAdd: (url: string) => void;
    onDocumentRemove: (docId: string) => void;
    onClearDocuments: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    documents,
    isUploading,
    onDocumentUpload,
    onUrlAdd,
    onDocumentRemove,
    onClearDocuments,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="collapse-button"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? (
                    <ChevronRight className="collapse-icon" />
                ) : (
                    <ChevronLeft className="collapse-icon" />
                )}
            </button>

            <div className="sidebar-content">
                {!isCollapsed && (
                    <DocumentUpload
                        documents={documents}
                        isUploading={isUploading}
                        onDocumentUpload={onDocumentUpload}
                        onUrlAdd={onUrlAdd}
                        onDocumentRemove={onDocumentRemove}
                        onClearDocuments={onClearDocuments}
                    />
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
