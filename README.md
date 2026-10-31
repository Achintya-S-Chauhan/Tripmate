# TripMate — Smart Travel, Multi-Modal Mobility & Emergency Safety Companion

**TripMate** is a full-stack MERN (MongoDB Atlas, Express.js, React, Node.js) web application engineered for modern explorers and designed as an academic student major project. It combines deep navy travel-tech styling with structured multi-modal trip chaining, carbon analytics (UK DEFRA 2024 standards), Leaflet route plotting, geofenced safe zones, and simulated emergency distress beacons with JWT-protected cloud accounts.

> ⚠️ **Demonstration Notice**: TripMate operates in a dual mode. When connected to MongoDB Atlas, all user accounts, trips, saved safe zones, and ICE contacts persist to the cloud. When exploring in **Demo Mode**, all GPS telemetry, transit statuses, and emergency SOS triggers are client-side simulations. TripMate does **NOT** contact live police lines (911/110/112) or dispatch real cellular SMS messages.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 (JavaScript / JSX)
- **Build Tool**: Vite 8 with Rolldown code-splitting
- **Styling**: Tailwind CSS v4 + Custom Dark Navy Design Tokens
- **Icons**: Lucide React
- **Data Visualizations**: Recharts (`AreaChart`, `BarChart`, `PieChart`)
- **Mapping**: Leaflet 1.9 with CartoDB Voyager / OpenStreetMap tiles + Offline Vector Schematic Fallback
- **Micro-Interactions**: Canvas Confetti
- **Deployment**: Vercel Single Page App (SPA) Configuration (`vercel.json`)

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 5 (REST API)
- **Database**: MongoDB Atlas via Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) + Bcrypt.js password hashing
- **Middleware**: CORS (configured for client origins), custom authentication guard, centralized error handler

---

## 📁 System Architecture & Directory Layout

```text
Tripmate/
├── backend/                        # Node.js + Express.js REST API
│   ├── config/
│   │   └── db.js                   # Mongoose connection & connection state helper
│   ├── controllers/
│   │   ├── authController.js       # Register, login, current profile, starter seed
│   │   ├── journeyController.js    # Multi-modal trip chains & segment CRUD
│   │   ├── savedPlaceController.js # Geofence safe zones CRUD
│   │   └── trustedContactController.js # ICE emergency contacts CRUD
│   ├── middleware/
│   │   ├── auth.js                 # JWT Bearer token verification middleware
│   │   └── errorHandler.js         # Centralized error handler (validation, CastError, JWT)
│   ├── models/
│   │   ├── User.js                 # User schema with bcrypt pre-save hook & safe JSON
│   │   ├── Journey.js              # Journey schema with embedded TripSegmentSchema
│   │   ├── SavedPlace.js           # Safe zone schema (lat, lng, radius, category)
│   │   └── TrustedContact.js       # ICE emergency contact schema
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth routes
│   │   ├── journeyRoutes.js        # /api/journeys routes (protected)
│   │   ├── savedPlaceRoutes.js     # /api/saved-places routes (protected)
│   │   └── trustedContactRoutes.js # /api/trusted-contacts routes (protected)
│   ├── .env.example                # Backend environment template
│   ├── package.json                # Backend dependencies (express, mongoose, bcryptjs, jwt)
│   └── server.js                   # Express application entry point & health check
│
├── src/                            # React 19 Frontend
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthModal.jsx       # Modal for Sign In, Registration, & Demo Fast-Fill
│   │   ├── common/
│   │   │   ├── DemoBanner.jsx      # Live Cloud Sync / Demo Mode status banner
│   │   │   ├── Modal.jsx           # Reusable animated modal
│   │   │   ├── QuickSearchModal.jsx# Global Cmd+K / Ctrl+K search jump
│   │   │   ├── SosModal.jsx        # 5-second countdown accidental-trigger guard
│   │   │   └── Toast.jsx           # Floating non-blocking feedback toasts
│   │   ├── landing/
│   │   │   └── LandingPage.jsx     # Public project landing page & feature showcase
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx       # Global responsive shell
│   │   │   ├── Sidebar.jsx         # Collapsible desktop sidebar with auth actions
│   │   │   ├── TopBar.jsx          # Header with user avatar, ping, & search
│   │   │   └── MobileNav.jsx       # Mobile drawer + floating bottom bar
│   │   └── map/
│   │       └── InteractiveMap.jsx  # Leaflet map with geofence perimeters & offline SVG fallback
│   ├── context/
│   │   └── AppContext.jsx          # Dual-mode state manager (MongoDB Cloud + local fallback)
│   ├── data/
│   │   └── mockData.js             # Presentation seed data & DEFRA emission benchmarks
│   ├── pages/
│   │   ├── OverviewPage.jsx        # Dashboard with start/end journey, map, & metrics
│   │   ├── JourneysPage.jsx        # Trip chains library with filters, search, & modals
│   │   ├── TripDetailsPage.jsx     # Multi-modal segment timeline, packing, & expenses
│   │   ├── TravelInsightsPage.jsx  # Recharts emissions analytics & CSV activity export
│   │   ├── SafetyCenterPage.jsx    # ICE Vault, consular directory, & SOS simulation
│   │   ├── SavedPlacesPage.jsx     # Geofencing perimeters & entry/exit simulations
│   │   └── SettingsPage.jsx        # Units, preferences, JSON export, & seed reset
│   ├── services/
│   │   └── api.js                  # Frontend REST API client service with Bearer tokens
│   ├── App.jsx                     # Root application router (Landing vs Dashboard)
│   └── main.jsx                    # Entry point mounting AppProvider
│
├── .env.example                    # Frontend environment template (VITE_API_URL)
├── .gitignore                      # Git exclusion rules (.env, node_modules, dist, .vercel)
├── package.json                    # Root package scripts (dev, build, backend, preview)
├── vercel.json                     # Vercel SPA routing rewrite rules & security headers
└── vite.config.js                  # Vite bundler config with chunk manual splitting
```

