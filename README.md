# InternHub — Full-Stack Internship Portal 🚀

InternHub is a premium, feature-rich full-stack application designed to connect students with employers. It facilitates internship exploration, saving roles, easy applications, profile customization, and recruiters' application tracking and publishing capabilities.

Developed with a modern dark-themed aesthetic, premium HSL tailored gradients, smooth glassmorphism, responsive grids, and micro-interactions.

---

## 🌟 Key Features

### 👨‍🎓 For Students
- **Dashboard & Stats**: Visual application tracking, interactive application lists with dynamic status badges (Applied, Under Review, Shortlisted, Offered, Rejected).
- **Profile Strengths Indicator**: Live interactive checker tracking completeness of resume, profile picture, skills, bio, and educational credentials.
- **Dedicated Profile Management**: Easily manage education, skills, upload resume links, profile picture, and descriptive bio.
- **Advanced Internship Browser**: Multi-criteria search (keyword, location), filtering (work type, domain categories, minimum stipends), and sorting by stipends or latest dates.
- **Saved Internships (Bookmarks)**: Instant persistent bookmarking of internships with seamless server-side state synchronization.
- **One-Click Application & Withdrawal**: Apply to listings immediately or withdraw an active application with live UI updates.

### 💼 For Recruiters
- **Recruiter Dashboard**: Quick statistics on active postings, total applicants, shortlisted counts, and active reviews.
- **Publish Openings**: Post custom internships with details on role title, description, skills, category, stipend, PPO availability, and selection workflow.
- **Applicant & Candidate Management**: Track and manage students who applied, change status via interactive dropdowns (Shortlist, Offer, Reject), and automatically notify them on status change.

### 🔒 Core Technology & Authentication
- **Secure Token Rotation**: Robust state management using JWT with automatic access token refresh, secure retry queues for concurrent operations, and token validation barriers.
- **API Performance Tuning**: Rate limits configured up to 1000 requests per 15 minutes to guarantee fast, seamless, and unblocked navigation.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Responsive HTML5 (semantic layout), Vanilla CSS3 variables (tailored theme, custom animations, fluid sidebars), Modern Bootstrap 5 icons & grids, Vanilla JavaScript ES6 (highly optimized API integration layer).
- **Backend**: Node.js & Express.js (modular controllers and middleware structure), Mongoose ODM & MongoDB Atlas (high-performance schemas), JWT Authentication with rotational security middleware.

---

## 📁 Project Structure

```
├── frontend/                  # Production-ready deployed assets (Clean UI/UX)
├── internship2/               # Development environment frontend files
├── internship2 backend/       # Express API Gateway server, controllers, schemas
├── connected databases/       # Database configuration details
├── start.bat                  # Automated ecosystem starter script
├── .gitignore                 # Configured system/environment ignore file
└── README.md                  # System instruction set
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB Instance (Atlas or Local)

### 1. Database & Server Configuration
Clone or navigate to the `internship2 backend` directory:
```bash
cd "internship2 backend"
```
Create a `.env` file containing the following configurations (avoid pushing this file to Git):
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```
Install dependencies:
```bash
npm install
```

### 2. Fast Launch (Windows)
Double-click `start.bat` in the root directory. This script will automatically:
1. Terminate any orphaned node processes.
2. Initialize the backend server using the development process watcher (`nodemon` / `npm run dev`).
3. Point you to launch your frontend files.

Alternatively, manually start the API server:
```bash
cd "internship2 backend"
npm run dev
```

### 3. Running Frontend
Once the backend API is live on `http://localhost:5000`, open the frontend inside `internship2` using **VS Code Live Server** or any static host pointing to `http://localhost:5500` or `http://127.0.0.1:5500`.

---

## 📄 License
This portal is developed for academic/internship management operations. All rights reserved.
