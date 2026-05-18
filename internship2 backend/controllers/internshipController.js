const Internship = require('../models/Internship');

// ─────────────────────────────────────────
// @route   GET /api/internships
// @desc    Get all internships (with filters & search)
// @access  Public
// ─────────────────────────────────────────
exports.getAllInternships = async (req, res, next) => {
  try {
    const { search, category, workType, minStipend, duration, location, page = 1, limit = 10 } = req.query;

    const query = { isActive: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (category) query.category = category;
    if (workType) query.workType = workType;
    if (location) query.location = new RegExp(location, 'i');
    if (duration) query.duration = duration;
    if (minStipend) query['stipend.amount'] = { $gte: Number(minStipend) };

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Internship.countDocuments(query);

    const internships = await Internship.find(query)
      .populate('recruiter', 'firstName lastName companyName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: internships.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: internships,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/internships/:id
// @desc    Get single internship
// @access  Public
// ─────────────────────────────────────────
exports.getInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id).populate(
      'recruiter',
      'firstName lastName companyName companyWebsite companyDescription profilePicture isVerified'
    );

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    res.status(200).json({ success: true, data: internship });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/internships
// @desc    Create internship (recruiter only)
// @access  Private/Recruiter
// ─────────────────────────────────────────
exports.createInternship = async (req, res, next) => {
  try {
    req.body.recruiter = req.user.id;
    req.body.companyName = req.user.companyName;

    const internship = await Internship.create(req.body);
    res.status(201).json({ success: true, data: internship });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/internships/:id
// @desc    Update internship (only owner recruiter)
// @access  Private/Recruiter
// ─────────────────────────────────────────
exports.updateInternship = async (req, res, next) => {
  try {
    let internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    // Make sure recruiter owns this internship
    if (internship.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this internship' });
    }

    internship = await Internship.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: internship });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   DELETE /api/internships/:id
// @desc    Delete internship (only owner recruiter)
// @access  Private/Recruiter
// ─────────────────────────────────────────
exports.deleteInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    if (internship.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this internship' });
    }

    await internship.deleteOne();
    res.status(200).json({ success: true, message: 'Internship deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/internships/my/postings
// @desc    Get all internships posted by logged-in recruiter
// @access  Private/Recruiter
// ─────────────────────────────────────────
exports.getMyPostings = async (req, res, next) => {
  try {
    const internships = await Internship.find({ recruiter: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: internships.length, data: internships });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   PATCH /api/internships/:id/toggle
// @desc    Toggle internship active/inactive
// @access  Private/Recruiter
// ─────────────────────────────────────────
exports.toggleInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findById(req.params.id);

    if (!internship) {
      return res.status(404).json({ success: false, message: 'Internship not found' });
    }

    if (internship.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    internship.isActive = !internship.isActive;
    await internship.save();

    res.status(200).json({
      success: true,
      message: `Internship ${internship.isActive ? 'activated' : 'deactivated'} successfully`,
      data: internship,
    });
  } catch (error) {
    next(error);
  }
};
