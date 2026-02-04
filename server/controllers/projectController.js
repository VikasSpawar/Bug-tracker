import Project from '../models/Project.js';

export const createProject = async (req, res, next) => {
  try {
    const { title, description, color } = req.body;

    const project = await Project.create({
      title,
      description,
      color,
      owner: req.user.id,
    });

    await project.populate('teamMembers.user', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { 'teamMembers.user': req.user.id },
      ],
      isArchived: false,
    })
      .populate('owner', 'name email avatar')
      .populate('teamMembers.user', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('teamMembers.user', 'name email avatar');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const { title, description, color } = req.body;
    project.title = title || project.title;
    project.description = description || project.description;
    project.color = color || project.color;

    await project.save();
    await project.populate('teamMembers.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addTeamMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify team members' });
    }

    // Check if member already exists
    const memberExists = project.teamMembers.some(
      (member) => member.user.toString() === userId
    );

    if (memberExists) {
      return res.status(409).json({ message: 'User is already a team member' });
    }

    project.teamMembers.push({
      user: userId,
      role: role || 'developer',
    });

    await project.save();
    await project.populate('teamMembers.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Team member added successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify team members' });
    }

    // Cannot remove owner
    if (project.owner.toString() === userId) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    project.teamMembers = project.teamMembers.filter(
      (member) => member.user.toString() !== userId
    );

    await project.save();
    await project.populate('teamMembers.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Team member removed successfully',
      project,
    });
  } catch (error) {
    next(error);
  }
};
