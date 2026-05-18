const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'Under Review', 'Shortlisted', 'Rejected', 'Offered'],
      default: 'Applied',
    },
    coverLetter: { type: String },
    resumeUrl: { type: String },
    recruiterNote: { type: String }, // internal note by recruiter
  },
  { timestamps: true }
);

// One application per student per internship
ApplicationSchema.index({ internship: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