---

## 🚀 Step-by-Step Local Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **npm**: v9.0.0 or higher (`npm -v`)
- **MongoDB Atlas Account**: (Free M0 Cluster) or a local MongoDB instance

---

### 2. Backend Setup & Configuration

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```

2. Create your `.env` configuration file from the template:
   ```bash
   cp .env.example .env
   ```

3. Open `backend/.env` and configure your credentials:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/tripmate?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here_at_least_32_characters
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```

   > **Setting up MongoDB Atlas (Free Tier)**:
   > 1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
   > 2. Create a free **M0 Sandbox** cluster.
   > 3. Under **Security $\rightarrow$ Database Access**, add a user with read/write access.
   > 4. Under **Security $\rightarrow$ Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere).
   > 5. Click **Connect $\rightarrow$ Drivers $\rightarrow$ Node.js** to copy your connection string.

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:5000`. You can verify it by opening `http://localhost:5000/api/health` in your browser.*

---

### 3. Frontend Setup & Configuration

1. In the project root directory, install dependencies:
   ```bash
   npm install
   ```

2. Create your `.env` configuration file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *By default, `VITE_API_URL=http://localhost:5000/api`.*

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173/` in your browser.*

---

### 4. Running Both with Root Scripts
From the project root:
- Run backend: `npm run backend` (or `npm run backend:dev` for live reload)
- Run frontend: `npm run dev`

---

## 📡 REST API Reference

All protected endpoints require the HTTP header:  
`Authorization: Bearer <your_jwt_token>`

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user (`name`, `email`, `password`, `homeCity`). Auto-seeds starter journey & contacts. |
| `POST` | `/api/auth/login` | Public | Sign in with `email` and `password`. Returns JWT token. |
| `GET` | `/api/auth/me` | Protected | Returns profile of currently authenticated user. |
| `PUT` | `/api/auth/profile` | Protected | Update profile metadata or companion settings. |

### Journeys & Trip Chains (`/api/journeys`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/journeys` | Protected | List all journeys owned by the authenticated user. |
| `POST` | `/api/journeys` | Protected | Create a new journey with automatic segment & emission calculations. |
| `GET` | `/api/journeys/:id` | Protected | Get journey details by ID (validates ownership). |
| `PUT` | `/api/journeys/:id` | Protected | Update journey metadata, budget, or waypoints. |
| `DELETE` | `/api/journeys/:id` | Protected | Delete journey (validates ownership). |
| `POST` | `/api/journeys/:id/segments` | Protected | Add a new transit leg (walk, bus, train) to a journey chain. |
| `PUT` | `/api/journeys/:id/segments/:segmentId` | Protected | Update segment details or telemetry. |
| `DELETE` | `/api/journeys/:id/segments/:segmentId` | Protected | Delete segment from trip chain. |

