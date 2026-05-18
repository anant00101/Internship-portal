const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Internship = require('./models/Internship');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedData = async () => {
  try {
    console.log('Clearing old data...');
    await User.deleteMany();
    await Internship.deleteMany();

    console.log('Creating users...');
    
    // Create Recruiter
    const recruiter = await User.create({
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'recruiter@example.com',
      password: 'password123',
      role: 'recruiter',
      companyName: 'TechCorp India',
      companyWebsite: 'https://techcorp.in',
      designation: 'Senior HR Manager',
      isVerified: true
    });

    // Create Student
    const student = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'student@example.com',
      password: 'password123',
      role: 'student',
      college: 'Delhi University',
      degree: 'B.Tech',
      graduationYear: 2026,
      skills: ['JavaScript', 'React', 'Node.js']
    });

    console.log('Creating internships...');

    const internships = [
      {
        title: 'Frontend Developer Intern',
        recruiter: recruiter._id,
        companyName: 'Google',
        category: 'Web Development',
        workType: 'Remote',
        location: 'Remote',
        duration: '6 Months',
        stipend: { type: 'Paid', amount: 35000 },
        skills: ['React', 'JavaScript', 'CSS'],
        description: 'Join the Google Workspace team to build next-generation web applications used by millions.',
        responsibilities: 'Develop UI components, write tests, and collaborate with UX designers.',
        whoCanApply: 'Students in their pre-final or final year with strong JS fundamentals.',
        numberOfOpenings: 5,
        ppoAvailable: true
      },
      {
        title: 'Data Science Intern',
        recruiter: recruiter._id,
        companyName: 'Amazon',
        category: 'Data Science / ML',
        workType: 'In-Office',
        location: 'Bangalore, India',
        duration: '3 Months',
        stipend: { type: 'Paid', amount: 45000 },
        skills: ['Python', 'Machine Learning', 'SQL'],
        description: 'Work on large scale datasets to improve Amazon recommendation algorithms.',
        responsibilities: 'Data cleaning, model training, and performance evaluation.',
        whoCanApply: 'CS/Math students familiar with Python data stack.',
        numberOfOpenings: 2,
        ppoAvailable: true
      },
      {
        title: 'UI/UX Design Intern',
        recruiter: recruiter._id,
        companyName: 'Microsoft',
        category: 'UI/UX Design',
        workType: 'Hybrid',
        location: 'Hyderabad, India',
        duration: '4 Months',
        stipend: { type: 'Paid', amount: 30000 },
        skills: ['Figma', 'Prototyping', 'User Research'],
        description: 'Design intuitive interfaces for Microsoft Teams enterprise features.',
        responsibilities: 'Create wireframes, conduct user research, and build interactive prototypes.',
        whoCanApply: 'Design students with a strong portfolio.',
        numberOfOpenings: 3,
        ppoAvailable: false
      },
      {
        title: 'Product Marketing Intern',
        recruiter: recruiter._id,
        companyName: 'Zomato',
        category: 'Marketing',
        workType: 'In-Office',
        location: 'Gurgaon, India',
        duration: '2 Months',
        stipend: { type: 'Paid', amount: 20000 },
        skills: ['Digital Marketing', 'SEO', 'Content Strategy'],
        description: 'Help shape the marketing campaigns for Zomato upcoming features.',
        responsibilities: 'Market research, social media strategy, and content creation.',
        whoCanApply: 'Marketing enthusiasts with excellent communication skills.',
        numberOfOpenings: 4,
        ppoAvailable: true
      },
      {
        title: 'Backend Engineering Intern',
        recruiter: recruiter._id,
        companyName: 'Flipkart',
        category: 'Web Development',
        workType: 'Remote',
        location: 'Remote',
        duration: '6 Months',
        stipend: { type: 'Paid', amount: 40000 },
        skills: ['Node.js', 'MongoDB', 'Redis'],
        description: 'Scale the backend microservices handling millions of daily transactions.',
        responsibilities: 'Build APIs, optimize database queries, and write unit tests.',
        whoCanApply: 'Backend developers familiar with Node.js and NoSQL databases.',
        numberOfOpenings: 6,
        ppoAvailable: true
      }
    ];

    await Internship.insertMany(internships);
    console.log('✅ Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
