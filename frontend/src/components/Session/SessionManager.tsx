import React, { useState } from 'react';
import { User, Trash2, MessageSquare, RefreshCw, Plus } from 'lucide-react';

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
  const [showActions, setShowActions] = useState(false);

  const shortUserId = userId.slice(0, 8);

  return (
    <div className="session-manager">
      <div className="session-info">
        <div className="session-avatar">
          <User size={16} />
        </div>
        <div className="session-details">
          <span className="session-id" title={userId}>
            Session: {shortUserId}...
          </span>
          <button
            onClick={() => setShowActions(!showActions)}
            className="session-toggle"
          >
            Manage
          </button>
        </div>
      </div>

      {showActions && (
        <div className="session-actions">
          <button
            onClick={onNewSession}
            className="session-action new-session"
            title="Start new session"
          >
            <Plus size={14} />
            New Session
          </button>
          
          <button
            onClick={onClearChat}
            className="session-action clear-chat"
            title="Clear chat history"
          >
            <MessageSquare size={14} />
            Clear Chat
          </button>
          
          <button
            onClick={onRefreshSession}
            className="session-action refresh"
            title="Refresh session"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          
          <button
            onClick={onDeleteSession}
            className="session-action delete-session"
            title="Delete session"
          >
            <Trash2 size={14} />
            Delete Session
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionManager;