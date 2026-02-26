import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchGroups, createGroup, joinGroup, setFilters, clearError } from "../features/groups/groupSlice";
import { setCurrentGroup } from "../features/chat/chatSlice";
import { joinGroup as joinGroupSocket } from "../socket/socket";
import { 
  Plus, 
  Search, 
  Users, 
  BookOpen, 
  Tag, 
  ArrowRight,
  X,
  Lock,
  Unlock,
  CheckCircle
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ErrorMessage from "../components/ErrorMessage";

const Groups = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    description: "",
    subject: "",
    courseCode: "",
    tags: "",
    isPublic: true,
    allowMemberInvites: true,
    maxMembers: 50
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { groups, isLoading, error, filters } = useSelector((state) => state.groups);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchGroups(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const groupData = {
      ...createFormData,
      tags: createFormData.tags ? createFormData.tags.split(",").map(t => t.trim()) : []
    };
    
    const result = await dispatch(createGroup(groupData));
    if (createGroup.fulfilled.match(result)) {
      setShowCreateModal(false);
      setCreateFormData({
        name: "",
        description: "",
        subject: "",
        courseCode: "",
        tags: "",
        isPublic: true,
        allowMemberInvites: true,
        maxMembers: 50
      });
      navigate(`/groups/${result.payload._id}`);
    }
  };

  const handleJoinGroup = async (groupId) => {
    const result = await dispatch(joinGroup(groupId));
    if (joinGroup.fulfilled.match(result)) {
      joinGroupSocket(groupId);
      dispatch(setCurrentGroup(groupId));
      navigate(`/groups/${groupId}`);
    }
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const isMember = (group) => {
    return group.members?.some(m => m.user?._id === user?._id || m.user === user?._id);
  };

  return (
    <div className="groups-container">
      <div className="groups-header fade-in">
        <div>
          <h1>Study Groups</h1>
          <p style={{ 
            color: 'var(--color-text-secondary)', 
            fontSize: 'var(--font-size-base)',
            marginTop: 'var(--spacing-sm)'
          }}>
            Collaborate with peers and enhance your learning experience
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={20} />
          Create Group
        </button>
      </div>

      <div className="groups-filters fade-in" style={{ animationDelay: '100ms' }}>
        <div style={{ 
          position: 'relative', 
          flex: 1, 
          minWidth: '250px' 
        }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: 'var(--spacing-md)', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--color-gray-400)',
              pointerEvents: 'none'
            }} 
          />
          <input
            type="text"
            placeholder="Search by name, subject, or course code..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="filter-input"
            style={{ paddingLeft: 'calc(var(--spacing-md) * 2.5)' }}
          />
        </div>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.myGroups}
            onChange={(e) => handleFilterChange("myGroups", e.target.checked)}
          />
          <span style={{ 
            fontSize: 'var(--font-size-sm)', 
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-primary)'
          }}>
            My Groups Only
          </span>
        </label>
      </div>

      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => dispatch(fetchGroups(filters))} 
        />
      )}

      {isLoading ? (
        <LoadingSpinner text="Loading groups..." />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No study groups found"
          description={filters.search || filters.myGroups 
            ? "Try adjusting your filters or search terms"
            : "Create your first study group and start collaborating!"}
          action={() => setShowCreateModal(true)}
          actionText="Create Your First Group"
        />
      ) : (
        <div className="groups-grid">
          {groups.map((group, index) => (
            <div 
              key={group._id} 
              className="group-card card-shine hover-glow slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="group-header">
                <div>
                  <h3>{group.name}</h3>
                  {group.subject && (
                    <span className="group-subject">{group.subject}</span>
                  )}
                </div>
                {!group.isPublic && (
                  <Lock size={18} style={{ color: 'var(--color-gray-400)' }} />
                )}
              </div>
              
              {group.description && (
                <p className="group-description">{group.description}</p>
              )}
              
              <div className="group-meta">
                <span className="group-meta-item">
                  <Users size={16} />
                  {group.members?.length || 0} members
                </span>
                {group.courseCode && (
                  <span className="group-meta-item">
                    <BookOpen size={16} />
                    {group.courseCode}
                  </span>
                )}
              </div>
              
              {group.tags && group.tags.length > 0 && (
                <div className="group-tags">
                  {group.tags.map((tag, idx) => (
                    <span key={idx} className="tag">
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="group-actions">
                {isMember(group) ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      dispatch(setCurrentGroup(group._id));
                      navigate(`/groups/${group._id}`);
                    }}
                  >
                    <CheckCircle size={18} />
                    Open Group
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleJoinGroup(group._id)}
                  >
                    <Plus size={18} />
                    Join Group
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content uiverse-glass scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Study Group</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleCreateGroup} id="create-group-form">
                <div className="form-field">
                  <label className="form-label">
                    Group Name <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g., CS50 Study Group"
                  />
                </div>
                
                <div className="form-field">
                  <label className="form-label">Description</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    className="form-textarea"
                    rows="3"
                    placeholder="Describe the purpose of your study group..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                  <div className="form-field">
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      value={createFormData.subject}
                      onChange={(e) => setCreateFormData({ ...createFormData, subject: e.target.value })}
                      className="form-input"
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Course Code</label>
                    <input
                      type="text"
                      value={createFormData.courseCode}
                      onChange={(e) => setCreateFormData({ ...createFormData, courseCode: e.target.value })}
                      className="form-input"
                      placeholder="e.g., CS50"
                    />
                  </div>
                </div>
                
                <div className="form-field">
                  <label className="form-label">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={createFormData.tags}
                    onChange={(e) => setCreateFormData({ ...createFormData, tags: e.target.value })}
                    className="form-input"
                    placeholder="study, exam, project, assignment"
                  />
                  <span className="form-hint">Help others find your group with relevant tags</span>
                </div>
                
                <div className="form-field">
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-sm)',
                      cursor: 'pointer',
                      padding: 'var(--spacing-md)',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border)',
                      transition: 'all var(--transition-fast)'
                    }}
                    className="checkbox-wrapper"
                  >
                    <input
                      type="checkbox"
                      checked={createFormData.isPublic}
                      onChange={(e) => setCreateFormData({ ...createFormData, isPublic: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                    />
                    {createFormData.isPublic ? <Unlock size={18} /> : <Lock size={18} />}
                    <span style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      fontWeight: 'var(--font-weight-medium)' 
                    }}>
                      Public Group
                    </span>
                    <span style={{ 
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-tertiary)',
                      marginLeft: 'auto'
                    }}>
                      {createFormData.isPublic ? 'Anyone can join' : 'Invite only'}
                    </span>
                  </label>
                </div>
              </form>
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="create-group-form"
                className="btn btn-primary"
              >
                <Plus size={18} />
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
