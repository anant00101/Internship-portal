const express = require('express');
const router = express.Router();
const {
  applyInternship,
  getMyApplications,
  getApplicationsForInternship,
  getAllRecruiterApplications,
  updateApplicationStatus,
  withdrawApplication,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.post('/:internshipId', protect, authorize('student'), applyInternship);
router.get('/my', protect, authorize('student'), getMyApplications);
router.delete('/:id', protect, authorize('student'), withdrawApplication);

// Recruiter routes
router.get('/recruiter/all', protect, authorize('recruiter'), getAllRecruiterApplications);
router.get('/internship/:internshipId', protect, authorize('recruiter'), getApplicationsForInternship);
router.patch('/:id/status', protect, authorize('recruiter'), updateApplicationStatus);

module.exports = router;
