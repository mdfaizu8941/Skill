# Requirements

This project is a **Node.js monorepo** (npm workspaces) with three packages:
- `/` — Root workspace (shared tooling)
- `/client` — React frontend (Vite)
- `/server` — Express backend (Node.js)

> Node.js is required. Recommended: **Node.js >= 18.x**, **npm >= 9.x**

---

## Root (`/package.json`)

### Dependencies
| Package | Version | Purpose |
|---|---|---|
| `cloudinary` | ^1.41.3 | Cloud image/file storage (hoisted from server) |
| `multer-storage-cloudinary` | ^4.0.0 | Multer storage adapter for Cloudinary |

### Dev Dependencies
| Package | Version | Purpose |
|---|---|---|
| `concurrently` | ^9.0.1 | Run client & server dev servers simultaneously |

---

## Client (`/client/package.json`)

### Dependencies
| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.6 | UI library |
| `react-dom` | ^19.2.6 | React DOM renderer |
| `react-router-dom` | ^7.17.0 | Client-side routing |
| `react-hook-form` | ^7.78.0 | Form state management & validation |
| `react-hot-toast` | ^2.6.0 | Toast notifications |
| `axios` | ^1.17.0 | HTTP client for API requests |
| `framer-motion` | ^12.40.0 | Animations & transitions |
| `lucide-react` | ^1.18.0 | Icon library |
| `recharts` | ^3.8.1 | Charts & data visualization |
| `date-fns` | ^4.4.0 | Date utility library |
| `socket.io-client` | ^4.8.3 | Real-time WebSocket client |

### Dev Dependencies
| Package | Version | Purpose |
|---|---|---|
| `vite` | ^8.0.12 | Frontend build tool & dev server |
| `@vitejs/plugin-react` | ^6.0.1 | Vite plugin for React (JSX, HMR) |
| `tailwindcss` | ^3.4.19 | Utility-first CSS framework |
| `postcss` | ^8.5.15 | CSS processing |
| `autoprefixer` | ^10.5.0 | CSS vendor prefix automation |
| `eslint` | ^10.3.0 | JavaScript linter |
| `eslint-plugin-react-hooks` | ^7.1.1 | ESLint rules for React hooks |
| `eslint-plugin-react-refresh` | ^0.5.2 | ESLint rules for React Fast Refresh |
| `@eslint/js` | ^10.0.1 | ESLint core JS ruleset |
| `@types/react` | ^19.2.14 | TypeScript types for React |
| `@types/react-dom` | ^19.2.3 | TypeScript types for React DOM |
| `globals` | ^17.6.0 | Global variables for ESLint |

---

## Server (`/server/package.json`)

### Dependencies
| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.21.2 | Web framework |
| `mongoose` | ^8.9.0 | MongoDB ODM |
| `dotenv` | ^16.4.5 | Environment variable loader |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `jsonwebtoken` | ^9.0.2 | JWT auth token generation & verification |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| `helmet` | ^8.2.0 | HTTP security headers |
| `morgan` | ^1.11.0 | HTTP request logger |
| `multer` | ^1.4.5-lts.1 | File upload handling (multipart/form-data) |
| `pdf2json` | ^4.0.3 | PDF parsing |
| `pdfjs-dist` | ^6.0.227 | PDF rendering & text extraction |
| `groq-sdk` | ^1.2.1 | Groq AI inference SDK |

### Dev Dependencies
| Package | Version | Purpose |
|---|---|---|
| `nodemon` | ^3.1.9 | Auto-restart server on file changes |

---

## Installation

```bash
# Install all dependencies for all workspaces from the root
npm install
```

## Running the Project

```bash
# Run both client and server in development mode
npm run dev

# Run server only
npm run dev --workspace server

# Run client only
npm run dev --workspace client

# Build client for production
npm run build

# Start server in production mode
npm start
```

## Environment Variables

Create the following `.env` files (see `.env.example` files for templates):

- `server/.env` — MongoDB URI, JWT secret, Cloudinary keys, Groq API key, etc.
- `client/.env` — Vite API base URL (`VITE_API_URL`)
