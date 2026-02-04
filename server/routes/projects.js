import express from 'express';
import {
    addTeamMember,
    archiveProject,
    createProject,
    deleteProject,
    getProjectById,
    getProjects,
    removeTeamMember,
    updateMemberRole,
    updateProject,
} from '../controllers/projectController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.patch('/:id/archive', archiveProject);
router.post('/:id/members', addTeamMember);
router.post('/:id/team', authMiddleware, addTeamMember);
router.delete('/:id/team', authMiddleware, removeTeamMember);
router.delete('/:id/members', removeTeamMember);
router.patch('/:id/members/role', updateMemberRole);

export default router;
