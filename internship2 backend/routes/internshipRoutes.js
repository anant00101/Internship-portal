const express = require('express');
const router = express.Router();
const {
  getAllInternships,
  getInternship,
  createInternship,
  updateInternship,
  deleteInternship,
  getMyPostings,
  toggleInternship,
} = require('../controllers/internshipController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllInternships);
router.get('/:id', getInternship);

// Recruiter only routes
router.post('/', protect, authorize('recruiter'), createInternship);
router.get('/my/postings', protect, authorize('recruiter'), getMyPostings);
router.put('/:id', protect, authorize('recruiter'), updateInternship);
router.delete('/:id', protect, authorize('recruiter'), deleteInternship);
router.patch('/:id/toggle', protect, authorize('recruiter'), toggleInternship);

module.exports = router;
