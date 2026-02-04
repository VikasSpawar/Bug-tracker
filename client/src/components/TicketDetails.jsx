import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  Edit2,
  Loader,
  MessageSquare,
  Share2,
  Trash2,
  User,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom'; // Import Portal
import { useToast } from '../hooks/useToast';
import { commentAPI } from '../services/api';

export default function TicketDetails({ ticket, onClose, onEdit, onDelete, onTicketUpdated }) {
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(true);
  const [comments, setComments] = useState([]);
  const [loadingComment, setLoadingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const { success, error: showError } = useToast();

  // Handle Body Scroll & Escape Key
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await commentAPI.getAll({ ticketId: ticket._id });
        setComments(response.data.comments);
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to fetch comments';
        if (err.response?.status !== 404) {
           showError(errorMsg);
        }
      } 
    };
    if (ticket._id) fetchComments();
  }, [ticket._id, showError]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoadingComment(true);
    setCommentError('');
    try {
      const response = await commentAPI.create({
        text: newComment,
        ticketId: ticket._id,
      });

      const newCommentsList = [...comments, response.data.comment];
      setComments(newCommentsList);
      setNewComment('');
      success('Comment added successfully');
      
      const updatedTicket = { ...ticket, comments: newCommentsList };
      onTicketUpdated?.(updatedTicket);
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setLoadingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await commentAPI.delete(commentId);
      const updatedComments = comments.filter(c => c._id !== commentId);
      setComments(updatedComments);
      success('Comment deleted successfully');
      
      const updatedTicket = { ...ticket, comments: updatedComments };
      onTicketUpdated?.(updatedTicket);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  // Helper Styles
  const getPriorityStyle = (priority) => {
    const styles = {
      low: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
      medium: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
      high: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
      urgent: 'bg-red-400/10 text-red-400 border-red-400/20',
    };
    return styles[priority] || styles.low;
  };

  const getStatusStyle = (status) => {
    const styles = {
      'todo': 'bg-navy-700 text-slate-400 border-navy-600',
      'in-progress': 'bg-primary/10 text-primary border-primary/20',
      'in-review': 'bg-amber-400/10 text-amber-400 border-amber-400/20',
      'done': 'bg-accent-mint/10 text-accent-mint border-accent-mint/20',
    };
    return styles[status] || styles.todo;
  };

  const getTypeIcon = (type) => {
    const icons = { bug: '🐛', feature: '✨', task: '✅', improvement: '📈' };
    return icons[type] || '📌';
  };

  // Use Portal to render outside root
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* PERFORMANCE FIX: No blur, simple opacity */}
      <div 
        className="absolute inset-0 bg-black/80 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Container with GPU Acceleration */}
      <div className="relative bg-navy-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-navy-700 animate-in zoom-in-95 duration-200 will-change-transform">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-indigo-700 px-6 py-5 flex items-center justify-between shadow-lg shrink-0 z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold text-white truncate leading-tight">{ticket.title}</h2>
            <div className="flex items-center gap-2 mt-1 opacity-80">
               <span className="text-xs font-mono bg-white/20 px-1.5 rounded text-white">
                 #{ticket._id?.substring(ticket._id.length - 4).toUpperCase()}
               </span>
               <span className="text-xs text-indigo-100">
                 Created {formatDistanceToNow(new Date(ticket.createdAt))} ago
               </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="p-6 space-y-8">
            
            {/* Description */}
            <div className="bg-navy-900/50 rounded-xl p-4 border border-navy-700">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                {ticket.description || 'No description provided.'}
              </p>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Status */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</p>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${getStatusStyle(ticket.status)}`}>
                  {ticket.status?.replace('-', ' ')}
                </span>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</p>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${getPriorityStyle(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>

              {/* Type */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</p>
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                  <span>{getTypeIcon(ticket.type)}</span>
                  <span className="capitalize">{ticket.type}</span>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignee</p>
                {ticket.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center text-[10px] font-bold text-primary">
                      {ticket.assignee.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-300 truncate">{ticket.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-500 italic">Unassigned</span>
                )}
              </div>
            </div>
            
            {/* Additional Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-navy-700/50">
               <div className="flex items-center gap-2 text-sm text-slate-400">
                  <User size={14} />
                  <span>Reporter: <span className="text-slate-300 font-medium">{ticket.creator?.name || 'Unknown'}</span></span>
               </div>
               {ticket.dueDate && (
                 <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar size={14} />
                    <span>Due: <span className="text-slate-300 font-medium">{format(new Date(ticket.dueDate), 'MMM dd, yyyy')}</span></span>
                 </div>
               )}
            </div>

            {/* Comments Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-navy-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare size={18} className="text-primary" />
                  Comments
                  <span className="text-sm font-medium text-slate-500 bg-navy-900 px-2 py-0.5 rounded-full border border-navy-700">
                    {comments.length}
                  </span>
                </h3>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-xs font-semibold text-primary hover:text-indigo-400 transition"
                >
                  {showComments ? 'Hide' : 'Show'}
                </button>
              </div>

              {showComments && (
                <div className="space-y-4">
                  {/* Comments List */}
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {comments && comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment._id} className="group flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 mt-1">
                            {comment.author?.name?.[0]?.toUpperCase()}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-200">{comment.author?.name}</span>
                              <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                            </div>
                            
                            <div className="bg-navy-900 p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-navy-700 relative group-hover:border-navy-600 transition-colors">
                              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                              
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-navy-800 rounded transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 bg-navy-900/30 rounded-xl border border-dashed border-navy-700">
                        <p className="text-sm text-slate-500">No comments yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <div className="bg-navy-900 p-4 rounded-xl border border-navy-700">
                    {commentError && (
                      <div className="mb-3 p-2 bg-red-900/20 border border-red-900/50 rounded flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle size={14} />
                        {commentError}
                      </div>
                    )}

                    <form onSubmit={handleAddComment}>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type your comment here..."
                        className="w-full px-4 py-3 bg-navy-800 border border-navy-700 text-slate-200 placeholder-slate-500 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none text-sm min-h-[80px]"
                        disabled={loadingComment}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={!newComment.trim() || loadingComment}
                          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm transition shadow-glow disabled:opacity-50 flex items-center gap-2"
                        >
                          {loadingComment ? <Loader size={14} className="animate-spin" /> : 'Send'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-navy-700 bg-navy-800 p-4 flex gap-3 shrink-0 rounded-b-2xl">
          <button
            onClick={() => onEdit?.(ticket)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-700 hover:bg-navy-600 text-slate-300 hover:text-white rounded-xl font-medium transition border border-navy-600"
          >
            <Edit2 size={16} /> Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm('Delete this ticket permanently?')) onDelete?.();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-xl font-medium transition border border-red-900/30"
          >
            <Trash2 size={16} /> Delete
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-700 hover:bg-navy-600 text-slate-300 hover:text-white rounded-xl font-medium transition border border-navy-600">
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}