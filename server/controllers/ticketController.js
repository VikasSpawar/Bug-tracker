import Comment from '../models/Comment.js';
import Project from '../models/Project.js';
import Ticket from '../models/Ticket.js';

const VALID_STATUSES = ['todo', 'in-progress', 'in-review', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_TYPES = ['bug', 'feature', 'task', 'improvement'];

export const createTicket = async (req, res, next) => {
  try {
    const { title, description, status, priority, type, assignee, dueDate, labels, projectId } = req.body;

    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Ticket title is required' 
      });
    }

    if (title.length > 200) {
      return res.status(400).json({ 
        success: false,
        message: 'Ticket title must be less than 200 characters' 
      });
    }

    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        message: 'Project ID is required' 
      });
    }

    // Verify user is part of project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    const isMember = project.teamMembers.some(
      (member) => member.user.toString() === req.user.id
    ) || project.owner.toString() === req.user.id;

    if (!isMember) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to create tickets in this project' 
      });
    }

    const ticket = await Ticket.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      status: VALID_STATUSES.includes(status) ? status : 'todo',
      priority: VALID_PRIORITIES.includes(priority) ? priority : 'medium',
      type: VALID_TYPES.includes(type) ? type : 'bug',
      project: projectId,
      creator: req.user.id,
      assignee: assignee || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      labels: Array.isArray(labels) ? labels.filter(l => l.trim()) : [],
    });

    await ticket.populate('creator', 'name email avatar');
    await ticket.populate('assignee', 'name email avatar');

    console.log(`Ticket created: ${ticket.title} in project ${projectId}`);

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket,
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    next(error);
  }
};

export const getTickets = async (req, res, next) => {
  try {
    const { projectId, status, priority, assignee, search } = req.query;

    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        message: 'Project ID is required' 
      });
    }

    // Verify user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    const isMember = project.teamMembers.some(
      (member) => member.user.toString() === req.user.id
    ) || project.owner.toString() === req.user.id;

    if (!isMember) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view tickets in this project' 
      });
    }

    let filter = { project: projectId };

    if (status && VALID_STATUSES.includes(status)) {
      filter.status = status;
    }
    if (priority && VALID_PRIORITIES.includes(priority)) {
      filter.priority = priority;
    }
    if (assignee) {
      filter.assignee = assignee;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tickets = await Ticket.find(filter)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name email avatar',
        },
      });

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    // Verify user has access to ticket's project
    const project = await Project.findById(ticket.project);
    const isMember = project.teamMembers.some(
      (member) => member.user.toString() === req.user.id
    ) || project.owner.toString() === req.user.id;

    if (!isMember) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view this ticket' 
      });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    next(error);
  }
};

export const updateTicket = async (req, res, next) => {
  try {
    const { title, description, status, type, priority, assignee, dueDate, labels } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    // Check authorization
    const project = await Project.findById(ticket.project);
    const userRole = project.teamMembers.find(m => m.user.toString() === req.user.id)?.role;
    const isOwner = project.owner.toString() === req.user.id;
    const isCreator = ticket.creator.toString() === req.user.id;
    const isAssignee = ticket.assignee?.toString() === req.user.id;

    // Only creator, assignee, or project owner/admin can update
    if (!isCreator && !isAssignee && !isOwner && userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this ticket' 
      });
    }

    // Validation
    if (title && title.length > 200) {
      return res.status(400).json({ 
        success: false,
        message: 'Ticket title must be less than 200 characters' 
      });
    }

    if (title) ticket.title = title.trim();
    if (description !== undefined) ticket.description = description.trim();
    if (status && VALID_STATUSES.includes(status)) ticket.status = status;
    if (type && VALID_TYPES.includes(type)) ticket.type = type;
    if (priority && VALID_PRIORITIES.includes(priority)) ticket.priority = priority;
    if (assignee !== undefined) ticket.assignee = assignee || null;
    if (dueDate !== undefined) ticket.dueDate = dueDate ? new Date(dueDate) : null;
    if (labels) ticket.labels = Array.isArray(labels) ? labels.filter(l => l.trim()) : [];

    await ticket.save();
    await ticket.populate('creator', 'name email avatar');
    await ticket.populate('assignee', 'name email avatar');

    console.log(`Ticket updated: ${ticket.title}`);

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      ticket,
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    next(error);
  }
};

export const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    // Check authorization
    const project = await Project.findById(ticket.project);
    const isOwner = project.owner.toString() === req.user.id;
    const isCreator = ticket.creator.toString() === req.user.id;

    if (!isCreator && !isOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this ticket' 
      });
    }

    // Delete associated comments
    await Comment.deleteMany({ ticket: req.params.id });
    await Ticket.findByIdAndDelete(req.params.id);

    console.log(`Ticket deleted: ${ticket.title}`);

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    next(error);
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar');

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      ticket,
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    next(error);
  }
};

export const assignTicket = async (req, res, next) => {
  try {
    const { assignee } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignee: assignee || null },
      { new: true, runValidators: true }
    )
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar');

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    console.log(`Ticket assigned: ${ticket.title}`);

    res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket,
    });
  } catch (error) {
    console.error('Assign ticket error:', error);
    next(error);
  }
};

export const searchTickets = async (req, res, next) => {
  try {
    const { q, projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        message: 'Project ID is required' 
      });
    }

    if (!q) {
      return res.status(400).json({ 
        success: false,
        message: 'Search query is required' 
      });
    }

    const tickets = await Ticket.find({
      project: projectId,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { labels: { $in: [new RegExp(q, 'i')] } },
      ],
    })
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar');

    res.status(200).json({
      success: true,
      tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error('Search tickets error:', error);
    next(error);
  }
};

export const addWatcher = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    // Check if already watching
    if (ticket.watchers.includes(req.user.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Already watching this ticket' 
      });
    }

    ticket.watchers.push(req.user.id);
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Now watching ticket',
      ticket,
    });
  } catch (error) {
    console.error('Add watcher error:', error);
    next(error);
  }
};

export const removeWatcher = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    ticket.watchers = ticket.watchers.filter(w => w.toString() !== req.user.id);
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Stopped watching ticket',
      ticket,
    });
  } catch (error) {
    console.error('Remove watcher error:', error);
    next(error);
  }
};
