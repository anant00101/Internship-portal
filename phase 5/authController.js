const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

// ─────────────────────────────────────────
// TOKEN GENERATORS
// ─────────────────────────────────────────

// Short-lived access token (15 minutes)
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// Long-lived refresh token (7 days) — stored in DB
const generateRefreshToken = async (userId, userAgent, ip) => {
  // Create a secure random token string
  const rawToken = crypto.randomBytes(64).toString('hex');

  // Store in DB with expiry
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7); // 7 days

  await RefreshToken.create({
    token: rawToken,
    user: userId,
    expiresAt: expiry,
    userAgent: userAgent || 'unknown',
    ip: ip || 'unknown',
  });

  return rawToken;
};

// Build user payload to send back to client
const buildUserPayload = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  college: user.college,
  companyName: user.companyName,
  skills: user.skills,
  profilePicture: user.profilePicture,
  isVerified: user.isVerified,
});

// ─────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register student or recruiter
// @access  Public
// ─────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, password, role,
      // Student fields
      college, degree, graduationYear, skills,
      // Recruiter fields
      companyName, companyWebsite, designation,
    } = req.body;

    // Check duplicate email
    if (await User.findOne({ email })) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Build user object
    const userData = {
      firstName, lastName, email, password,
      role: role || 'student',
    };

    if (userData.role === 'student') {
      userData.college = college;
      userData.degree = degree;
      userData.graduationYear = graduationYear;
      userData.skills = skills
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    if (userData.role === 'recruiter') {
      userData.companyName = companyName;
      userData.companyWebsite = companyWebsite;
      userData.designation = designation;
    }

    const user = await User.create(userData);

    // Issue tokens
    const accessToken  = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(
      user._id,
      req.headers['user-agent'],
      req.ip
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      accessToken,
      refreshToken,
      user: buildUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login user, return both tokens
// @access  Public
// ─────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Issue fresh tokens
    const accessToken  = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(
      user._id,
      req.headers['user-agent'],
      req.ip
    );

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      accessToken,
      refreshToken,
      user: buildUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/refresh
// @desc    Use refresh token to get new access token
// @access  Public (uses refresh token)
// ─────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        code: 'NO_REFRESH_TOKEN',
        message: 'No refresh token provided.',
      });
    }

    // Find refresh token in DB
    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Invalid or expired refresh token. Please login again.',
      });
    }

    // Check if expired
    if (new Date() > storedToken.expiresAt) {
      await storedToken.deleteOne(); // Clean up
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Session expired. Please login again.',
      });
    }

    // Find the user
    const user = await User.findById(storedToken.user);
    if (!user) {
      await storedToken.deleteOne();
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
      });
    }

    // ROTATE: delete old refresh token and issue a new one
    await storedToken.deleteOne();

    const newAccessToken  = generateAccessToken(user._id);
    const newRefreshToken = await generateRefreshToken(
      user._id,
      req.headers['user-agent'],
      req.ip
    );

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: buildUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/logout
// @desc    Revoke refresh token (logout)
// @access  Private
// ─────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete this specific refresh token from DB
      await RefreshToken.findOneAndDelete({ token: refreshToken });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/logout-all
// @desc    Revoke ALL refresh tokens (logout all devices)
// @access  Private
// ─────────────────────────────────────────
exports.logoutAll = async (req, res, next) => {
  try {
    await RefreshToken.deleteMany({ user: req.user.id });
    res.status(200).json({
      success: true,
      message: 'Logged out from all devices.',
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
// ─────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/auth/verify
// @desc    Verify if access token is still valid
// @access  Private
// ─────────────────────────────────────────
exports.verifyToken = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid.',
    user: buildUserPayload(req.user),
  });
};

// ─────────────────────────────────────────
// @route   PUT /api/auth/updateprofile
// @access  Private
// ─────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = [
      'firstName', 'lastName', 'phone', 'location', 'bio',
      'college', 'degree', 'graduationYear', 'skills', 'resumeUrl',
      'companyName', 'companyWebsite', 'designation',
      'companyDescription', 'profilePicture',
    ];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   PUT /api/auth/changepassword
// @access  Private
// ─────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    // Revoke all refresh tokens (force re-login everywhere after password change)
    await RefreshToken.deleteMany({ user: req.user.id });

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, req.headers['user-agent'], req.ip);

    res.status(200).json({
      success: true,
      message: 'Password changed. All sessions revoked.',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @route   GET /api/auth/sessions
// @desc    List all active sessions (refresh tokens)
// @access  Private
// ─────────────────────────────────────────
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await RefreshToken.find({ user: req.user.id })
      .select('createdAt expiresAt userAgent ip')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    next(error);
  }
};
