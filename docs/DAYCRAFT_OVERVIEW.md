# DayCraft Overall Documentation

## 1. Product Summary

DayCraft is a bilingual daily-wage labour platform that connects local workers and employers.

The current codebase includes:

- a React + Vite frontend in `frontend/`
- a Node.js + Express + MongoDB backend in `backend/`
- an EC2 Docker Compose deployment path for production

Primary use cases:

- workers browse jobs, apply, manage profile, chat, and view wallet history
- employers post jobs, view applicants, hire workers, and manage payments
- admins moderate users and jobs

## 2. High-Level Architecture

```text
Browser
  |
  v
Frontend (React + Vite + React Router)
  |
  v
/api proxy
  |
  v
Backend (Express API)
  |
  v
MongoDB
```

Production deployment currently uses:

- `frontend` container: Nginx serving the Vite build on port `80`
- `backend` container: Express API on internal port `5000`
- frontend-to-backend communication through `/api`

## 3. Repository Structure

```text
daycraft/
|-- frontend/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- context/
|   |   |-- data/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- translations/
|   |   |-- utils/
|   |   |-- App.jsx
|   |   `-- main.jsx
|   |-- Dockerfile
|   `-- nginx.conf
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- scripts/
|   |   |-- services/
|   |   |-- utils/
|   |   `-- server.js
|   `-- package.json
|-- deploy/
|   `-- ec2/
|-- docs/
|-- docker-compose.ec2.yml
|-- DEPLOY_EC2.md
`-- README.md
```

## 4. Frontend Overview

Entry files:

- `frontend/src/main.jsx`
- `frontend/src/App.jsx`

Core frontend responsibilities:

- page routing
- authentication state
- language switching
- job browsing and recommendation display
- worker browsing
- notifications, chat, and wallet UI
- profile completion and location selection

### 4.1 Frontend Routes

Defined in `frontend/src/App.jsx`.

Public routes:

- `/`
- `/jobs`
- `/jobs/:jobId`
- `/workers`
- `/login`
- `/register`

Protected routes:

- `/complete-profile`
- `/dashboard`
- `/profile`
- `/chat`
- `/wallet`
- `/post-job`
- `/notifications`
- `/admin`
- `/jobs/:jobId/applicants`

### 4.2 Important Frontend Modules

Layout:

- `components/layout/Navbar.jsx`
- `components/layout/Footer.jsx`

Shared components:

- `components/common/LocationModal.jsx`
- `components/common/LocationPicker.jsx`
- `components/common/MapPicker.jsx`
- `components/common/NotificationPanel.jsx`
- `components/common/VerificationBanner.jsx`
- `components/common/HelpChatbot.jsx`
- `components/common/Toast.jsx`

State and providers:

- `context/AuthContext.jsx`
- `context/JobContext.jsx`
- `context/WorkerContext.jsx`
- `context/NotificationContext.jsx`
- `context/LanguageContext.jsx`

Pages:

- `pages/Home.jsx`
- `pages/Jobs.jsx`
- `pages/JobDetails.jsx`
- `pages/JobApplicants.jsx`
- `pages/Workers.jsx`
- `pages/Dashboard.jsx`
- `pages/Profile.jsx`
- `pages/PostJob.jsx`
- `pages/Chat.jsx`
- `pages/Wallet.jsx`
- `pages/Notifications.jsx`
- `pages/Admin.jsx`
- `pages/auth/Login.jsx`
- `pages/auth/Register.jsx`
- `pages/auth/CompleteProfile.jsx`

Services:

- `services/api.js`
- `services/apiConfig.js`
- `services/authService.js`
- `services/jobService.js`
- `services/paymentService.js`
- `services/notificationService.js`
- `services/recommendationService.js`
- `services/adminService.js`

## 5. Backend Overview

Entry file:

- `backend/src/server.js`

Core backend responsibilities:

- authentication and session handling
- user, worker, and employer profile management
- job creation and discovery
- applications and hiring flow
- chat and notifications
- payment and wallet history
- admin moderation
- AI/chatbot support

### 5.1 Backend Route Groups

Configured in `backend/src/server.js`.

- `/api/auth`
- `/api/jobs`
- `/api/workers`
- `/api/categories`
- `/api/chat`
- `/api/admin`
- `/api/applications`
- `/api/notifications`
- `/api/payments`
- `/api/chatbot`

### 5.2 Main Route Files

- `backend/src/routes/auth.routes.js`
- `backend/src/routes/job.routes.js`
- `backend/src/routes/worker.routes.js`
- `backend/src/routes/application.routes.js`
- `backend/src/routes/chat.routes.js`
- `backend/src/routes/notificationRoutes.js`
- `backend/src/routes/paymentRoutes.js`
- `backend/src/routes/adminRoutes.js`
- `backend/src/routes/chatbot.routes.js`
- `backend/src/routes/category.routes.js`

### 5.3 Important Controllers

- `controllers/auth.controller.js`
- `controllers/token.controller.js`
- `controllers/otp.controller.js`
- `controllers/job.controller.js`
- `controllers/worker.controller.js`
- `controllers/application.controller.js`
- `controllers/chat.controller.js`
- `controllers/notificationController.js`
- `controllers/paymentController.js`
- `controllers/adminController.js`
- `controllers/chatbot.controller.js`

### 5.4 Main Models

