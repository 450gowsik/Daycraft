import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// Layout components
import Navbar from './components/layout/Navbar.jsx'
import Footer from './components/layout/Footer.jsx'
// Common components
import VerificationBanner from './components/common/VerificationBanner.jsx'
import HelpChatbot from './components/common/HelpChatbot.jsx'
// Routes
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import PublicRoute from './routes/PublicRoute.jsx'
// Auth pages
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import CompleteProfile from './pages/auth/CompleteProfile.jsx'
// Other pages
import Home from './pages/Home.jsx'
import Jobs from './pages/Jobs.jsx'
import JobDetails from './pages/JobDetails.jsx'
import JobApplicants from './pages/JobApplicants.jsx'
import Workers from './pages/Workers.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import PostJob from './pages/PostJob.jsx'
import Chat from './pages/Chat.jsx'
import AdminDashboard from './pages/Admin.jsx'
import Wallet from './pages/Wallet.jsx'
import Notifications from './pages/Notifications.jsx'

function App() {
    const location = useLocation()
    const showNavbar = location.pathname !== '/post-job'

    return (
        <div className="app">
            <Toaster position="top-center" reverseOrder={false} />
            {showNavbar && <Navbar />}
            <VerificationBanner />
            <main className="main-content">
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/jobs" element={
                        <ProtectedRoute>
                            <Jobs />
                        </ProtectedRoute>
                    } />
                    <Route path="/jobs/:jobId" element={
                        <ProtectedRoute>
                            <JobDetails />
                        </ProtectedRoute>
                    } />
                    <Route path="/jobs/:jobId/applicants" element={
                        <ProtectedRoute>
                            <JobApplicants />
                        </ProtectedRoute>
                    } />
                    <Route path="/workers" element={
                        <ProtectedRoute>
                            <Workers />
                        </ProtectedRoute>
                    } />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    {/* Protected routes - require authentication */}
                    <Route path="/complete-profile" element={
                        <ProtectedRoute>
                            <CompleteProfile />
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    } />
                    <Route path="/chat" element={
                        <ProtectedRoute>
                            <Chat />
                        </ProtectedRoute>
                    } />
                    <Route path="/wallet" element={
                        <ProtectedRoute>
                            <Wallet />
                        </ProtectedRoute>
                    } />
                    <Route path="/post-job" element={
                        <ProtectedRoute roles={['employer', 'admin']}>
                            <PostJob />
                        </ProtectedRoute>
                    } />
                    <Route path="/notifications" element={
                        <ProtectedRoute>
                            <Notifications />
                        </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />
                </Routes>
            </main>
            <Footer />

            {/* Global Help Chatbot */}
            <HelpChatbot />
        </div>
    )
}

export default App

