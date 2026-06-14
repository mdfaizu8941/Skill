# Skill Bartering System

A full-stack MERN platform for peer-to-peer skill exchange and career development, built for students to barter skills, track evidence, get AI-powered gap analysis, and connect with mentors.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcryptjs, RBAC middleware |
| Real-time | Socket.IO |
| AI | Groq SDK (LLM-powered gap analysis & roadmaps) |
| File Storage | Cloudinary, Multer |
| Charts | Recharts |

---

## Features

### Student
- Dashboard with quick-action cards and skill stats
- Skill marketplace — browse, post, and manage skill listings
- Barter system — send/receive skill exchange requests
- Real-time messaging with read state tracking
- Upload skill evidence (files/links) for mentor review
- AI-powered gap analysis against target career roles
- AI-generated learning roadmaps
- Resume parser — extract skills from uploaded PDF resumes
- Profile management with skill portfolio
- Ratings and feedback after completed exchanges
- Notifications for exchanges, messages, and evidence reviews

### Mentor
- Dashboard with assigned student overview
- Review and approve/reject student skill evidence
- Notifications for new evidence submissions

### Admin
- User management — view, role assignment, account control
- Career role catalog management
- Audit log viewer for system activity

---

## Project Structure

```
/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Shared UI primitives
│   │   │   ├── layout/      # Navbar, Footer, Sidebar
│   │   │   └── ui/          # Reusable UI components (Card, Button, etc.)
│   │   ├── context/         # AuthContext, NotificationContext
│   │   ├── hooks/           # useAuth, useRole, useAsync, useNotifications
│   │   ├── pages/
│   │   │   ├── admin/       # AdminDashboard, UserManagement, AuditLogs, RoleCatalog
│   │   │   ├── mentor/      # MentorDashboard, EvidenceReview, AssignedStudents
│   │   │   ├── officer/     # (Placement officer views)
│   │   │   ├── public/      # Login, Register, Landing
│   │   │   └── student/     # Dashboard, GapAnalysis, Roadmap, SkillsEvidence,
│   │   │                    # ResumeParser, MyProfile, CareerRoles, Barter
│   │   ├── routes/          # AppRoutes, AdminRoutes, MentorRoutes, StudentRoutes
│   │   ├── services/        # API service modules per feature
│   │   ├── styles/          # Global CSS / Tailwind config
│   │   └── utils/           # Helper utilities
│   └── vite.config.js
│
├── server/                  # Express API
│   └── src/
│       ├── config/          # cloudinary.js, multerCloudinary.js
│       ├── controllers/     # Route handlers per feature
│       ├── middleware/       # auth.js (JWT), rbac.js (roles), auditLogger.js
│       ├── models/          # Mongoose schemas (see below)
│       ├── routes/          # Express routers per feature
│       ├── services/        # Business logic layer
│       ├── utils/           # Shared utilities
│       ├── seed.js          # Database seeder
│       └── app.js           # Express app setup
│
├── package.json             # Root workspace config (npm workspaces)
├── requirements.md          # Human-readable dependency reference
└── .gitignore
```

### Database Models

| Model | Purpose |
|---|---|
| `User` | Auth, roles (student / mentor / admin / officer) |
| `StudentProfile` | Extended student info, skills portfolio |
| `Skill` | Skill listings for marketplace |
| `Exchange` | Barter requests and status |
| `Message` | Real-time messages per conversation |
| `Conversation` | Message thread between two users |
| `Rating` | Post-exchange feedback |
| `SkillEvidence` | Evidence uploads awaiting mentor review |
| `GapReport` | AI-generated gap analysis results |
| `Roadmap` | AI-generated learning roadmaps |
| `CareerRole` | Career role definitions with required skills |
| `AuditEvent` | Admin audit log entries |

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** (local or Atlas)
- **Cloudinary** account
- **Groq** API key

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd Skill

# 2. Install all dependencies for all workspaces
npm install

# 3. Set up environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# Fill in the values in both .env files

# 4. (Optional) Seed the database
node server/src/seed.js

# 5. Start both client and server
npm run dev
```

- **Client** runs at: `http://localhost:5173`
- **API** runs at: `http://localhost:5000`

---

## Environment Variables

### `server/.env`

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | JWT expiry (e.g. `7d`) |
| `CLIENT_ORIGIN` | Frontend URL for CORS (e.g. `http://localhost:5173`) |
| `NODE_ENV` | `development` or `production` |
| `GROQ_API_KEY` | Groq API key for AI features |
| `GROQ_MODEL_LARGE` | Groq model ID for heavy tasks |
| `GROQ_MODEL_FAST` | Groq model ID for fast tasks |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

### `client/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL (e.g. `http://localhost:5000/api`) |
| `VITE_SOCKET_URL` | Socket.IO server URL (e.g. `http://localhost:5000`) |

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register a new user |
| `POST` | `/login` | Login and receive JWT |
| `GET` | `/me` | Get current authenticated user |

### Skills — `/api/skills`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get all skill listings (marketplace) |
| `GET` | `/mine` | Get current user's skill listings |
| `POST` | `/` | Create a new skill listing |
| `PUT` | `/:id` | Update a skill listing |
| `DELETE` | `/:id` | Delete a skill listing |

### Exchanges — `/api/exchanges`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Create an exchange request |
| `GET` | `/` | Get exchanges for current user |
| `PATCH` | `/:id` | Update exchange status (accept/reject/complete) |

### Messages — `/api/messages`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get all conversations |
| `GET` | `/:conversationId` | Get messages in a conversation |
| `POST` | `/` | Send a message |
| `PATCH` | `/:id/read` | Mark message as read |

### Ratings — `/api/ratings`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get ratings |
| `POST` | `/` | Submit a rating |

### Analytics — `/api/analytics`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/summary` | Get analytics summary |

### Profile — `/api/profile`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get student profile |
| `PUT` | `/` | Update student profile |

### Evidence — `/api/evidence`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Upload skill evidence |
| `GET` | `/` | Get evidence for current user |
| `GET` | `/pending` | Get all pending evidence (mentor) |
| `PATCH` | `/:id/review` | Approve/reject evidence (mentor) |

### Gap Analysis — `/api/gap`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Run AI gap analysis against a career role |
| `GET` | `/` | Get gap reports for current user |

### Roadmap — `/api/roadmap`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/` | Generate AI learning roadmap |
| `GET` | `/` | Get roadmaps for current user |

### Resume — `/api/resume`
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/parse` | Upload and parse a resume PDF |

### Career Roles — `/api/career-roles`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get all career roles |
| `POST` | `/` | Create a career role (admin) |
| `PUT` | `/:id` | Update a career role (admin) |
| `DELETE` | `/:id` | Delete a career role (admin) |

### Mentor — `/api/mentor`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/students` | Get assigned students |

### Admin — `/api/admin`
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | Get all users |
| `PATCH` | `/users/:id/role` | Update user role |
| `DELETE` | `/users/:id` | Delete a user |
| `GET` | `/audit-logs` | Get system audit logs |

---

## User Roles

| Role | Access |
|---|---|
| `student` | Marketplace, barter, evidence, gap analysis, roadmap, resume, profile |
| `mentor` | Evidence review, assigned students |
| `officer` | (Placement officer views) |
| `admin` | User management, role catalog, audit logs, full access |

---

## Scripts

```bash
npm run dev        # Run client + server concurrently (from root)
npm run build      # Build client for production
npm run start      # Start server in production mode
```
