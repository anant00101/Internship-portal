const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries
    },
    role: {
      type: String,
      enum: ['student', 'recruiter', 'admin'],
      default: 'student',
    },

    // ===== STUDENT FIELDS =====
    college: { type: String },
    degree: { type: String },
    graduationYear: { type: Number },
    skills: [{ type: String }],
    resumeUrl: { type: String },
    bio: { type: String },

    // ===== RECRUITER FIELDS =====
    companyName: { type: String },
    companyWebsite: { type: String },
    designation: { type: String },
    companyDescription: { type: String },
    isVerified: { type: Boolean, default: false },

    // ===== COMMON =====
    profilePicture: { type: String },
    phone: { type: String },
    location: { type: String },
    savedInternships: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Internship' }],
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual: full name
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', UserSchema);
