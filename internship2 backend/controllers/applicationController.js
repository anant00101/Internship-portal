const Application = require('../models/Application');
const Internship = require('../models/Internship');

// ─────────────────────────────────────────
// @route   POST /api/applications/:internshipId
// @desc    Apply for an internship (student)
// @access  Private/Student
// ─────────────────────────────────────────
exports.applyInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.internshipId);

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    if (!internship.isActive) {
      return res.status(400).json({ success: false, message: 'This internship is no longer accepting applications' });
    }

    // Check if already applied
    const existing = await Application.findOne({
      internship: req.params.internshipId,
      student: req.user.id,
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied for this internship' });
    }

    const application = await Application.create({
      internship: req.params.internshipId,
      student: req.user.id,
      recruiter: internship.recruiter,
      coverLetter: req.body.coverLetter,
      resumeUrl: req.body.resumeUrl || req.user.resumeUrl,
    });

    // Increment application count
    await Internship.findByIdAndUpdate(req.params.internshipId, { $inc: { applicationsCount: 1 } });

    res.status(201).json({ success: true, message: 'Application submitted successfully!', data: application });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/applications/my
// @desc    Get all applications of logged-in student
// @access  Private/Student
// ─────────────────────────────────────────
exports.getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate('internship', 'title companyName workType location stipend duration')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/applications/internship/:internshipId
// @desc    Get all applications for a specific internship (recruiter)
// @access  Private/Recruiter
// ─────────────────────────────────────────
exports.getApplicationsForInternship = async (req, res, next) => {
  try {
    // Verify internship belongs to this recruiter
    const internship = await Internship.findById(req.params.internshipId);
    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    if (internship.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const applications = await Application.find({ internship: req.params.internshipId })
      .populate('student', 'firstName lastName email college degree skills resumeUrl profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/applications/recruiter/all
// @desc    Get all applications across all recruiter's internships
// @access  Private/Recruiter
// ─────────────────────────────────────────
exports.getAllRecruiterApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ recruiter: req.user.id })
      .populate('student', 'firstName lastName email college degree skills resumeUrl')
      .populate('internship', 'title companyName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, data: applications });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   PATCH /api/applications/:id/status
// @desc    Update application status (recruiter)
// @access  Private/Recruiter
// ─────────────────────────────────────────
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, recruiterNote } = req.body;
    const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Offered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    application.status = status;
    if (recruiterNote) application.recruiterNote = recruiterNote;
    await application.save();

    res.status(200).json({ success: true, message: `Status updated to "${status}"`, data: application });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/applications/:id
// @desc    Withdraw application (student)
// @access  Private/Student
// ─────────────────────────────────────────
exports.withdrawApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to withdraw this application' });
    }

    if (['Offered', 'Rejected'].includes(application.status)) {
      return res.status(400).json({ success: false, message: 'Cannot withdraw after final decision' });
    }

    await application.deleteOne();
    await Internship.findByIdAndUpdate(application.internship, { $inc: { applicationsCount: -1 } });

    res.status(200).json({ success: true, message: 'Application withdrawn successfully' });
  } catch (error) {
    next(error);
  }
};
