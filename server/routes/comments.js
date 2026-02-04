import express from 'express';
import { createComment, getComments, deleteComment } from '../controllers/commentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createComment);
router.get('/', getComments);
router.delete('/:id', deleteComment);

export default router;
