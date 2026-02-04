import Ticket from '../models/Ticket.js';
import Comment from '../models/Comment.js';
import Project from '../models/Project.js';

export const createTicket = async (req, res, next) => {
  try {
    const { title, description, priority, type, assignee, dueDate, labels, projectId } = req.body;

    // Verify user is part of project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers.some(
      (member) => member.user.toString() === req.user.id
    ) || project.owner.toString() === req.user.id;

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to create tickets in this project' });
    }

    const ticket = await Ticket.create({
      title,
      description,
      priority,
      type,
      project: projectId,
      creator: req.user.id,
      assignee: assignee || null,
      dueDate: dueDate || null,
      labels: labels || [],
    });

    await ticket.populate('creator', 'name email avatar');
    await ticket.populate('assignee', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const getTickets = async (req, res, next) => {
  try {
    const { projectId, status, priority, assignee } = req.query;

    let filter = { project: projectId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tickets = await Ticket.find(filter)
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
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
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicket = async (req, res, next) => {
  try {
    const { title, description, status, priority, assignee, dueDate, labels } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is creator or assigned
    if (ticket.creator.toString() !== req.user.id && ticket.assignee?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    ticket.title = title || ticket.title;
    ticket.description = description || ticket.description;
    ticket.status = status || ticket.status;
    ticket.priority = priority || ticket.priority;
    ticket.assignee = assignee || ticket.assignee;
    ticket.dueDate = dueDate || ticket.dueDate;
    ticket.labels = labels || ticket.labels;

    await ticket.save();
    await ticket.populate('creator', 'name email avatar');
    await ticket.populate('assignee', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Ticket updated successfully',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is creator
    if (ticket.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this ticket' });
    }

    // Delete associated comments
    await Comment.deleteMany({ ticket: req.params.id });
    await Ticket.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const assignTicket = async (req, res, next) => {
  try {
    const { assignee } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignee },
      { new: true, runValidators: true }
    )
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Ticket assigned successfully',
      ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const searchTickets = async (req, res, next) => {
  try {
    const { q, projectId } = req.query;

    const tickets = await Ticket.find({
      project: projectId,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { labels: { $regex: q, $options: 'i' } },
      ],
    })
      .populate('creator', 'name email avatar')
      .populate('assignee', 'name email avatar');

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    next(error);
  }
};