- `User`
- `Worker`
- `Employer`
- `Job`
- `Application`
- `Payment`
- `Notification`
- `Message`
- `RefreshToken`
- `Otp`
- `ActivityLog`
- `WorkerPreference`

## 6. Authentication Model

DayCraft uses a unified auth model centered on the `User` collection.

Supported auth flows:

- email/password
- phone OTP
- Google sign-in
- refresh-token session continuation

Important implementation details:

- access token is used for API authorization
- refresh token is used for session renewal
- role data supports `role`, `roles`, and `activeRole`
- profile completion is enforced through frontend route protection

Related files:

- `backend/src/controllers/auth.controller.js`
- `backend/src/controllers/token.controller.js`
- `backend/src/controllers/otp.controller.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/routes/ProtectedRoute.jsx`

## 7. Core Functional Flows

### 7.1 Worker Flow

1. Register or log in
2. Complete profile and location
3. Browse jobs
4. Apply to jobs
5. Track applications in dashboard
6. Chat with employers
7. View payment history in wallet

### 7.2 Employer Flow

1. Register or log in
2. Complete profile
3. Post job
4. Review applicants or recommended workers
5. Hire and manage job progress
6. Release payment

### 7.3 Admin Flow

1. Access `/admin`
2. Review statistics
3. Manage users
4. Moderate jobs

### 7.4 Location Flow

The app supports:

- manual district/city selection
- map-based selection
- GPS when browser security allows it
- network/IP fallback when GPS is unavailable

Important limitation:

- exact browser geolocation requires `https` or `localhost`
- on insecure `http` origins, only approximate network-based location is available

Related files:

- `frontend/src/components/common/LocationModal.jsx`
- `frontend/src/components/common/LocationPicker.jsx`
- `frontend/src/components/common/MapPicker.jsx`

## 8. API Summary

This is a route-group summary, not a full OpenAPI spec.

### Auth

Examples:

- `POST /api/auth/email/start`
- `POST /api/auth/email/register`
- `POST /api/auth/login`
- `POST /api/auth/phone/send-otp`
- `POST /api/auth/phone/verify-otp`
- `POST /api/auth/google`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/profile`

### Jobs

Examples:

- `GET /api/jobs`
- `GET /api/jobs/nearby`
- `GET /api/jobs/location-matched`
- `GET /api/jobs/user/my-jobs`
- `GET /api/jobs/user/my-applications`
- `GET /api/jobs/user/recommended`
- `GET /api/jobs/:id`
- `POST /api/jobs`
- `PUT /api/jobs/:id`
- `DELETE /api/jobs/:id`
- `POST /api/jobs/:id/apply`

### Workers

Examples:

- `GET /api/workers`
- `GET /api/workers/:id`
- `GET /api/workers/profile/me`
- `PUT /api/workers/profile/me`
- `GET /api/workers/recommended/:jobId`

### Applications

Examples:

- `POST /api/applications`
- `GET /api/applications/check/:jobId`
- `GET /api/applications/my`
- `DELETE /api/applications/:id`
- `GET /api/applications/job/:jobId`
- `PATCH /api/applications/:id/status`

### Chat

- `GET /api/chat/conversations`
- `GET /api/chat/conversations/:id/messages`
- `POST /api/chat/messages`
- `POST /api/chat/start`

### Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

### Payments

- `POST /api/payments/webhook`
- `POST /api/payments/create-order`
- `POST /api/payments/release/:paymentId`
- `GET /api/payments/history`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PUT /api/admin/users/:id`
- `GET /api/admin/jobs`
- `DELETE /api/admin/jobs/:id`

### Chatbot

- `POST /api/chatbot/message`
- `GET /api/chatbot/health`

## 9. Environment Variables

### Backend

Based on `backend/.env.example` and `backend/src/config/env.js`.

Required or commonly used:

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `CORS_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `GROQ_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `FAST2SMS_API_KEY`
- `SMS_ENABLED`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `BREVO_API_KEY`
- `EMAIL_FROM`
- `EMAIL_USER`
- `EMAIL_PASS`

### Frontend

Based on `frontend/.env.example`.

- `VITE_API_URL`
- `VITE_RAZORPAY_KEY_ID`

## 10. Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

Default backend URL:

- `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL:

- `http://localhost:5173`

## 11. Production Deployment

DayCraft includes an EC2 deployment path documented in:

- `DEPLOY_EC2.md`

Relevant files:

- `docker-compose.ec2.yml`
- `deploy/ec2/setup-al2023.sh`
- `deploy/ec2/deploy.sh`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- root `Dockerfile`

Production model:

- frontend static build served through Nginx
- backend Node API behind the frontend proxy
- MongoDB configured through environment variables

## 12. Current Strengths

- clear split between frontend and backend
- bilingual support built into the UI layer
- multiple auth methods
- role-based access control
- chat, notification, payment, and admin modules already present
- deployment path for EC2 is already documented

## 13. Current Gaps / Known Limitations

- no single formal API spec yet
- no dedicated docs site yet
- geolocation accuracy on live `http` deployments is limited by browser security
- production GPS support should use `https`
- frontend production bundles are large and could benefit from more code-splitting
- current README is minimal and benefits from this fuller reference document

## 14. Recommended Next Documentation Additions

If you want to expand documentation later, the next useful docs would be:

1. API reference by endpoint
2. database schema reference
3. frontend state-management guide
4. deployment runbook with rollback steps
5. contributor onboarding guide
6. troubleshooting guide
