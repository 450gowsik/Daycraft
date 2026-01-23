# DayCraft - Daily-Wage Labour Platform

A professional MERN stack application connecting daily-wage workers with employers, featuring bilingual support (Tamil/English) and a modern, accessible UI.

## Project Structure

```
daycraft/
├── frontend/          ← React (Vite) frontend
└── backend/           ← Node.js + Express API
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: http://localhost:5173

### Backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at: http://localhost:5000

## Features

- 🌐 **Bilingual Support**: Tamil & English languages
- 👷 **Worker Profiles**: Browse and connect with skilled workers
- 📋 **Job Listings**: Post and find daily-wage jobs
- 🔐 **Authentication**: Secure JWT-based auth
- 📱 **Responsive Design**: Works on all devices
- ✨ **Modern UI**: Glassmorphism, gradients, animations

## Tech Stack

**Frontend**: React 18, Vite, React Router, Axios  
**Backend**: Node.js, Express, MongoDB, Mongoose  
**Auth**: JWT, bcrypt

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/daycraft
JWT_SECRET=your_jwt_secret_key
```

## License

MIT
