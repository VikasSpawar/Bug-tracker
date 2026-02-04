import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit2,
  Flag,
  MessageSquare,
  Trash2,
  Zap,
} from "lucide-react";
import { memo } from "react";

// Design Tokens for Priorities
// FIX: Added explicit 'barColor' to ensure the left accent is always solid
const PRIORITY_STYLES = {
  low: {
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    barColor: "bg-slate-400", // Solid color for the bar
    border: "border-slate-400/20",
    iconColor: "text-slate-400",
  },
  medium: {
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    barColor: "bg-amber-400",
    border: "border-amber-400/20",
    iconColor: "text-amber-400",
  },
  high: {
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    barColor: "bg-orange-400",
    border: "border-orange-400/20",
    iconColor: "text-orange-400",
  },
  urgent: {
    color: "text-red-400",
    bg: "bg-red-400/10",
    barColor: "bg-red-400",
    border: "border-red-400/20",
    iconColor: "text-red-400",
  },
};

const TYPE_ICONS = {
  bug: <AlertCircle size={14} />,
  feature: <Zap size={14} />,
  task: <CheckCircle2 size={14} />,
  improvement: <CheckCircle2 size={14} />,
};

const TYPE_COLORS = {
  bug: "text-red-400",
  feature: "text-primary",
  task: "text-blue-400",
  improvement: "text-accent-mint",
};

const STATUS_STYLES = {
  todo: "bg-navy-700 text-slate-400 border border-navy-600",
  "in-progress": "bg-primary/10 text-primary border border-primary/20",
  "in-review": "bg-amber-400/10 text-amber-400 border border-amber-400/20",
  done: "bg-accent-mint/10 text-accent-mint border border-accent-mint/20",
};

const TicketCard = memo(
  function TicketCard({ ticket, onDelete, onEdit, onOpenDetails }) {
    const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date();

    // Safe fallbacks
    const priorityStyle =
      PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.low;
    const statusStyle = STATUS_STYLES[ticket.status] || STATUS_STYLES.todo;
    const TypeIcon = TYPE_ICONS[ticket.type] || TYPE_ICONS.task;

    return (
      <div
        onClick={() => onOpenDetails?.(ticket)}
        className="group relative bg-navy-800 rounded-xl p-4 border border-navy-700 hover:border-primary/50 shadow-sm hover:shadow-premium transition-all duration-200 cursor-pointer overflow-hidden card-transition"
      >
        {/* FIXED: Used 'priorityStyle.barColor' instead of replace() 
         This guarantees a visible solid line for all priorities.
      */}
        <div
          className={`absolute top-0 left-0 bottom-0 w-1 ${priorityStyle.barColor}`}
        ></div>

        {/* Hover Actions Menu */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(ticket);
            }}
            className="p-1.5 bg-navy-700 hover:bg-primary hover:text-white text-slate-400 rounded-lg transition-colors border border-navy-600"
            title="Edit ticket"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm("Delete this ticket?")) {
                onDelete();
              }
            }}
            className="p-1.5 bg-navy-700 hover:bg-red-500 hover:text-white text-slate-400 rounded-lg transition-colors border border-navy-600"
            title="Delete ticket"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Header: Priority & Type */}
        <div className="flex items-center gap-2 mb-3 pl-2">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityStyle.bg} ${priorityStyle.color} ${priorityStyle.border}`}
          >
            <Flag size={10} className={priorityStyle.iconColor} />
            {ticket.priority}
          </div>

          <div
            className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_COLORS[ticket.type] || "text-slate-400"}`}
          >
            {TypeIcon}
            {ticket.type}
          </div>
        </div>

        {/* Title */}
        <h4 className="pl-2 font-medium text-slate-200 text-sm leading-snug mb-2 pr-12 group-hover:text-primary transition-colors">
          {ticket.title}
        </h4>

        {/* Description */}
        {ticket.description && (
          <p className="pl-2 text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
            {ticket.description}
          </p>
        )}

        {/* Footer: Meta Info */}
        <div className="pl-2 mt-auto pt-3 border-t border-navy-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {ticket.assignee ? (
              <div
                className="flex items-center gap-2"
                title={`Assigned to ${ticket.assignee.name}`}
              >
                <div className="w-6 h-6 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center text-[10px] font-bold text-slate-300">
                  {ticket.assignee.name?.[0]?.toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-navy-800 border border-dashed border-navy-600 flex items-center justify-center">
                <span className="text-[10px] text-slate-600">?</span>
              </div>
            )}

            {ticket.comments?.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MessageSquare size={14} />
                <span>{ticket.comments.length}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {ticket.dueDate && (
              <div
                className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-slate-500"}`}
              >
                <Clock size={12} />
                <span>
                  {new Date(ticket.dueDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${statusStyle}`}
            >
              {ticket.status.replace("-", " ")}
            </span>
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.ticket._id === nextProps.ticket._id &&
      prevProps.ticket.status === nextProps.ticket.status &&
      prevProps.ticket.title === nextProps.ticket.title &&
      prevProps.ticket.priority === nextProps.ticket.priority &&
      prevProps.ticket.updatedAt === nextProps.ticket.updatedAt
    );
  },
);

export default TicketCard;
