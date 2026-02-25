import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchGroup, leaveGroup as leaveGroupAction, deleteGroupAction } from "../features/groups/groupSlice";
import {
  fetchMessages,
  sendMessage as sendMessageAction,
  setCurrentGroup,
  addMessage,
  updateMessage,
  removeMessage
} from "../features/chat/chatSlice";
import { getSocket, joinGroup, leaveGroup as leaveGroupSocket } from "../socket/socket";
import { uploadFile, getFiles, downloadFile, deleteFile as deleteFileService } from "../services/fileService";
import ProtectedRoute from "../components/ProtectedRoute";
import { 
  MessageCircle, 
  FolderOpen, 
  Users as UsersIcon, 
  Send, 
  Upload, 
  Download, 
  Trash2, 
  LogOut,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Crown,
  Shield
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import { confirmAction, notifyError, notifySuccess } from "../utils/toast";

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("chat");
  const [messageInput, setMessageInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { currentGroup, isLoading: groupLoading, error: groupError } = useSelector((state) => state.groups);
  const { messages, isLoading } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  const [groupFiles, setGroupFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await getFiles(groupId);
      setGroupFiles(response.data.files);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    dispatch(setCurrentGroup(groupId));
    dispatch(fetchGroup(groupId));
    dispatch(fetchMessages({ groupId, page: 1, limit: 50 }));
    loadFiles();

    const socket = getSocket();
    if (socket) {
      joinGroup(groupId);

      const handleNewMessage = (data) => {
        dispatch(addMessage({ groupId, message: data.message }));
        scrollToBottom();
      };

      const handleMessageEdited = (data) => {
        dispatch(updateMessage({ groupId, message: data.message }));
      };

      const handleMessageDeleted = (data) => {
        dispatch(removeMessage({ groupId, messageId: data.messageId }));
      };

      const handleFileUploaded = (data) => {
        setGroupFiles(prev => [data.file, ...prev]);
        dispatch(addMessage({ groupId, message: data.message }));
      };

      const handleFileDeleted = (data) => {
        setGroupFiles(prev => prev.filter(f => f._id !== data.fileId));
      };

      socket.on("new-message", handleNewMessage);
      socket.on("message-edited", handleMessageEdited);
      socket.on("message-deleted", handleMessageDeleted);
      socket.on("file-uploaded", handleFileUploaded);
      socket.on("file-deleted", handleFileDeleted);

      return () => {
        leaveGroupSocket(groupId);
        socket.off("new-message", handleNewMessage);
        socket.off("message-edited", handleMessageEdited);
        socket.off("message-deleted", handleMessageDeleted);
        socket.off("file-uploaded", handleFileUploaded);
        socket.off("file-deleted", handleFileDeleted);
      };
    }
  }, [groupId, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages[groupId]]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const result = await dispatch(sendMessageAction({ groupId, content: messageInput.trim() }));
    if (sendMessageAction.fulfilled.match(result)) {
      setMessageInput("");
      scrollToBottom();
    }
  };

  const handleFileUpload = async () => {
    if (!fileInput) return;

    setUploading(true);
    try {
      await uploadFile(groupId, fileInput);
      setFileInput(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      loadFiles();
      notifySuccess("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      notifyError("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const blob = await downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      notifyError("Failed to download file");
    }
  };

  const handleDeleteFile = async (fileId) => {
    const confirmed = await confirmAction("Are you sure you want to delete this file?", {
      confirmText: "Delete",
    });
    if (!confirmed) return;

    try {
      await deleteFileService(fileId);
      loadFiles();
      notifySuccess("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      notifyError("Failed to delete file");
    }
  };

  const handleLeaveGroup = async () => {
    const confirmed = await confirmAction("Are you sure you want to leave this group?", {
      confirmText: "Leave group",
    });
    if (!confirmed) return;

    const result = await dispatch(leaveGroupAction(groupId));
    if (leaveGroupAction.fulfilled.match(result)) {
      notifySuccess("You left the group");
      navigate("/groups");
    } else {
      notifyError(result.payload || "Failed to leave group");
    }
  };

  const handleDeleteGroup = async () => {
    const confirmed = await confirmAction(
      "Are you sure you want to delete this group? This action cannot be undone.",
      { confirmText: "Delete group" }
    );
    if (!confirmed) return;

    const result = await dispatch(deleteGroupAction(groupId));
    if (deleteGroupAction.fulfilled.match(result)) {
      notifySuccess("Group deleted successfully");
      navigate("/groups");
    } else {
      notifyError(result.payload || "Failed to delete group");
    }
  };

  const isAdmin = currentGroup && (
    currentGroup.creator?._id === user?._id ||
    currentGroup.creator === user?._id ||
    currentGroup.admins?.some(a => a._id === user?._id || a === user?._id)
  );

  const groupMessages = messages[groupId] || [];

  return (
    <ProtectedRoute>
      <div className="group-detail-container">
        {groupLoading ? (
          <LoadingSpinner text="Loading group details..." />
        ) : groupError ? (
          <div className="fade-in">
            <ErrorMessage message={`Error loading group: ${groupError}`} />
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate("/groups")}
              >
                <ArrowLeft size={18} />
                Back to Groups
              </button>
            </div>
          </div>
        ) : currentGroup ? (
          <>
            <div className="group-detail-header fade-in">
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-sm)'
                }}>
                  <h1 style={{ margin: 0 }}>{currentGroup.name}</h1>
                  {currentGroup.subject && (
                    <span className="badge badge-primary">
                      <BookOpen size={12} />
                      {currentGroup.subject}
                    </span>
                  )}
                </div>
                {currentGroup.description && (
                  <p style={{ 
                    color: 'var(--color-text-secondary)', 
                    marginBottom: 'var(--spacing-md)',
                    fontSize: 'var(--font-size-base)'
                  }}>
                    {currentGroup.description}
                  </p>
                )}
                <div className="group-info">
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-xs)' 
                  }}>
                    <UsersIcon size={16} />
                    {currentGroup.members?.length || 0} members
                  </span>
                  {currentGroup.courseCode && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-xs)' 
                    }}>
                      <BookOpen size={16} />
                      {currentGroup.courseCode}
                    </span>
                  )}
                </div>
              </div>
              <div className="group-actions-header">
                {isAdmin && (
                  <button 
                    className="btn btn-danger" 
                    onClick={handleDeleteGroup}
                  >
                    <Trash2 size={18} />
                    Delete Group
                  </button>
                )}
                <button 
                  className="btn btn-secondary" 
                  onClick={handleLeaveGroup}
                >
                  <LogOut size={18} />
                  Leave Group
                </button>
              </div>
            </div>

            <div className="group-tabs fade-in" style={{ animationDelay: '100ms' }}>
              <button
                className={activeTab === "chat" ? "active" : ""}
                onClick={() => setActiveTab("chat")}
              >
                <MessageCircle size={18} />
                Chat
              </button>
              <button
                className={activeTab === "files" ? "active" : ""}
                onClick={() => setActiveTab("files")}
              >
                <FolderOpen size={18} />
                Files
              </button>
              <button
                className={activeTab === "members" ? "active" : ""}
                onClick={() => setActiveTab("members")}
              >
                <UsersIcon size={18} />
                Members ({currentGroup.members?.length || 0})
              </button>
            </div>

            {activeTab === "chat" && (
              <div className="chat-container fade-in" style={{ animationDelay: '200ms' }}>
                <div className="messages-container">
                  {isLoading && groupMessages.length === 0 ? (
                    <LoadingSpinner text="Loading messages..." size="sm" />
                  ) : groupMessages.length === 0 ? (
                    <EmptyState
                      icon="💬"
                      title="No messages yet"
                      description="Start the conversation and collaborate with your peers!"
                    />
                  ) : (
                    groupMessages.map((message, index) => (
                      <div
                        key={message._id}
                        className={`message ${message.sender?._id === user?._id || message.sender === user?._id ? "own" : ""} ${message.type === "system" ? "system" : ""} fade-in`}
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        {message.type !== "system" && (
                          <div className="message-avatar">
                            {message.sender?.profilePicture ? (
                              <img src={message.sender.profilePicture} alt={message.sender.name} />
                            ) : (
                              <div className="avatar-placeholder">
                                {message.sender?.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="message-content">
                          {message.type !== "system" && (
                            <div className="message-header">
                              <span className="message-sender">{message.sender?.name}</span>
                              <span className="message-time">
                                {new Date(message.createdAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          )}
                          {message.type === "file" && message.file ? (
                            <div className="file-message">
                              <span>📎 {message.file.fileName}</span>
                              <span className="file-size">
                                {(message.file.fileSize / 1024).toFixed(2)} KB
                              </span>
                            </div>
                          ) : (
                            <p>{message.content}</p>
                          )}
                          {message.edited && (
                            <span className="edited-badge">(edited)</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="message-input-form">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    className="message-input"
                    autoComplete="off"
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={!messageInput.trim()}
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            )}

            {activeTab === "files" && (
              <div className="files-container card fade-in" style={{ animationDelay: '200ms' }}>
                <div className="file-upload-section">
                  <label 
                    htmlFor="file-upload"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 'var(--spacing-2xl)',
                      border: '2px dashed var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-base)',
                      background: 'var(--color-bg-secondary)'
                    }}
                    className="file-drop-zone"
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary-500)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
                  >
                    <Upload size={32} style={{ color: 'var(--color-primary-500)', marginBottom: 'var(--spacing-md)' }} />
                    <span style={{ 
                      fontSize: 'var(--font-size-base)', 
                      fontWeight: 'var(--font-weight-medium)',
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      Click to upload or drag and drop
                    </span>
                    <span style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--color-text-tertiary)' 
                    }}>
                      PDF, DOC, PPT, Images (max 10MB)
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setFileInput(e.target.files[0])}
                    className="file-input"
                    style={{ display: 'none' }}
                  />
                  {fileInput && (
                    <div className="file-preview fade-in" style={{ marginTop: 'var(--spacing-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <FolderOpen size={20} style={{ color: 'var(--color-primary-600)' }} />
                        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{fileInput.name}</span>
                      </div>
                      <button 
                        onClick={handleFileUpload} 
                        disabled={uploading} 
                        className={`btn btn-primary btn-sm ${uploading ? 'loading' : ''}`}
                      >
                        {!uploading && <Upload size={16} />}
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  )}
                </div>

                {loadingFiles ? (
                  <LoadingSpinner text="Loading files..." size="sm" />
                ) : groupFiles.length === 0 ? (
                  <EmptyState
                    icon="📁"
                    title="No files yet"
                    description="Upload study materials, notes, and resources to share with the group"
                  />
                ) : (
                  <div className="files-list">
                    {groupFiles.map((file, index) => (
                      <div 
                        key={file._id} 
                        className="file-item slide-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="file-info">
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-lg)',
                            background: 'var(--color-primary-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--font-size-2xl)',
                            flexShrink: 0
                          }}>
                            📄
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="file-name">{file.originalName}</div>
                            <div className="file-meta">
                              <span>Uploaded by {file.uploadedBy?.name}</span>
                              <span>•</span>
                              <span>{(file.size / 1024).toFixed(2)} KB</span>
                              <span>•</span>
                              <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="file-actions">
                          <button
                            onClick={() => handleDownloadFile(file._id, file.originalName)}
                            className="btn btn-secondary btn-sm"
                            aria-label={`Download ${file.originalName}`}
                          >
                            <Download size={16} />
                            Download
                          </button>
                          {(file.uploadedBy?._id === user?._id || file.uploadedBy === user?._id || isAdmin) && (
                            <button
                              onClick={() => handleDeleteFile(file._id)}
                              className="btn btn-danger btn-sm"
                              aria-label={`Delete ${file.originalName}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "members" && (
              <div className="members-container card fade-in" style={{ animationDelay: '200ms' }}>
                <div className="card-header">
                  <h3 className="card-title">Group Members</h3>
                  <p className="card-description">
                    {currentGroup.members?.length || 0} member{currentGroup.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="members-list">
                  {currentGroup.members?.map((member, index) => {
                    const memberUser = member.user;
                    const isMemberAdmin = member.role === "admin" || 
                                         currentGroup.admins?.some(a => a._id === memberUser?._id || a === memberUser?._id);
                    const isCreator = currentGroup.creator?._id === memberUser?._id;
                    
                    return (
                      <div 
                        key={memberUser?._id || member.user} 
                        className="member-item slide-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="member-avatar">
                          {memberUser?.profilePicture ? (
                            <img src={memberUser.profilePicture} alt={memberUser.name} />
                          ) : (
                            <div className="avatar-placeholder">
                              {memberUser?.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="member-info">
                          <div className="member-name">
                            {memberUser?.name}
                            {isCreator && (
                              <span className="badge badge-warning">
                                <Crown size={12} />
                                Creator
                              </span>
                            )}
                            {isMemberAdmin && !isCreator && (
                              <span className="badge badge-primary">
                                <Shield size={12} />
                                Admin
                              </span>
                            )}
                          </div>
                          {memberUser?.email && (
                            <div className="member-email">{memberUser.email}</div>
                          )}
                          {memberUser?.department && (
                            <div style={{ 
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-text-tertiary)',
                              marginTop: 'var(--spacing-xs)'
                            }}>
                              {memberUser.department}
                              {memberUser.year && ` • Year ${memberUser.year}`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon="🔍"
            title="Group not found"
            description="This group may have been deleted or you don't have access to it"
            action={() => navigate("/groups")}
            actionText="Back to Groups"
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default GroupDetail;
