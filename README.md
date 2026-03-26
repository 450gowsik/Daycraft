# DayCraft - Daily-Wage Labour Platform

DayCraft is a MERN-style platform for connecting daily-wage workers and employers with bilingual support, role-based access, location-aware job discovery, chat, notifications, and wallet/payment flows.

## Main Documentation

The main project documentation is here:

- [Overall Documentation](docs/DAYCRAFT_OVERVIEW.md)
- [EC2 Deployment Guide](DEPLOY_EC2.md)

## Project Structure

```text
daycraft/
|-- frontend/   React + Vite frontend
|-- backend/    Node.js + Express API
|-- deploy/     Deployment scripts
`-- docs/       Project documentation
```

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at `http://localhost:5000`

## Tech Stack

- Frontend: React 18, Vite, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT, bcrypt, OTP, Google sign-in
- Payments: Razorpay
- Messaging / Notifications: custom backend modules

## License

MIT
