const mongoose = require('mongoose');

const InternshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Internship title is required'],
      trim: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Web Development',
        'Data Science / ML',
        'UI/UX Design',
        'Mobile Development',
        'Marketing',
        'Finance',
        'Content Writing',
        'Business Development',
        'Other',
      ],
    },
    workType: {
      type: String,
      enum: ['Remote', 'In-Office', 'Hybrid'],
      required: true,
    },
    location: {
      type: String,
      default: 'Remote',
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
    },
    startDate: { type: Date },
    applicationDeadline: { type: Date },

    stipend: {
      type: {
        type: String,
        enum: ['Paid', 'Unpaid', 'Performance Based'],
        default: 'Paid',
      },
      amount: { type: Number, default: 0 }, // monthly in INR
    },

    skills: [{ type: String }],
    description: { type: String, required: [true, 'Description is required'] },
    responsibilities: { type: String },
    whoCanApply: { type: String },
    numberOfOpenings: { type: Number, default: 1 },
    ppoAvailable: { type: Boolean, default: false },
    interviewProcess: { type: String, default: 'One Round' },

    isActive: { type: Boolean, default: true },
    applicationsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text search index
InternshipSchema.index({ title: 'text', companyName: 'text', skills: 'text', category: 'text' });

module.exports = mongoose.model('Internship', InternshipSchema);
