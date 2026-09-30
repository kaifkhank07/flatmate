import { Router } from 'express';
import { authenticateUser, authenticateUserOrAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createReport,
  getReports,
  getReportById,
  getReportsByTarget,
  updateReportStatus,
  deleteReport,
} from '../../controllers/listing/report.controller';
import {
  createReportSchema,
  updateReportStatusSchema,
} from '../../validations/listing/report.validation';

const router = Router();

// Create a report (User)
router.post('/', authenticateUser, validate(createReportSchema), createReport);

// Get list of reports (Users get their own, Admins get all with filters)
router.get('/', authenticateUserOrAdmin, getReports);

// Get all individual reports for a target (Admin / User)
router.get('/target/:targetType/:targetId', authenticateUserOrAdmin, getReportsByTarget);

// Get report by ID
router.get('/:reportId', authenticateUserOrAdmin, getReportById);

// Update report status (Admin/User resolution)
router.patch('/:reportId/status', authenticateUserOrAdmin, validate(updateReportStatusSchema), updateReportStatus);

// Delete report
router.delete('/:reportId', authenticateUserOrAdmin, deleteReport);

export default router;
