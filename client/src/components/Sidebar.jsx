import {
  BarChart2,
  Bug,
  FolderOpen,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProject } from "../context/ProjectContext";
import ProjectTeamModal from "./ProjectTeamModal";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const {
    projects,
    currentProject,
    setCurrentProject,
    createProject,
    deleteProject,
  } = useProject();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showProjectFlyout, setShowProjectFlyout] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // Project Form State
  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const flyoutRef = useRef(null);

  // Close flyout when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target)) {
        setShowProjectFlyout(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [flyoutRef]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (projectName.trim()) {
      const result = await createProject({
        title: projectName,
        description: projectDesc,
      });
      if (result.success) {
        setProjectName("");
        setProjectDesc("");
        setShowForm(false);
      }
    }
  };

  const handleTeamUpdate = (newMember) => {
    // Update the current project in context with the new member
    const updatedProject = {
      ...currentProject,
      members: [...(currentProject.members || []), newMember],
    };

    // Update context (assuming you expose a method to update a single project)
    // Or just force a refresh. For now, let's update the local currentProject state:
    setCurrentProject(updatedProject);
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      {/* --- Main Thin Sidebar (Matches HTML) --- */}
      <aside className="w-20 bg-navy-800 flex flex-col items-center flex-shrink-0 border-r border-navy-700 py-6 z-50 h-screen relative">
        {/* Brand Icon */}
        <div className="h-12 w-12 flex items-center justify-center mb-8 rounded-xl bg-gradient-to-br from-primary to-indigo-700 shadow-glow text-white">
          <LayoutGrid size={24} fill="currentColor" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col space-y-4 w-full px-2">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={!showProjectFlyout && location.pathname === "/"}
            onClick={() => {
              setShowProjectFlyout(false);
              navigate("/");
            }}
          />

          <SidebarItem
            icon={FolderOpen}
            label="Projects"
            active={showProjectFlyout}
            onClick={() => setShowProjectFlyout(!showProjectFlyout)}
          />

          <SidebarItem
            icon={Bug}
            label="Issues"
            active={false}
            onClick={() => {}}
          />

          <SidebarItem
            icon={BarChart2}
            label="Reports"
            active={false}
            onClick={() => {}}
          />
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto flex flex-col space-y-4 w-full px-2">
          <div className="h-[1px] bg-navy-700 mx-2"></div>

          <SidebarItem icon={Settings} label="Settings" onClick={() => {}} />

          <button
            onClick={handleLogout}
            className="group flex items-center justify-center w-full h-12 rounded-lg relative text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={22} />
            <Tooltip text="Logout" />
          </button>

          {/* User Avatar */}
          <div className="h-10 w-10 mx-auto rounded-full bg-navy-700 border-2 border-navy-600 flex items-center justify-center text-xs font-bold text-primary cursor-pointer hover:border-primary transition-colors">
            {user?.name?.charAt(0) || "U"}
          </div>
        </div>

        {/* --- Projects Flyout (The Logic Layer) --- */}
        {/* This panel slides out when you click "Projects" */}
        <div
          ref={flyoutRef}
          className={`absolute left-20 top-0 h-full w-72 bg-navy-800 border-r border-navy-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
            showProjectFlyout
              ? "translate-x-0"
              : "-translate-x-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col h-full p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Projects
              </h2>
              <button
                onClick={() => setShowProjectFlyout(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-2.5 text-slate-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Find project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-navy-900 border border-navy-700 rounded-xl text-sm text-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            {/* Inside the Projects Flyout, maybe above the list? */}
            {currentProject && (
              <button
                onClick={() => setShowTeamModal(true)}
                className="w-full mb-4 flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-600 text-slate-200 py-2 rounded-lg text-xs font-semibold border border-navy-600 transition"
              >
                <UserPlus size={14} /> Manage {currentProject.title} Team
              </button>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
              {filteredProjects.map((project) => (
                <div key={project._id} className="group relative mb-1">
                  <button
                    onClick={() => {
                      setCurrentProject(project);
                      setShowProjectFlyout(false); // Close menu on select
                    }}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all text-sm font-medium flex items-center justify-between ${
                      currentProject?._id === project._id
                        ? "bg-navy-700 text-white shadow-sm border border-navy-600"
                        : "text-slate-400 hover:bg-navy-700/50 hover:text-slate-200"
                    }`}
                  >
                    <span className="truncate">{project.title}</span>
                    {currentProject?._id === project._id && (
                      <div className="w-1.5 h-1.5 bg-accent-mint rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                    )}
                  </button>

                  {/* Context Menu Trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(
                        openMenuId === project._id ? null : project._id,
                      );
                    }}
                    className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity p-1"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {/* Context Menu Dropdown */}
                  {openMenuId === project._id && (
                    <div className="absolute right-0 top-8 w-32 bg-navy-900 rounded-lg shadow-xl border border-navy-600 z-50 overflow-hidden">
                      <button
                        onClick={() => deleteProject(project._id)}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-navy-800 flex items-center gap-2"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Create Project Form */}
            <div className="mt-4 pt-4 border-t border-navy-700">
              {showForm ? (
                <form
                  onSubmit={handleCreateProject}
                  className="space-y-3 bg-navy-900/50 p-3 rounded-xl border border-navy-700"
                >
                  <input
                    autoFocus
                    placeholder="Project Name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-primary text-white text-xs py-2 rounded-lg font-semibold"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-navy-700 text-slate-300 text-xs py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-glow hover:translate-y-[-2px]"
                >
                  <Plus size={18} /> New Project
                </button>
              )}
            </div>

            {/* Team Management Modal */}
            <ProjectTeamModal
              isOpen={showTeamModal}
              onClose={() => setShowTeamModal(false)}
              project={currentProject}
              onTeamUpdated={handleTeamUpdate}
            />
          </div>
        </div>
      </aside>
    </>
  );
}

// Helper Components for HTML-like Styling
function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center justify-center w-full h-12 rounded-lg relative transition-all duration-200 ${
        active
          ? "bg-navy-700 text-primary shadow-md"
          : "text-slate-400 hover:text-white hover:bg-navy-700/50"
      }`}
    >
      <Icon
        size={22}
        strokeWidth={active ? 2.5 : 2}
        className={`transition-transform duration-200 group-hover:scale-110 ${active ? "text-primary" : ""}`}
      />

      {/* Tooltip matching HTML logic */}
      <Tooltip text={label} />
    </button>
  );
}

function Tooltip({ text }) {
  return (
    <div className="absolute left-14 bg-navy-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-navy-600 shadow-xl font-medium tracking-wide">
      {text}
    </div>
  );
}
