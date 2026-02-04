import Comment from '../models/Comment.js';
import Ticket from '../models/Ticket.js';

export const createComment = async (req, res, next) => {
  try {
    const { text, ticketId, mentions } = req.body;

    const comment = await Comment.create({
      text,
      ticket: ticketId,
      author: req.user.id,
      mentions: mentions || [],
    });

    await comment.populate('author', 'name email avatar');

    // Add comment to ticket
    await Ticket.findByIdAndUpdate(
      ticketId,
      { $push: { comments: comment._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment,
    });
  } catch (error) {
    next(error);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const { ticketId } = req.query;

    const comments = await Comment.find({ ticket: ticketId })
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .sort('createdAt');

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is author
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    // Remove comment from ticket
    await Ticket.findByIdAndUpdate(
      comment.ticket,
      { $pull: { comments: comment._id } }
    );

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
