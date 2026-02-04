import Project from '../models/Project.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

export const createProject = async (req, res, next) => {
  try {
    const { title, description, color } = req.body;

    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Project title is required' 
      });
    }

    if (title.length > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Project title must be less than 100 characters' 
      });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      color: color || '#3b82f6',
      owner: req.user.id,
    });

    await project.populate('teamMembers.user', 'name email avatar');

    console.log(`Project created: ${project.title} by user ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const { includeArchived } = req.query;
    
    const filter = {
      $or: [
        { owner: req.user.id },
        { 'teamMembers.user': req.user.id },
      ],
    };

    if (includeArchived !== 'true') {
      filter.isArchived = false;
    }

    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .populate('teamMembers.user', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('teamMembers.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Check authorization
    const isOwner = project.owner._id.toString() === req.user.id;
    const isMember = project.teamMembers.some(m => m.user._id.toString() === req.user.id);

    if (!isOwner && !isMember) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view this project' 
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this project' 
      });
    }

    const { title, description, color } = req.body;
    
    // Validation
    if (title && title.length > 100) {
      return res.status(400).json({ 
        success: false,
        message: 'Project title must be less than 100 characters' 
      });
    }

    project.title = title ? title.trim() : project.title;
    project.description = description !== undefined ? description.trim() : project.description;
    project.color = color || project.color;

    await project.save();
    await project.populate('teamMembers.user', 'name email avatar');

    console.log(`Project updated: ${project.title}`);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this project' 
      });
    }

    // Delete all tickets associated with this project
    await Ticket.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    console.log(`Project deleted: ${project.title}`);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    next(error);
  }
};

export const archiveProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to archive this project' 
      });
    }

    project.isArchived = !project.isArchived;
    await project.save();
    await project.populate('teamMembers.user', 'name email avatar');

    console.log(`Project ${project.isArchived ? 'archived' : 'unarchived'}: ${project.title}`);

    res.status(200).json({
      success: true,
      message: `Project ${project.isArchived ? 'archived' : 'unarchived'} successfully`,
      project,
    });
  } catch (error) {
    console.error('Archive project error:', error);
    next(error);
  }
};

export const addTeamMember = async (req, res, next) => {
  try {
    // 1. We expect 'email' from the frontend now, not 'userId'
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if requestor is the owner (assuming your Auth middleware sets req.user)
    // Note: Use .toString() when comparing ObjectIds
    if (project.owner?.toString() !== req.user.id && project.creator?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify team members' });
    }

    // 2. Find the user by Email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    // 3. Check if already a member
    const memberExists = project.teamMembers.some(
      (member) => member.user.toString() === userToAdd._id.toString()
    );

    if (memberExists) {
      return res.status(409).json({ success: false, message: 'User is already a team member' });
    }

    const validRoles = ['admin', 'manager', 'developer', 'viewer'];
    const memberRole = validRoles.includes(role) ? role : 'developer';

    // 4. Add to array
    project.teamMembers.push({
      user: userToAdd._id,
      role: memberRole,
    });

    await project.save();
    
    // 5. Populate details so frontend can display the name/avatar immediately
    await project.populate('teamMembers.user', 'name email');

    console.log(`Team member ${userToAdd.email} added to project ${project.title}`);

    res.status(200).json({
      success: true,
      message: 'Team member added successfully',
      project, // Return the updated project
    });
  } catch (error) {
    console.error('Add team member error:', error);
    next(error);
  }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    const { userId } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required' 
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Authorization: Check if requestor is Owner OR Creator
    const ownerId = project.owner?.toString() || project.creator?.toString();
    
    if (ownerId !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to modify team members' 
      });
    }

    // Validation: Cannot remove owner
    if (userId === ownerId) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot remove project owner' 
      });
    }

    // Logic: Remove member
    const initialLength = project.teamMembers.length;
    project.teamMembers = project.teamMembers.filter(
      (member) => member.user.toString() !== userId
    );

    if (project.teamMembers.length === initialLength) {
      return res.status(404).json({ 
        success: false,
        message: 'Team member not found in project' 
      });
    }

    await project.save();
    
    // Return populated project so frontend updates immediately
    await project.populate('teamMembers.user', 'name email avatar');

    console.log(`Team member removed from project ${project.title}`);

    res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
      project,
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    // Validation
    if (!userId || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID and role are required' 
      });
    }

    const validRoles = ['admin', 'manager', 'developer', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid role. Must be one of: admin, manager, developer, viewer' 
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to modify team members' 
      });
    }

    // Cannot change owner's role
    if (project.owner.toString() === userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot modify owner role' 
      });
    }

    const member = project.teamMembers.find(m => m.user.toString() === userId);
    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: 'Team member not found' 
      });
    }

    member.role = role;
    await project.save();
    await project.populate('teamMembers.user', 'name email avatar');

    console.log(`Team member role updated to ${role} in project ${project.title}`);

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      project,
    });
  } catch (error) {
    console.error('Update member role error:', error);
    next(error);
  }
};
