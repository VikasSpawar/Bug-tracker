import express from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
  assignTicket,
  searchTickets,
} from '../controllers/ticketController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/search', searchTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.patch('/:id/status', updateTicketStatus);
router.patch('/:id/assign', assignTicket);

export default router;
