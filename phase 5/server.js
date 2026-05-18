const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

// ── Security & Parsing Middleware ────────────────────────────
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));          // Limit body size
app.use(express.urlencoded({ extended: true }));

// ── Simple rate limiter for auth routes ──────────────────────
const authAttempts = new Map();
const rateLimitAuth = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 20;

  if (!authAttempts.has(ip)) authAttempts.set(ip, []);
  const attempts = authAttempts.get(ip).filter(t => now - t < windowMs);
  attempts.push(now);
  authAttempts.set(ip, attempts);

  if (attempts.length > maxAttempts) {
    return res.status(429).json({
      success: false,
      message: `Too many requests from this IP. Try again in 15 minutes.`,
    });
  }
  next();
};

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',         rateLimitAuth, require('./routes/authRoutes'));
app.use('/api/internships',  require('./routes/internshipRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 InternHub API is running!',
    version: '1.0.0',
    time: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler (must be last) ───────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅  Server running → http://localhost:${PORT}`);
  console.log(`🔐  JWT access token expires in: ${process.env.JWT_EXPIRE}`);
  console.log(`🔄  Refresh token expires in: ${process.env.JWT_REFRESH_EXPIRE}\n`);
});
