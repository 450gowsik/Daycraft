# DayCraft

DayCraft is a bilingual daily-wage labour platform built to connect workers and employers through a fast, location-aware web experience. The project focuses on reducing friction in informal hiring by combining job discovery, profile management, OTP-based onboarding, chat, notifications, and payment workflows in one product.

This repository shows how the project was structured end to end, from the React frontend to the Node.js backend, MongoDB data layer, authentication flow, and production-ready scaling direction.

## 1. Introduction

The goal behind DayCraft is simple: make local hiring more trustworthy, discoverable, and easier to manage for both sides of the marketplace.

Instead of relying on scattered phone calls, manual follow-ups, and unverified job leads, DayCraft brings the full workflow into one platform:

- workers can register, complete profiles, browse nearby jobs, apply, chat, and track activity
- employers can post jobs, review applicants, hire workers, and manage job-related actions
- admins can monitor platform activity and maintain quality control

The project is built as a practical full-stack application first, with clear boundaries that also make it ready for future scaling.

## 2. Architecture Overview

DayCraft follows a classic 3-tier web architecture:

1. Presentation layer: a React single-page application for workers, employers, and admins
2. Application layer: a Node.js + Express API handling business rules, authentication, payments, chat, notifications, and role-based access
3. Data layer: MongoDB for persistent application data

### Data Flow

```text
Browser
  |
  v
React + Vite SPA
  |
  v
REST API calls via Axios
  |
  v
Express controllers + services
  |
  v
MongoDB
```

### Current Architecture Decision

Although the backend is often best described as a modular monolith in its current form, it is intentionally organized with service boundaries such as:

- authentication and user management
- jobs and applications
- workers and employers
- chat and notifications
- payments
- admin controls

This keeps the current codebase easier to develop and debug, while still leaving a clean path for future microservice extraction if scale demands it.

## 3. 🏗️ Architecture & Tech Stack

### Frontend

React.js is used for single-page application development. It makes the interface component-driven and responsive, so users can move between job listings, worker profiles, dashboards, chat, and auth screens without full page reloads.

The frontend is built with:

- React 18 for reusable, stateful UI components
- Vite for fast local development and optimized production builds
- React Router for client-side navigation between public and protected routes
- Context API for shared app state such as authentication, jobs, workers, notifications, and language
- Axios for API communication
- React Leaflet for location-based interaction and map workflows
- Custom CSS for page-level and component-level styling

Why this works well:

- React keeps UI logic modular and easier to maintain
- Vite improves developer speed with quick startup and hot reload
- Router-based navigation keeps the product feeling app-like
- Context API is enough for this app's shared state without adding Redux-level complexity
- Custom CSS keeps styling straightforward and flexible for this project

## 4. Frontend Breakdown

The frontend is designed around user flows rather than static pages. Core areas include:

- authentication: email, phone OTP, and Google sign-in flows
- job discovery: listings, job details, recommendations, and applications
- worker discovery: profile browsing and worker preference flows
- employer tools: job posting, applicant review, and dashboard actions
- shared UX: notifications, verification prompts, map/location helpers, and chatbot assistance

Important frontend choices:

- React Router protects sensitive pages like dashboard, profile, chat, wallet, post-job, and admin
- Context providers centralize state for auth, jobs, workers, notifications, and language
- bilingual support improves accessibility for real users in a regional labour marketplace
- reusable layout and common components keep the UI consistent across the app

## 5. Backend

Node.js powers the backend, with Express handling routing and HTTP middleware. The current implementation is a single backend service, but it is structured with clear domain separation so it can evolve toward independently deployable services later.

The backend currently covers:

- user registration, login, token refresh, and profile lifecycle
- OTP authentication and Google OAuth
- job posting, discovery, and application handling
- worker and employer profile management
- chat and messaging APIs
- notifications
- admin routes
- Razorpay payment workflows

Backend technology decisions:

- Node.js was chosen for its event-driven model and strong JavaScript ecosystem
- Express keeps the API lightweight and easy to organize by route, controller, middleware, and service layers
- JWT is used for authentication and protected route access
- bcrypt is used for secure credential handling
- Razorpay supports payment and escrow-style marketplace flows
- Twilio and OTP utilities support phone verification and safer onboarding
- Google OAuth reduces sign-up friction and improves login convenience

### Microservice-Ready Direction

If DayCraft grows further, the cleanest service split would be:

- User Service: registration, login, refresh tokens, profiles, and roles
- Job Service: job posts, applications, and hiring flow
- Communication Service: chat and notifications
- Payment Service: order creation, release flow, and transaction history

REST APIs are already the communication model between frontend and backend, so moving to service-to-service REST would be a natural next step.

## 6. Database & Cache

### MongoDB

MongoDB is the primary database for DayCraft. A document model fits this product well because the platform stores several different data shapes:

- user accounts with roles and verification state
- worker and employer profiles
- job posts with nested location and metadata
- applications, notifications, payments, and messages

That flexibility makes MongoDB a strong choice for a marketplace product where entities evolve quickly during development.

### Redis

