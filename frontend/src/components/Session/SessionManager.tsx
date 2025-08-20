import React, { useState } from "react";
import { User, Trash2, MessageSquare, RefreshCw, Plus } from "lucide-react";

interface SessionManagerProps {
    userId: string;
    onClearChat: () => void;
    onNewSession: () => void;
    onDeleteSession: () => void;
    onRefreshSession: () => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({
    userId,
    onClearChat,
    onNewSession,
    onDeleteSession,
    onRefreshSession,
}) => {
    const shortUserId = userId.slice(0, 8);

    return (
        <div className="session-manager">
            <div className="session-info">
                <div className="session-avatar">
                    <User size={16} />
                </div>
                <div className="session-details">
                    <span className="session-id" title={userId}>
                        Hello User
                    </span>
                    <span className="session-toggle">{shortUserId}...</span>
                </div>
            </div>

            <div className="session-actions">
                <button
                    onClick={onNewSession}
                    className="session-action new-session"
                    title="Start new session"
                >
                    <Plus size={14} />
                    <span className="session-action-label">New Session</span>
                </button>

                <button
                    onClick={onClearChat}
                    className="session-action clear-chat"
                    title="Clear chat history"
                >
                    <MessageSquare size={14} />
                    <span className="session-action-label">Clear Chat</span>
                </button>

                <button
                    onClick={onRefreshSession}
                    className="session-action refresh"
                    title="Refresh session"
                >
                    <RefreshCw size={14} />
                    <span className="session-action-label">Refresh</span>
                </button>

                <button
                    onClick={onDeleteSession}
                    className="session-action delete-session"
                    title="Delete session"
                >
                    <Trash2 size={14} />
                    <span className="session-action-label">Delete Session</span>
                </button>
            </div>
        </div>
    );
};

export default SessionManager;
