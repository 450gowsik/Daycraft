import { Routes, Route, Navigate } from 'react-router-dom'
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
    return (
        <div className="app">
            <Toaster position="top-center" reverseOrder={false} />
            <Navbar />
            <VerificationBanner />
            <main className="main-content">
                <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/jobs/:jobId" element={<JobDetails />} />
                    <Route path="/jobs/:jobId/applicants" element={
                        <ProtectedRoute>
                            <JobApplicants />
                        </ProtectedRoute>
                    } />
                    <Route path="/workers" element={<Workers />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    {/* TEMPORARILY DISABLED AUTH */}
                    <Route path="/complete-profile" element={<CompleteProfile />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/post-job" element={<PostJob />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </main>
            <Footer />

            {/* Global Help Chatbot */}
            <HelpChatbot />
        </div>
    )
}

export default App

