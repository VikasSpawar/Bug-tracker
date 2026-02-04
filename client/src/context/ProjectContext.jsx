import { createContext, useContext, useEffect, useState } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await API.get('/projects');
      setProjects(response.data.projects || []);

      // Auto-select first project
      if (response.data.projects && response.data.projects.length > 0) {
        setCurrentProject(response.data.projects[0]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchProjects();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const createProject = async (projectData) => {
    try {
      const response = await API.post('/projects', projectData);
      setProjects([response.data.project, ...projects]);
      return { success: true, project: response.data.project };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      const response = await API.put(`/projects/${projectId}`, projectData);
      setProjects(
        projects.map((p) => (p._id === projectId ? response.data.project : p))
      );
      if (currentProject?._id === projectId) {
        setCurrentProject(response.data.project);
      }
      return { success: true, project: response.data.project };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await API.delete(`/projects/${projectId}`);
      setProjects(projects.filter((p) => p._id !== projectId));
      if (currentProject?._id === projectId) {
        setCurrentProject(projects[0] || null);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const value = {
    projects,
    currentProject,
    setCurrentProject,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};