Redis is not part of the current committed codebase yet, but it is the next natural improvement for production scale.

The most practical Redis use cases for DayCraft would be:

- caching hot job feeds and frequently requested dashboard data
- storing short-lived OTP or cooldown data
- handling background queues for alerts, reminders, or payment-related events
- reducing repeated database load during traffic spikes

In other words, MongoDB handles durable business data, while Redis would be the right companion for speed, short-lived state, and queue-based workloads.

## 7. DevOps & Deployment

DayCraft is structured so it can be containerized and deployed cleanly as it grows.

### Docker

Docker is the most practical packaging layer for this project because it keeps runtime dependencies consistent across local development, testing, and deployment. The repository already includes backend containerization support, and the app structure is ready for expanding that into a full multi-container setup.

The ideal container split is:

- frontend container for the SPA build and web serving
- backend container for the Express API
- MongoDB container or managed database connection
- Redis container when caching and queues are introduced

### Kubernetes

Kubernetes is not required for the current project size, but it becomes valuable if DayCraft evolves into several independent services and needs:

- self-healing deployments
- rolling updates
- horizontal scaling
- better service discovery and traffic control

For the current stage, it is best viewed as a future scaling option rather than a present dependency.

### AWS ECS / EC2 / ECR

AWS is a strong deployment fit for DayCraft because it supports the product lifecycle from simple hosting to more mature container operations.

- EC2 is a practical starting point for a low-cost single-instance deployment
- ECR is the right place to store versioned Docker images
- ECS is the cleanest managed path for running containerized frontend and backend services without maintaining a full orchestration stack manually

This gives the project a realistic production path:

1. start on EC2 for simplicity
2. move images to ECR
3. run services through ECS as the platform matures

## 8. CI/CD

GitHub Actions is the best fit for automating DayCraft's build and deployment pipeline because the source code already lives on GitHub and the workflow is straightforward to version with the project.

The ideal CI/CD pipeline for this project is:

1. trigger on push to `main` or `master`
2. install dependencies
3. run linting and build checks
4. build fresh Docker images for frontend and backend
5. push tagged images to Docker Hub or Amazon ECR
6. deploy the updated image to ECS or the chosen hosting target

That creates a clean push-to-production workflow with repeatable releases and less manual deployment risk.

## 9. Security

Security-sensitive flows in DayCraft are built around layered protection:

- JWT-based authentication for protected API access
- role-based access control for worker, employer, and admin routes
- OTP verification for phone-based onboarding
- Google OAuth support for secure federated sign-in
- bcrypt for password hashing
- CORS configuration to restrict allowed origins
- Razorpay integration for safer payment handling and verifiable order flow

For production hardening, the platform should also run behind HTTPS, use strong environment-managed secrets, and move short-lived operational state to infrastructure better suited for scale.

## 10. Summary Table

| Layer | Technology | Status | Why It Was Chosen |
| --- | --- | --- | --- |
| Frontend UI | React 18 | Current | Component-based SPA architecture with good maintainability |
| Frontend Tooling | Vite | Current | Fast dev server and efficient production builds |
| Routing | React Router | Current | Clean client-side navigation and route protection |
| Shared State | Context API | Current | Lightweight global state for auth, jobs, workers, notifications, and language |
| Styling | Custom CSS | Current | Flexible styling without adding utility-framework overhead |
| Maps / Location | React Leaflet | Current | Supports location-aware job and worker workflows |
| Backend Runtime | Node.js | Current | Strong ecosystem and good fit for JavaScript full-stack development |
| API Framework | Express | Current | Simple, modular routing and middleware composition |
| Database | MongoDB + Mongoose | Current | Flexible document model for diverse marketplace entities |
| Authentication | JWT + bcrypt | Current | Secure session handling and credential protection |
| Social Login | Google OAuth | Current | Lower-friction login experience |
| Phone Verification | OTP + Twilio utilities | Current | Adds trust and safer onboarding |
| Payments | Razorpay | Current | Practical fit for marketplace payment workflows |
| Caching / Queues | Redis | Planned | Better performance, short-lived state, and background job handling |
| Containerization | Docker | Partial / Planned | Consistent runtime packaging across environments |
| Orchestration | Kubernetes | Future Scale Option | Useful only when service count and traffic justify it |
| Cloud Deployment | AWS EC2 / ECS / ECR | Planned Production Path | Clear and scalable AWS-native deployment route |
| CI/CD | GitHub Actions | Planned | Automated build, image push, and deployment workflow |

## 11. Project Structure

```text
daycraft/
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- translations/
|   `-- package.json
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   `-- package.json
|-- Dockerfile
`-- README.md
```

## 12. Quick Start

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

## 13. Conclusion

DayCraft is a full-stack marketplace application designed with real product flows in mind: verified onboarding, role-aware experiences, job discovery, communication, and payments. The current implementation is intentionally practical, while the architecture leaves room for future growth into Redis-backed caching, containerized multi-service deployment, and automated cloud delivery.

This README is meant to show not just what technologies were used, but why those choices fit the problem the project is solving.
