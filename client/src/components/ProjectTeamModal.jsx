import { Loader, Mail, Shield, Trash2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { projectAPI } from '../services/api';

export default function ProjectTeamModal({ project, isOpen, onClose, onTeamUpdated }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  if (!isOpen || !project) return null;

  // --- 1. ROBUST USER ID EXTRACTION ---
  // This handles cases where user is { _id: ... }, { id: ... }, or { user: { _id: ... } }
  const currentUserId = user?._id || user?.id || user?.user?._id;

  // Debugging: Uncomment if issues persist
  // console.log("Project Owner:", project.owner);
  // console.log("Current User ID (Fixed):", currentUserId);

  // --- 2. PERMISSION CHECK ---
  // Ensure we compare Strings to avoid ObjectId vs String issues
  const projectOwnerId = project.owner?._id || project.owner;
  const projectCreatorId = project.creator?._id || project.creator;
  
  const isOwner = String(projectOwnerId) === String(currentUserId) || 
                  String(projectCreatorId) === String(currentUserId);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await projectAPI.addMember(project._id, email);
      success('User added successfully');
      setEmail('');
      if (onTeamUpdated) onTeamUpdated(res.data.project);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member from the project?')) return;

    try {
      const res = await projectAPI.removeMember(project._id, memberId);
      success('Member removed successfully');
      if (onTeamUpdated) onTeamUpdated(res.data.project);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Helpers
  const getMemberName = (member) => member.user?.name || member.name || 'Unknown';
  const getMemberEmail = (member) => member.user?.email || member.email || '';
  const getMemberId = (member) => member.user?._id || member.user || member._id;
  const getInitial = (member) => getMemberName(member).charAt(0).toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 transition-opacity animate-in fade-in duration-200" onClick={onClose} />
      
      <div className="relative bg-navy-800 w-full max-w-md rounded-2xl shadow-2xl border border-navy-700 overflow-hidden animate-in zoom-in-95 will-change-transform">
        
        {/* Header */}
        <div className="p-6 border-b border-navy-700 flex justify-between items-center bg-navy-900/50">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Manage Team</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">{project.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-navy-700 rounded-lg text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Invite Form (Only visible to Owner) */}
          {isOwner ? (
            <form onSubmit={handleInvite} className="mb-8">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Invite via Email</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input 
                    type="email" 
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-navy-900 border border-navy-600 rounded-xl text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    disabled={loading}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !email.trim()}
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-glow"
                >
                  {loading ? <Loader size={18} className="animate-spin" /> : <><UserPlus size={18} /> Add</>}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-3 bg-navy-900/50 border border-navy-700 rounded-xl flex gap-3 items-center">
               <Shield size={18} className="text-slate-500" />
               <p className="text-xs text-slate-400">Only the project owner can manage team members.</p>
            </div>
          )}

          {/* Members List */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center justify-between tracking-wider">
              Team Members
              <span className="bg-navy-700 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-navy-600">
                {project.teamMembers?.length || 0}
              </span>
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1 -mr-1">
              {project.teamMembers && project.teamMembers.length > 0 ? (
                project.teamMembers.map((member, index) => {
                  const memberId = getMemberId(member);
                  
                  // --- 3. FIX SELF CHECK ---
                  // Use the robust 'currentUserId' and force String conversion
                  const isSelf = String(memberId) === String(currentUserId);

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-navy-900/50 rounded-xl border border-navy-700 group hover:border-navy-600 transition">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {getInitial(member)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate flex items-center gap-2">
                            {getMemberName(member)}
                            {isSelf && <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded border border-primary/20 font-bold">YOU</span>}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{getMemberEmail(member)}</p>
                        </div>
                      </div>
                      
                      {/* Delete Button Logic: Show only if Owner AND NOT Self */}
                      {isOwner && !isSelf && (
                        <button 
                          onClick={() => handleRemove(memberId)}
                          className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Remove member"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-navy-700 rounded-xl">
                  <p className="text-sm text-slate-500">No members found.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}