# 🎓 Assignment Management System (AMS) — MERN Stack

A full-stack web application for managing assignments between teachers and students.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + Vite + React Router v6   |
| Backend  | Node.js + Express.js                |
| Database | MongoDB (Mongoose ODM)              |
| Auth     | JWT (JSON Web Tokens) + bcryptjs    |
| Uploads  | Multer (local file storage)         |

---

## Features

### Teacher
- Register / Login
- Create, edit, delete assignments (with optional file attachment)
- View all submissions per assignment
- Grade submissions with marks + feedback
- Dashboard with stats (total, active, pending, graded)

### Student
- Register / Login
- Browse all active assignments
- Submit assignments (text + optional file upload)
- View grades and teacher feedback
- Dashboard with personal stats and average score

---

## Project Structure

```
AMS/
├── backend/
│   ├── models/          # Mongoose schemas (User, Assignment, Submission)
│   ├── routes/          # Express routes (auth, assignments, submissions, users)
│   ├── middleware/       # JWT auth guard, Multer upload
│   ├── uploads/         # Uploaded files (auto-created)
│   ├── server.js        # Express app entry point
│   ├── .env             # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/         # Axios instance with interceptors
    │   ├── context/     # AuthContext (JWT + user state)
    │   ├── pages/       # All page components
    │   ├── components/  # Layout, Sidebar
    │   ├── App.jsx      # Router + protected routes
    │   └── index.css    # Global dark-theme styles
    ├── index.html
    └── package.json
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (or MongoDB Atlas)

---

## Setup & Run

### 1. Clone / open the project

### 2. Backend

```bash
cd AMS/backend
npm install
```

Edit `.env` if needed (default works with local MongoDB):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/assignmentDB
JWT_SECRET=ams_jwt_secret_key_2024_change_in_production
JWT_EXPIRES_IN=7d
```

Start the backend:
```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start        # production
```

Backend runs at: **http://localhost:5000**

### 3. Frontend

```bash
cd AMS/frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Usage

1. Open **http://localhost:5173**
2. Click **Create one** to register
3. Choose your role: **Teacher** or **Student**
4. Password rules: 6–12 characters, must include a–z, A–Z, and 0–9

### Teacher flow
1. Login → Dashboard shows your stats
2. Go to **Assignments** → **New Assignment**
3. Fill in title, subject, due date, marks, description (+ optional file)
4. Click **Submissions** on any assignment to view and grade student work

### Student flow
1. Login → Dashboard shows available assignments and your scores
2. Go to **Assignments** → click any assignment → **Submit Assignment**
3. Write your answer and/or upload a file
4. Check **My Submissions** to see grades and feedback

---

## API Endpoints

| Method | Endpoint                              | Access         | Description                  |
|--------|---------------------------------------|----------------|------------------------------|
| POST   | /api/auth/register                    | Public         | Register new user            |
| POST   | /api/auth/login                       | Public         | Login                        |
| GET    | /api/auth/me                          | Private        | Get current user             |
| GET    | /api/assignments                      | Private        | List assignments             |
| POST   | /api/assignments                      | Teacher        | Create assignment            |
| PUT    | /api/assignments/:id                  | Teacher (own)  | Update assignment            |
| DELETE | /api/assignments/:id                  | Teacher (own)  | Delete assignment            |
| GET    | /api/assignments/:id/submissions      | Teacher (own)  | List submissions             |
| POST   | /api/submissions                      | Student        | Submit assignment            |
| GET    | /api/submissions/my                   | Student        | My submissions               |
| PUT    | /api/submissions/:id/grade            | Teacher        | Grade a submission           |
| GET    | /api/users/stats                      | Private        | Dashboard stats              |
| PUT    | /api/users/profile                    | Private        | Update name                  |
| PUT    | /api/users/change-password            | Private        | Change password              |

---

## Notes

- Uploaded files are stored in `backend/uploads/` (max 10MB per file)
- Allowed file types: PDF, DOC, DOCX, JPG, PNG, TXT, ZIP
- Late submissions are automatically flagged when submitted after the due date
- One submission per student per assignment (enforced at DB level)
