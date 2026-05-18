const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  verifyToken,
  updateProfile,
  changePassword,
  getSessions,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// ── Public routes ──────────────────────────────────────────
router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refreshToken);  // Exchange refresh → new access token
router.post('/logout',   logout);        // Revoke one refresh token

// ── Protected routes (valid access token required) ────────
router.get('/me',              protect, getMe);
router.get('/verify',          protect, verifyToken);    // Check if token still valid
router.put('/updateprofile',   protect, updateProfile);
router.put('/changepassword',  protect, changePassword);
router.post('/logout-all',     protect, logoutAll);      // Revoke all sessions
router.get('/sessions',        protect, getSessions);    // View active sessions

module.exports = router;
