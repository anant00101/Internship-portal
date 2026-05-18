# 🚀 Phase 6 — Deploy Full Stack Project
## InternHub | Anant Rajvanshi | Enrollment: 23131420025

---

## 🗺️ Deployment Architecture

```
FRONTEND  →  Netlify   (Free) → https://internhub.netlify.app
BACKEND   →  Render    (Free) → https://internhub-api.onrender.com
DATABASE  →  MongoDB Atlas (Free) → cloud.mongodb.com
```

---

## STEP 1 — Deploy Database (MongoDB Atlas)

### 1.1 Create Free Atlas Account
- Go to → https://cloud.mongodb.com
- Click "Try Free" → Sign up with Google or Email

### 1.2 Create a Free Cluster
- Click "Build a Database"
- Choose → **FREE (M0 Sandbox)**
- Provider → AWS | Region → Mumbai (ap-south-1)
- Cluster Name → `internhub-cluster`
- Click **Create**

### 1.3 Create Database User
- Left menu → **Database Access** → Add New User
- Username: `internhub_user`
- Password: `YourStrongPassword123`
- Role: **Atlas Admin**
- Click **Add User**

### 1.4 Whitelist All IPs (for Render backend)
- Left menu → **Network Access** → Add IP Address
- Click **Allow Access from Anywhere** → `0.0.0.0/0`
- Click **Confirm**

### 1.5 Get Your Connection String
- Left menu → **Database** → Click **Connect**
- Choose → **Connect your application**
- Driver: Node.js | Version: 5.5 or later
- Copy the string:
```
mongodb+srv://internhub_user:<password>@internhub-cluster.xxxxx.mongodb.net/internship_portal?retryWrites=true&w=majority
```
- Replace `<password>` with your actual password
- **Save this string — you'll need it in Step 2**

---

## STEP 2 — Deploy Backend (Render)

### 2.1 Push Backend to GitHub
```bash
cd "internship2 backend"
git init
git add .
git commit -m "Initial backend commit"
```
- Go to → https://github.com → New Repository
- Name: `internhub-backend` → Public → Create
```bash
git remote add origin https://github.com/YOUR_USERNAME/internhub-backend.git
git branch -M main
git push -u origin main
```

### 2.2 Deploy on Render
- Go to → https://render.com → Sign up with GitHub
- Click **New** → **Web Service**
- Connect your `internhub-backend` GitHub repo
- Fill in settings:

| Field | Value |
|---|---|
| Name | internhub-api |
| Region | Singapore |
| Branch | main |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Instance Type | **Free** |

### 2.3 Add Environment Variables on Render
- Scroll down to **Environment Variables** → Add each one:

| Key | Value |
|---|---|
| `PORT` | `5000` |
| `MONGO_URI` | your Atlas connection string from Step 1.5 |
| `JWT_SECRET` | `internhub_access_secret_anant_2026_xK9#mP2` |
| `JWT_EXPIRE` | `15m` |
| `JWT_REFRESH_SECRET` | `internhub_refresh_secret_anant_2026_zR7@nQ4` |
| `JWT_REFRESH_EXPIRE` | `7d` |
| `NODE_ENV` | `production` |

- Click **Create Web Service**
- Wait 2-3 minutes for deployment
- Your backend URL will be: `https://internhub-api.onrender.com`
- Test it → open in browser → you should see: `🚀 InternHub API is running!`

---

## STEP 3 — Update Frontend API URL

### 3.1 Change BASE_URL in api.js
Open `api.js` → Line 1 → change:
```js
// FROM (local):
const BASE_URL = 'http://localhost:5000/api';

// TO (production):
const BASE_URL = 'https://internhub-api.onrender.com/api';
```

---

## STEP 4 — Deploy Frontend (Netlify)

### 4.1 Push Frontend to GitHub
```bash
cd internship2
git init
git add .
git commit -m "Initial frontend commit"
```
- Go to → https://github.com → New Repository
- Name: `internhub-frontend` → Public → Create
```bash
git remote add origin https://github.com/YOUR_USERNAME/internhub-frontend.git
git branch -M main
git push -u origin main
```

### 4.2 Deploy on Netlify
- Go to → https://netlify.com → Sign up with GitHub
- Click **Add new site** → **Import an existing project**
- Connect GitHub → Select `internhub-frontend` repo
- Fill in settings:

| Field | Value |
|---|---|
| Branch | main |
| Build Command | *(leave empty)* |
| Publish Directory | `.` (dot = root folder) |

- Click **Deploy Site**
- Wait 1 minute
- Your site URL: `https://random-name.netlify.app`

### 4.3 Set Custom Site Name (Optional)
- Site Settings → General → **Change site name**
- Enter: `internhub-anant`
- Your URL becomes: `https://internhub-anant.netlify.app`

---

## STEP 5 — Update Backend CORS for Production

Open `server.js` → update CORS:
```js
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://internhub-anant.netlify.app',  // ← Add your Netlify URL
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```
Then push to GitHub → Render auto-redeploys.

---

## STEP 6 — Final Verification Checklist

```
✅ MongoDB Atlas cluster running
✅ Backend deployed on Render → https://internhub-api.onrender.com
✅ Frontend deployed on Netlify → https://internhub-anant.netlify.app
✅ api.js BASE_URL updated to Render URL
✅ CORS updated with Netlify URL in server.js
✅ Register a new account → works
✅ Login → redirects to dashboard
✅ Browse internships → loads from DB
✅ Post internship (recruiter) → saves to DB
✅ Apply for internship (student) → saves to DB
```

---

## 🔁 Auto-Deploy (CI/CD) — Free!

Both Netlify and Render watch your GitHub repo. Any time you:
```bash
git add .
git commit -m "Update something"
git push
```
→ **Both sites redeploy automatically within 2 minutes!**

---

## 📌 Final URLs Summary

| Service | URL |
|---|---|
| 🌐 Frontend | https://internhub-anant.netlify.app |
| ⚙️ Backend API | https://internhub-api.onrender.com |
| 🗄️ Database | MongoDB Atlas Cloud |

---

## ⚠️ Important Notes

1. **Render Free Tier** — server sleeps after 15 min of inactivity.
   First request after sleep takes ~30 seconds. Upgrade to paid to avoid this.

2. **Never push `.env` to GitHub** — add it to `.gitignore`:
   ```bash
   echo ".env" >> .gitignore
   ```
   Add environment variables directly in Render dashboard instead.

3. **MongoDB Atlas Free Tier** — 512MB storage, enough for your project.

---

*InternHub | Built by Anant Rajvanshi | Enrollment No: 23131420025*
*Web Technology (R1UC626C) | Submitted to: Ms. Isha Chopra*