### Saved Safe Zones (`/api/saved-places`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/saved-places` | Protected | Get all saved places/safe havens for the current user. |
| `POST` | `/api/saved-places` | Protected | Create safe haven with name, category, radius, and coordinates. |
| `PUT` | `/api/saved-places/:id` | Protected | Update safe zone parameters. |
| `DELETE` | `/api/saved-places/:id` | Protected | Delete safe zone. |

### Trusted Emergency Contacts (`/api/trusted-contacts`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/trusted-contacts` | Protected | List user's ICE contacts. |
| `POST` | `/api/trusted-contacts` | Protected | Add emergency contact (`name`, `relation`, `phone`, `email`). |
| `PUT` | `/api/trusted-contacts/:id` | Protected | Update contact information. |
| `DELETE` | `/api/trusted-contacts/:id` | Protected | Remove contact from ICE directory. |

### Server Health Check (`/api/health`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns server uptime, database status, and API health. |

---

## 🔒 Security & Data Isolation Architecture

1. **Password Hashing**: Passwords are never stored in plaintext. Mongoose pre-save hook salts and hashes passwords using `bcryptjs` (salt rounds = 10).
2. **Multi-Tenant Ownership Isolation**: Every Journey, SavedPlace, and TrustedContact document carries a reference to the owner: `user: { type: ObjectId, ref: 'User' }`.
   - All controller queries explicitly enforce:
     ```javascript
     const journey = await Journey.findOne({ _id: req.params.id, user: req.user._id });
     ```
   - Attempting to access, edit, or delete another user's journey returns `404 Not Found / Access Denied`.
3. **CORS Whitelist**: Configured to restrict origins to your frontend deployment domain and local development ports.
4. **Environment Isolation**: Database connection strings and JWT secrets are kept strictly in `.env` files and omitted from version control.

---

## 🌟 Dual Mode Operation (Cloud vs Demo Mode)

- **Cloud Mode (Authenticated)**:
  - Users sign in or register through the clean Auth Modal.
  - State is loaded dynamically from MongoDB Atlas via REST endpoints.
  - Additions, updates, and deletions sync to the database in real-time.
  - The top status banner displays `CLOUD SYNCED: <email>`.
- **Demo / Standby Mode**:
  - Available for evaluation if MongoDB Atlas credentials are not yet configured.
  - Users can click **"Explore Demo"** on the Landing Page to interact with rich pre-seeded multi-modal journeys (Kyoto, Swiss Alps, Amalfi Coast, Reykjavik).
  - All features (Recharts emissions, Leaflet map, geofencing entry/exit simulation, and accidental-activation SOS countdown) remain functional.

---

## ☁️ Deployment Guide

### Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Configure the environment variable in Vercel:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://tripmate-api.onrender.com/api`).
4. Vercel automatically detects Vite and reads [`vercel.json`](file:///c:/Users/achin/.vscode/Tripmate/vercel.json) to handle single-page app routing.

### Backend Deployment (Render / Railway / Fly.io)
1. In your host dashboard, create a new Web Service pointing to the `backend/` directory.
2. Build Command: `npm install`
3. Start Command: `node server.js`
4. Set Environment Variables:
   - `PORT`: `5000` (or host-assigned port)
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string (at least 32 characters)
   - `CLIENT_URL`: Your Vercel frontend URL (e.g. `https://tripmate.vercel.app`)

---

## ⚖️ Ethical Disclaimers & Project Transparency

- **Student Project Evaluation**: TripMate was engineered as a comprehensive demonstration of travel mobility, carbon accounting, and safety interface design.
- **Simulated Emergency Systems**: The SOS feature executes a client-side simulated beacon workflow. It does not interface with national emergency dispatch operators (911/110/112) or carrier SMS networks.
- **Sensor Telemetry**: Transit paths and waypoints are curated geographical models; no background device sensor tracking or surveillance is conducted.
