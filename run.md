# Running the Project for the First Time

This project is set up as an npm workspace containing both the `client` (React) and `server` (Node/Express).

## Prerequisites
- Node.js installed
- MongoDB installed and running locally, or a MongoDB Atlas URI
- Cloudinary account (for file uploads)

## 1. Install Dependencies
From the root directory (`Skill`), run the following command to install dependencies for both the client and server:
```bash
npm install
```

## 2. Set up Environment Variables

### Server
1. Navigate to the `server` directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp server/.env.example server/.env
   ```
3. Open `server/.env` and fill in your MongoDB URI, JWT Secret, and Cloudinary credentials.

### Client
1. Navigate to the `client` directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp client/.env.example client/.env
   ```
3. Open `client/.env` and ensure the `VITE_API_URL` is pointing to your server (usually `http://localhost:5000/api`).

## 3. Run the Development Server
From the root directory (`Skill`), start both the frontend and backend concurrently:
```bash
npm run dev
```

- The **Client** will run on `http://localhost:5173`
- The **Server** will run on `http://localhost:5000`