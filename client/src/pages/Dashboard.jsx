import {
  Edit2,
  Filter,
  Layout,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Trash2,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import KanbanBoard from "../components/KanbanBoard";
import Modal from "../components/Modal";
import Sidebar from "../components/Sidebar";
import TicketDetails from "../components/TicketDetails";
import TicketForm from "../components/TicketForm";
import { useAuth } from "../context/AuthContext";
import { useProject } from "../context/ProjectContext";
import { useTickets } from "../hooks/useTickets";
import { useToast } from "../hooks/useToast";

export default function Dashboard() {
  const { user } = useAuth();
  const {
    currentProject,
    loading: projectLoading,
    deleteProject,
  } = useProject();
  const {
    tickets,
    createTicket,
    updateTicket,
    updateTicketStatus,
    deleteTicket,
    loading: ticketsLoading,
  } = useTickets(currentProject?._id);
  const { success, error: showError } = useToast();

  // UI State
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedTicketStatus, setSelectedTicketStatus] = useState("todo");
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterMode, setFilterMode] = useState("all");

  // --- Filtering Logic (Memoized) ---
  const displayedTickets = useMemo(() => {
    if (!tickets) return [];

    return tickets.filter((ticket) => {
      // 1. Search
      const matchesSearch = ticket.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // 2. Priority
      const matchesPriority =
        filterPriority === "all" || ticket.priority === filterPriority;

      // 3. Type
      const matchesType = filterType === "all" || ticket.type === filterType;

      // 4. Ownership (My Tasks) - ROBUST FIX
      let matchesOwner = true;

      if (filterMode === "mine") {
        // Safe User ID extraction (handles 'id' vs '_id')
        const currentUserId = user?._id || user?.id;

        // Safe Ticket Assignee ID extraction (handles populated object vs string ID)
        const ticketAssigneeId = ticket.assignee?._id || ticket.assignee;

        // DEBUGGING: Uncomment these lines if it still doesn't work
        // console.log("Ticket:", ticket.title);
        console.log("  Assignee ID:", ticketAssigneeId);
        console.log("  My User ID :", currentUserId);

        // Convert both to strings before comparing
        if (!ticketAssigneeId || !currentUserId) {
          matchesOwner = false; // If either is missing, it's not a match
        } else {
          matchesOwner = String(ticketAssigneeId) === String(currentUserId);
        }
      }

      return matchesSearch && matchesPriority && matchesType && matchesOwner;
    });
  }, [tickets, searchQuery, filterPriority, filterType, filterMode, user]);

  // --- Handlers ---
  const handleStatusChange = async (ticketId, newStatus) => {
    const result = await updateTicketStatus(ticketId, newStatus);
    if (!result.success) {
      showError(result.error || "Failed to update ticket");
    }
  };

  const handleDeleteTicket = async () => {
    if (!ticketToDelete) return;
    const result = await deleteTicket(ticketToDelete._id);
    if (result.success) {
      success("Ticket deleted successfully");
      setShowDeleteConfirm(false);
      setTicketToDelete(null);
    } else {
      showError(result.error || "Failed to delete ticket");
    }
  };

  const handleCreateOrUpdateTicket = async (data) => {
    if (selectedTicket) {
      const result = await updateTicket(selectedTicket._id, data);
      if (result.success) {
        success("Ticket updated successfully");
        setShowTicketForm(false);
        setSelectedTicket(null);
      } else {
        showError(result.error || "Failed to update ticket");
      }
    } else {
      const result = await createTicket({
        ...data,
        status: selectedTicketStatus || "todo",
      });
      if (result.success) {
        success("Ticket created successfully");
        setShowTicketForm(false);
        setSelectedTicket(null);
      } else {
        showError(result.error || "Failed to create ticket");
      }
    }
  };

  // --- 2. NOW WE CAN DO EARLY RETURNS (Guard Clauses) ---

  // Loading State
  if (projectLoading) {
    return (
      <div className="flex h-screen bg-navy-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin mb-4 inline-block">
              <div className="w-12 h-12 border-4 border-navy-700 border-t-primary rounded-full"></div>
            </div>
            <p className="text-slate-400 font-medium">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  // No Project State
  if (!currentProject) {
    return (
      <div className="flex h-screen bg-navy-900">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center bg-navy-900 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-mint/5 rounded-full blur-3xl"></div>
          </div>

          <div className="text-center relative z-10 p-8 border border-navy-700 bg-navy-800/50 backdrop-blur-sm rounded-2xl shadow-premium max-w-lg">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-navy-700 rounded-2xl flex items-center justify-center mb-6 shadow-glow border border-navy-600">
                <Layout size={40} className="text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Welcome to Bug Tracker
              </h2>
              <p className="text-slate-400 text-lg mb-6">
                Create or select a project from the sidebar to start managing
                your workflow.
              </p>
              <div className="flex justify-center gap-2 text-sm text-slate-500 bg-navy-900/50 py-2 px-4 rounded-lg border border-navy-700 inline-block">
                <span className="font-mono">←</span> Use the sidebar to navigate
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Stats Calculation (Must be after guard clauses to ensure data exists) ---
  const stats = {
    total: displayedTickets.length,
    todo: displayedTickets.filter((t) => t.status === "todo").length,
    inProgress: displayedTickets.filter((t) => t.status === "in-progress")
      .length,
    inReview: displayedTickets.filter((t) => t.status === "in-review").length,
    done: displayedTickets.filter((t) => t.status === "done").length,
  };

  const StatItem = ({ label, value, colorClass = "text-white" }) => (
    <div className="flex-1 px-6 py-3 flex items-center justify-between min-w-[140px]">
      <span className="text-sm text-slate-400 font-medium">{label}</span>
      <span className={`text-xl font-bold ${colorClass}`}>{value}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-navy-900 text-slate-100 overflow-hidden font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* --- Top Header --- */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-navy-800/50 bg-navy-900/80 backdrop-blur-md z-20 shrink-0">
          {/* Project Title & Meta */}
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {currentProject.title}
                <button
                  onClick={() => setShowProjectMenu(!showProjectMenu)}
                  className="p-1 hover:bg-navy-700 rounded text-slate-400 transition relative"
                >
                  <MoreVertical size={16} />
                  {showProjectMenu && (
                    <div className="absolute left-0 top-full mt-2 w-48 bg-navy-800 rounded-xl shadow-premium border border-navy-700 overflow-hidden z-50">
                      <button className="w-full text-left px-4 py-3 hover:bg-navy-700 text-sm flex items-center gap-2 text-slate-300">
                        <Edit2 size={16} /> Edit Project
                      </button>
                      <button className="w-full text-left px-4 py-3 hover:bg-navy-700 text-sm flex items-center gap-2 text-slate-300">
                        <Settings size={16} /> Settings
                      </button>
                      <div className="h-[1px] bg-navy-700 mx-2"></div>
                      <button
                        onClick={() => deleteProject(currentProject._id)}
                        className="w-full text-left px-4 py-3 hover:bg-red-900/20 text-sm flex items-center gap-2 text-red-400"
                      >
                        <Trash2 size={16} /> Delete Project
                      </button>
                    </div>
                  )}
                </button>
              </h1>
              <p className="text-xs text-slate-400 font-medium truncate max-w-xs">
                {currentProject.description || "No description"}
              </p>
            </div>

            <div className="h-8 w-[1px] bg-navy-700"></div>

            {/* My Tasks Toggle */}
            <div className="bg-navy-800 p-1 rounded-lg border border-navy-700 flex items-center">
              <button
                onClick={() => setFilterMode("all")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterMode === "all"
                    ? "bg-navy-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users size={14} /> All Tasks
              </button>
              <button
                onClick={() => setFilterMode("mine")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filterMode === "mine"
                    ? "bg-primary/20 text-primary shadow-sm border border-primary/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <User size={14} /> My Tasks
              </button>
            </div>
          </div>

          {/* Right Controls: Search & Add */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-48 lg:w-64 pl-10 pr-3 py-2 border border-navy-700 rounded-lg leading-5 bg-navy-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-navy-800 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-all shadow-inner"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg transition border ${showFilters ? "bg-navy-700 border-primary text-primary" : "bg-navy-800 border-navy-700 text-slate-400 hover:text-white"}`}
            >
              <Filter size={18} />
            </button>

            <button
              onClick={() => setShowTicketForm(true)}
              className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium shadow-glow transition-all active:scale-95"
            >
              <Plus size={18} className="mr-2" />
              New Ticket
            </button>
          </div>
        </div>

        {/* --- Stats & Filters Strip --- */}
        <div className="px-8 pt-8 pb-4 shrink-0">
          <div className="flex flex-col gap-4">
            {/* Horizontal Stats Bar */}
            <div className="flex items-center justify-between bg-navy-800/50 rounded-xl p-1 border border-navy-800 overflow-x-auto no-scrollbar shadow-sm">
              <div className="flex divide-x divide-navy-700 w-full">
                <StatItem label="Total" value={stats.total} />
                <StatItem label="To Do" value={stats.todo} />
                <StatItem
                  label="In Progress"
                  value={stats.inProgress}
                  colorClass="text-primary"
                />
                <StatItem
                  label="In Review"
                  value={stats.inReview}
                  colorClass="text-amber-400"
                />
                <StatItem
                  label="Done"
                  value={stats.done}
                  colorClass="text-accent-mint"
                />
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="flex items-center gap-3 p-3 bg-navy-800 rounded-xl border border-navy-700 animate-in slide-in-from-top-2 fade-in duration-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                  Filters:
                </span>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="bg-navy-900 border border-navy-600 text-slate-300 text-sm rounded-lg focus:ring-primary focus:border-primary block px-3 py-1.5 outline-none"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-navy-900 border border-navy-600 text-slate-300 text-sm rounded-lg focus:ring-primary focus:border-primary block px-3 py-1.5 outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                  <option value="task">Task</option>
                  <option value="improvement">Improvement</option>
                </select>

                <button
                  onClick={() => {
                    setFilterPriority("all");
                    setFilterType("all");
                    setSearchQuery("");
                  }}
                  className="ml-auto text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                >
                  <XCircle size={14} /> Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- Kanban Content --- */}
        <div className="flex-1 overflow-hidden px-8 pb-8 pt-2">
          {ticketsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-10 h-10 border-4 border-navy-700 border-t-primary rounded-full"></div>
            </div>
          ) : displayedTickets.length > 0 ? (
            <KanbanBoard
              tickets={displayedTickets}
              onAddTicket={(status) => {
                setSelectedTicketStatus(status);
                setShowTicketForm(true);
              }}
              onStatusChange={handleStatusChange}
              onDelete={(ticketId) => {
                setTicketToDelete(tickets.find((t) => t._id === ticketId));
                setShowDeleteConfirm(true);
              }}
              onEdit={(ticket) => {
                setSelectedTicket(ticket);
                setShowTicketForm(true);
              }}
              onOpenDetails={(ticket) => {
                setSelectedTicket(ticket);
                setShowDetails(true);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-navy-700 rounded-2xl bg-navy-800/20">
              <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center mb-4">
                <Search className="text-slate-500" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No tickets found
              </h3>
              <p className="text-slate-400 mb-6 max-w-xs mx-auto">
                No tickets match your filters, or this project is empty.
              </p>
              <button
                onClick={() => setShowTicketForm(true)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg font-semibold transition"
              >
                <Plus size={18} />
                Create First Ticket
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Modals --- */}
      <TicketForm
        isOpen={showTicketForm}
        projectId={currentProject?._id}
        initialData={selectedTicket}
        members={currentProject?.teamMembers || []}
        onSubmit={handleCreateOrUpdateTicket}
        onClose={() => {
          setShowTicketForm(false);
          setSelectedTicket(null);
        }}
      />

      {showDetails && selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          onClose={() => {
            setShowDetails(false);
            setSelectedTicket(null);
          }}
          onEdit={(ticket) => {
            setShowDetails(false);
            setSelectedTicket(ticket);
            setShowTicketForm(true);
          }}
          onDelete={() => {
            setShowDetails(false);
            setTicketToDelete(selectedTicket);
            setShowDeleteConfirm(true);
          }}
          onTicketUpdated={(updatedTicket) => {
            if (updatedTicket) setSelectedTicket(updatedTicket);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTicketToDelete(null);
        }}
        title="Delete Ticket"
        footer={
          <>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setTicketToDelete(null);
              }}
              className="px-4 py-2 border border-navy-600 text-slate-300 rounded-lg hover:bg-navy-700 font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteTicket}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition shadow-lg shadow-red-900/20"
            >
              Delete Ticket
            </button>
          </>
        }
      >
        <div className="text-slate-300">
          <p className="mb-2">
            Are you sure you want to delete this ticket? This action cannot be
            undone.
          </p>
          {ticketToDelete && (
            <div className="bg-navy-900 p-3 rounded-lg border border-navy-700 mt-3 flex items-start gap-3">
              <div className="w-1 h-full bg-red-500 rounded-full self-stretch min-h-[20px]"></div>
              <div>
                <span className="block text-xs text-red-400 font-bold uppercase mb-1">
                  Deleting
                </span>
                <span className="font-medium text-white">
                  {ticketToDelete.title}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
