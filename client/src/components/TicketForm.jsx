import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Loader,
  Type,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// New Prop: 'members' (List of project team members)
export default function TicketForm({
  projectId,
  onSubmit,
  onClose,
  initialData = null,
  isOpen = true,
  members = [],
}) {
  const defaultValues = {
    title: "",
    description: "",
    priority: "medium",
    type: "bug",
    dueDate: "",
    assignee: "", // Stores the User ID
  };

  const [formData, setFormData] = useState({
    ...defaultValues,
    ...initialData,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  // Sync state when initialData changes
  useEffect(() => {
    if (initialData) {
      // If editing, ensure we map the assignee correctly (sometimes it's an object, sometimes an ID)
      const assigneeId =
        initialData.assignee?._id || initialData.assignee || "";
      setFormData({ ...defaultValues, ...initialData, assignee: assigneeId });
    } else {
      setFormData(defaultValues);
    }
  }, [initialData]);

  // Handle Escape Key & Body Scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleEsc);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    const titleValue = formData.title || "";

    if (!titleValue.trim()) {
      newErrors.title = "Title is required";
    } else if (titleValue.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (formData.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.dueDate);
      if (!isNaN(selectedDate.getTime()) && selectedDate < today) {
        newErrors.dueDate = "Due date cannot be in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit({ ...formData, projectId });
    } catch (err) {
      setError(err.message || "Failed to submit ticket");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = (hasError) => `
    w-full px-4 py-3 bg-navy-900 border 
    ${hasError ? "border-red-500/50 focus:border-red-500" : "border-navy-700 focus:border-primary"} 
    text-white placeholder-slate-500 rounded-xl 
    focus:ring-1 ${hasError ? "focus:ring-red-500" : "focus:ring-primary"} 
    outline-none transition-all shadow-inner
  `;

  const labelClasses =
    "block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-navy-800 rounded-2xl shadow-premium w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-navy-700 animate-in zoom-in-95 duration-200 will-change-transform">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-indigo-700 px-6 py-5 flex items-center justify-between shadow-lg shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {initialData ? "Edit Ticket" : "Create New Ticket"}
            </h2>
            <p className="text-indigo-100 text-xs mt-1 opacity-90">
              {initialData
                ? "Update ticket details below"
                : "Fill in the information to track a new issue"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="text-red-400 shrink-0" size={20} />
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className={labelClasses}>
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: "" });
                }}
                className={inputClasses(errors.title)}
                placeholder="e.g., Fix navigation bar glitch on mobile"
                disabled={loading}
                autoFocus
              />
              {errors.title && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className={labelClasses}>Description</label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={`${inputClasses(false)} resize-none min-h-[120px]`}
                placeholder="Provide detailed steps to reproduce, expected behavior, and actual behavior..."
                disabled={loading}
              />
            </div>

            {/* Grid 1: Type & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClasses}>
                  <div className="flex items-center gap-1.5">
                    <Type size={14} /> Type{" "}
                    <span className="text-red-400">*</span>
                  </div>
                </label>
                <div className="relative">
                  <select
                    value={formData.type || "bug"}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className={`${inputClasses(false)} appearance-none cursor-pointer`}
                    disabled={loading}
                  >
                    <option value="bug">🐛 Bug</option>
                    <option value="feature">✨ Feature</option>
                    <option value="task">✅ Task</option>
                    <option value="improvement">📈 Improvement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Priority{" "}
                    <span className="text-red-400">*</span>
                  </div>
                </label>
                <div className="relative">
                  <select
                    value={formData.priority || "medium"}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className={`${inputClasses(false)} appearance-none cursor-pointer`}
                    disabled={loading}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid 2: Assignee & Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assignee Dropdown */}
              <div>
                <label className={labelClasses}>
                  <div className="flex items-center gap-1.5">
                    <User size={14} /> Assign To
                  </div>
                </label>
                <div className="relative">
                  <select
                    value={formData.assignee || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, assignee: e.target.value })
                    }
                    className={`${inputClasses(false)} appearance-none cursor-pointer`}
                    disabled={loading}
                  >
                    <option value="">Unassigned</option>
                    {members &&
                      members.map((member) => (
                        <option
                          key={member.user._id || member._id}
                          value={member.user._id || member._id}
                        >
                          {member.user.name || member.name}
                        </option>
                      ))}
                  </select>
                  {/* Custom Arrow */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path
                        d="M1 1L5 5L9 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className={labelClasses}>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} /> Due Date
                  </div>
                </label>
                <input
                  type="date"
                  value={
                    formData.dueDate
                      ? new Date(formData.dueDate).toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) => {
                    setFormData({ ...formData, dueDate: e.target.value });
                    if (errors.dueDate) setErrors({ ...errors, dueDate: "" });
                  }}
                  className={`${inputClasses(errors.dueDate)} [color-scheme:dark]`}
                  disabled={loading}
                />
                {errors.dueDate && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.dueDate}
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-navy-700 bg-navy-900/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-navy-600 text-slate-300 rounded-xl hover:bg-navy-700 hover:text-white transition font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl transition font-semibold flex items-center justify-center gap-2 shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader size={18} className="animate-spin" /> Processing...
              </>
            ) : initialData ? (
              "Update Ticket"
            ) : (
              "Create Ticket"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
