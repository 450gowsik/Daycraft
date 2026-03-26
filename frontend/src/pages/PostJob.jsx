/**
 * PostJob - Modern Multi-Step Job Posting Form
 * Inspired by LinkedIn Jobs & Airbnb host listing flow
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import LocationPicker from '../components/common/LocationPicker.jsx'
import jobService from '../services/jobService.js'
import { toast } from 'react-hot-toast'
import ErrorBoundary from '../components/common/ErrorBoundary.jsx'
import './PostJob.css'

// Job categories
const CATEGORIES = [
    { value: 'construction', label: 'Construction', icon: '🏗️' },
    { value: 'security', label: 'Security', icon: '🛡️' },
    { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
    { value: 'electrical', label: 'Electrical', icon: '⚡' },
    { value: 'driving', label: 'Driving', icon: '🚗' },
    { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
    { value: 'painting', label: 'Painting', icon: '🎨' },
    { value: 'carpentry', label: 'Carpentry', icon: '🪚' },
    { value: 'gardening', label: 'Gardening', icon: '🌱' },
    { value: 'cooking', label: 'Cooking', icon: '👨‍🍳' },
    { value: 'delivery', label: 'Delivery', icon: '📦' },
    { value: 'other', label: 'Other', icon: '📋' }
]

// Job types
const JOB_TYPES = [
    { value: 'daily', label: 'Daily Wage', desc: 'Pay per day worked' },
    { value: 'full-time', label: 'Full-Time', desc: 'Regular employment' },
    { value: 'contract', label: 'Contract', desc: 'Fixed duration project' }
]

// Experience levels
const EXPERIENCE_LEVELS = [
    { value: 'entry', label: 'Entry Level', desc: '0-1 years' },
    { value: 'mid', label: 'Mid Level', desc: '2-4 years' },
    { value: 'senior', label: 'Senior', desc: '5+ years' },
    { value: 'any', label: 'Any Level', desc: 'All welcome' }
]

// Payment types
const PAYMENT_TYPES = [
    { value: 'daily', label: 'Per Day' },
    { value: 'weekly', label: 'Per Week' },
    { value: 'monthly', label: 'Per Month' },
    { value: 'fixed', label: 'Fixed Amount' }
]

// Common skills
const COMMON_SKILLS = [
    'Heavy Lifting', 'Driving License', 'Power Tools', 'First Aid',
    'Welding', 'Painting', 'Plumbing', 'Electrical Work',
    'Carpentry', 'Masonry', 'Cooking', 'Cleaning',
    'Security Training', 'Customer Service', 'English Speaking', 'Computer Skills'
]

function PostJob() {
    const navigate = useNavigate()
    const { user, loading } = useAuth()
    const { language } = useLanguage()

    // Current step (1-5, step 5 is success)
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false) // Local loading state for submission
    const [errors, setErrors] = useState({})
    const [publishedJob, setPublishedJob] = useState(null)

    // Form data
    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        title: '',
        category: '',
        type: 'daily',
        // Step 2: Details
        description: '',
        location: null,
        isRemote: false,
        // Step 3: Requirements
        skills: [],
        experienceLevel: 'any',
        workersNeeded: 1,
        salary: '',
        paymentType: 'daily'
    })

    // Skill input
    const [skillInput, setSkillInput] = useState('')
    const [showSkillSuggestions, setShowSkillSuggestions] = useState(false)

    // Verify user access and redirect safely
    useEffect(() => {
        if (!loading && user) {
            // Support both new roles array and legacy role string
            const userRoles = user.roles || (user.role ? [user.role] : [])
            const hasAccess = userRoles.includes('employer') || userRoles.includes('admin')

            if (!hasAccess) {
                toast.error('Only employers can post jobs')
                navigate('/dashboard')
            }
        }
    }, [user, loading, navigate])

    // Defensive check: If loading or user invalid, show loader or return null
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="btn-loader" style={{ width: '40px', height: '40px', borderColor: '#14a800', borderTopColor: 'transparent' }}></div>
            </div>
        )
    }

    if (!user) {
        return null // Will be handled by ProtectedRoute or useEffect
    }

    // Handle input change safely
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        // Clear error for this field
        if (errors?.[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    // Handle location select safely
    const handleLocationSelect = (locationVal) => {
        setFormData(prev => ({ ...prev, location: locationVal || null }))
        if (errors?.location) {
            setErrors(prev => ({ ...prev, location: '' }))
        }
    }

    // Handle skill add safely
    const handleAddSkill = (skill) => {
        if (!skill) return
        const trimmedSkill = skill.trim()
        if (trimmedSkill && Array.isArray(formData.skills) && !formData.skills.includes(trimmedSkill)) {
            setFormData(prev => ({
                ...prev,
                skills: [...(prev.skills || []), trimmedSkill]
            }))
        }
        setSkillInput('')
        setShowSkillSuggestions(false)
    }

    // Handle skill remove safely
    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: (prev.skills || []).filter(s => s !== skillToRemove)
        }))
    }

    // Filter skill suggestions safely
    const getFilteredSuggestions = () => {
        if (!skillInput) return []
        const currentSkills = Array.isArray(formData.skills) ? formData.skills : []
        return COMMON_SKILLS.filter(
            skill => skill.toLowerCase().includes(skillInput.toLowerCase()) &&
                !currentSkills.includes(skill)
        )
    }
    const filteredSuggestions = getFilteredSuggestions()

    // Validate current step
    const validateStep = (step) => {
        const newErrors = {}

        if (step === 1) {
            if (!formData?.title?.trim()) newErrors.title = 'Job title is required'
            if (!formData?.category) newErrors.category = 'Please select a category'
        }

        if (step === 2) {
            if (!formData?.description?.trim()) newErrors.description = 'Description is required'
            if ((formData?.description?.length || 0) < 50) newErrors.description = 'Description must be at least 50 characters'
            if (!formData?.location && !formData?.isRemote) newErrors.location = 'Please select a location or mark as remote'
        }

        if (step === 3) {
            if (!formData?.salary || formData.salary <= 0) newErrors.salary = 'Please enter a valid salary'
            if ((formData?.workersNeeded || 0) < 1) newErrors.workersNeeded = 'At least 1 worker required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Go to next step
    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4))
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    // Go to previous step
    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Submit job safely
    const handleSubmit = async () => {
        if (!validateStep(3)) {
            setCurrentStep(3)
            return
        }

        setIsLoading(true)

        try {
            const jobData = {
                title: formData.title,
                category: formData.category,
                type: formData.type || 'daily',
                description: formData.description,
                location: formData.location?.displayText || (typeof formData.location === 'string' ? formData.location : ''),
                geoLocation: formData.location?.coordinates || null,
                isRemote: !!formData.isRemote,
                skills: Array.isArray(formData.skills) ? formData.skills : [],
                experienceLevel: formData.experienceLevel || 'any',
                workersNeeded: parseInt(formData.workersNeeded) || 1,
                salary: parseFloat(formData.salary) || 0,
                paymentType: formData.paymentType || 'daily',
                status: 'active'
            }

            const response = await jobService.createJob(jobData)
            setPublishedJob(response.job || { _id: 'new', ...jobData })
            setCurrentStep(5) // Go to success step
        } catch (error) {
            console.error('Post job error:', error)
            toast.error(error.response?.data?.message || 'Failed to post job')
        } finally {
            setIsLoading(false)
        }
    }

    // Share handlers
    const getJobUrl = () => {
        const jobId = publishedJob?._id || 'new'
        return `${window.location.origin}/jobs/${jobId}`
    }

    const handleCopyLink = () => {
        try {
            navigator.clipboard.writeText(getJobUrl())
            toast.success('Link copied to clipboard!')
        } catch (err) {
            toast.error('Failed to copy link')
        }
    }

    const handleShareWhatsApp = () => {
        const payLabel = PAYMENT_TYPES.find(p => p.value === formData.paymentType)?.label || ''
        const text = `Check out this job: ${formData.title} - ₹${formData.salary} ${payLabel}\n\n${getJobUrl()}`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const handleShareLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getJobUrl())}`, '_blank')
    }

    // Step indicator
    const steps = [
        { num: 1, label: 'Basic Info', icon: '📝' },
        { num: 2, label: 'Details', icon: '📋' },
        { num: 3, label: 'Requirements', icon: '✅' },
        { num: 4, label: 'Review', icon: '👁️' },
        { num: 5, label: 'Published', icon: '🎉' }
    ]

    return (
        <div className="post-job-page">
            <div className="post-job-container">
                {/* Header */}
                <div className="post-job-header">
                    <h1>Post a New Job</h1>
                    <p>Find the perfect workers for your project</p>
                </div>

                {/* Step Progress - hidden on success */}
                {currentStep < 5 && (
                    <div className="step-progress">
                        {steps.slice(0, 4).map((step, index) => (
                            <div key={step.num} className="step-item-wrapper">
                                <div
                                    className={`step-item ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}
                                    onClick={() => currentStep > step.num && currentStep < 5 && setCurrentStep(step.num)}
                                >
                                    <div className="step-circle">
                                        {currentStep > step.num ? '✓' : step.num}
                                    </div>
                                    <span className="step-label">{step.label}</span>
                                </div>
                                {index < 3 && (
                                    <div className={`step-connector ${currentStep > step.num ? 'completed' : ''}`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Form Card */}
                <div className="post-job-card">
                    {/* Step 1: Basic Info */}
                    {currentStep === 1 && (
                        <div className="form-step">
                            <h2>Let's start with the basics</h2>
                            <p className="step-description">Tell us what type of job you're posting</p>

                            {/* Job Title */}
                            <div className="form-group">
                                <label htmlFor="title">Job Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Construction Worker Needed"
                                    className={errors.title ? 'error' : ''}
                                />
                                {errors.title && <span className="error-text">{errors.title}</span>}
                            </div>

                            {/* Category */}
                            <div className="form-group">
                                <label>Category *</label>
                                <div className="category-grid">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            className={`category-btn ${formData.category === cat.value ? 'selected' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                                        >
                                            <span className="cat-icon">{cat.icon}</span>
                                            <span className="cat-label">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {errors.category && <span className="error-text">{errors.category}</span>}
                            </div>

                            {/* Job Type */}
                            <div className="form-group">
                                <label>Job Type</label>
                                <div className="type-options">
                                    {JOB_TYPES.map(jt => (
                                        <label
                                            key={jt.value}
                                            className={`type-option ${formData.type === jt.value ? 'selected' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="type"
                                                value={jt.value}
                                                checked={formData.type === jt.value}
                                                onChange={handleChange}
                                            />
                                            <div className="type-content">
                                                <span className="type-label">{jt.label}</span>
                                                <span className="type-desc">{jt.desc}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {currentStep === 2 && (
                        <div className="form-step">
                            <h2>Job Details</h2>
                            <p className="step-description">Describe the work and location</p>

                            {/* Description */}
                            <div className="form-group">
                                <label htmlFor="description">Description *</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe the job responsibilities, requirements, working hours, etc."
                                    rows={6}
                                    className={errors.description ? 'error' : ''}
                                />
                                <div className="char-count">
                                    <span className={(formData.description?.length || 0) < 50 ? 'warn' : ''}>
                                        {formData.description?.length || 0}/50 min
                                    </span>
                                </div>
                                {errors.description && <span className="error-text">{errors.description}</span>}
                            </div>

                            {/* Location */}
                            <div className="form-group">
                                <label>Location *</label>
                                <LocationPicker
                                    value={formData.location}
                                    onChange={handleLocationSelect}
                                    placeholder="Select work location"
                                    className={errors.location ? 'error' : ''}
                                />
                                {errors.location && <span className="error-text">{errors.location}</span>}
                            </div>

                            {/* Remote Toggle */}
                            <div className="form-group">
                                <label className="toggle-label">
                                    <div className="toggle-info">
                                        <span className="toggle-title">Remote Work Available</span>
                                        <span className="toggle-desc">Workers can work from anywhere</span>
                                    </div>
                                    <div className={`toggle-switch ${formData.isRemote ? 'active' : ''}`}>
                                        <input
                                            type="checkbox"
                                            name="isRemote"
                                            checked={formData.isRemote}
                                            onChange={handleChange}
                                        />
                                        <span className="toggle-slider"></span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Requirements */}
                    {currentStep === 3 && (
                        <div className="form-step">
                            <h2>Requirements & Payment</h2>
                            <p className="step-description">Set your expectations and budget</p>

                            {/* Skills */}
                            <div className="form-group">
                                <label>Required Skills</label>
                                <div className="skills-input-wrapper">
                                    <input
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => {
                                            setSkillInput(e.target.value)
                                            setShowSkillSuggestions(true)
                                        }}
                                        onFocus={() => setShowSkillSuggestions(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddSkill(skillInput)
                                            }
                                        }}
                                        placeholder="Type a skill and press Enter"
                                    />
                                    {showSkillSuggestions && skillInput && filteredSuggestions.length > 0 && (
                                        <div className="skill-suggestions">
                                            {filteredSuggestions.slice(0, 5).map(skill => (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    onClick={() => handleAddSkill(skill)}
                                                >
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="skill-tags">
                                    {(formData.skills || []).map(skill => (
                                        <span key={skill} className="skill-tag">
                                            {skill}
                                            <button type="button" onClick={() => handleRemoveSkill(skill)}>×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Experience Level */}
                            <div className="form-group">
                                <label>Experience Level</label>
                                <div className="experience-options">
                                    {EXPERIENCE_LEVELS.map(exp => (
                                        <button
                                            key={exp.value}
                                            type="button"
                                            className={`exp-btn ${formData.experienceLevel === exp.value ? 'selected' : ''}`}
                                            onClick={() => setFormData(prev => ({ ...prev, experienceLevel: exp.value }))}
                                        >
                                            <span className="exp-label">{exp.label}</span>
                                            <span className="exp-desc">{exp.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Workers Needed */}
                            <div className="form-group">
                                <label htmlFor="workersNeeded">Workers Needed</label>
                                <div className="number-input">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            workersNeeded: Math.max(1, (prev.workersNeeded || 1) - 1)
                                        }))}
                                    >−</button>
                                    <input
                                        type="number"
                                        id="workersNeeded"
                                        name="workersNeeded"
                                        value={formData.workersNeeded}
                                        onChange={handleChange}
                                        min="1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                            ...prev,
                                            workersNeeded: (prev.workersNeeded || 1) + 1
                                        }))}
                                    >+</button>
                                </div>
                                {errors.workersNeeded && <span className="error-text">{errors.workersNeeded}</span>}
                            </div>

                            {/* Salary */}
                            <div className="form-group">
                                <label htmlFor="salary">Salary *</label>
                                <div className="salary-input-group">
                                    <span className="currency-prefix">₹</span>
                                    <input
                                        type="number"
                                        id="salary"
                                        name="salary"
                                        value={formData.salary}
                                        onChange={handleChange}
                                        placeholder="500"
                                        className={errors.salary ? 'error' : ''}
                                    />
                                    <select
                                        name="paymentType"
                                        value={formData.paymentType}
                                        onChange={handleChange}
                                    >
                                        {PAYMENT_TYPES.map(pt => (
                                            <option key={pt.value} value={pt.value}>{pt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.salary && <span className="error-text">{errors.salary}</span>}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {currentStep === 4 && (
                        <div className="form-step review-step">
                            <h2>Review Your Job Posting</h2>
                            <p className="step-description">Make sure everything looks good before publishing</p>

                            {/* Review Sections */}
                            <div className="review-section">
                                <div className="review-header">
                                    <h3>Basic Info</h3>
                                    <button type="button" onClick={() => setCurrentStep(1)}>Edit</button>
                                </div>
                                <div className="review-content">
                                    <div className="review-row">
                                        <span className="review-label">Title</span>
                                        <span className="review-value">{formData.title}</span>
                                    </div>
                                    <div className="review-row">
                                        <span className="review-label">Category</span>
                                        <span className="review-value">
                                            {CATEGORIES.find(c => c.value === formData.category)?.icon}{' '}
                                            {CATEGORIES.find(c => c.value === formData.category)?.label}
                                        </span>
                                    </div>
                                    <div className="review-row">
                                        <span className="review-label">Type</span>
                                        <span className="review-value">
                                            {JOB_TYPES.find(t => t.value === formData.type)?.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="review-section">
                                <div className="review-header">
                                    <h3>Details</h3>
                                    <button type="button" onClick={() => setCurrentStep(2)}>Edit</button>
                                </div>
                                <div className="review-content">
                                    <div className="review-row full">
                                        <span className="review-label">Description</span>
                                        <p className="review-description">{formData.description}</p>
                                    </div>
                                    <div className="review-row">
                                        <span className="review-label">Location</span>
                                        <span className="review-value">
                                            📍 {formData.location?.displayText || 'Not specified'}
                                            {formData.isRemote && ' (Remote available)'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="review-section">
                                <div className="review-header">
                                    <h3>Requirements & Payment</h3>
                                    <button type="button" onClick={() => setCurrentStep(3)}>Edit</button>
                                </div>
                                <div className="review-content">
                                    {(formData.skills || []).length > 0 && (
                                        <div className="review-row full">
                                            <span className="review-label">Skills</span>
                                            <div className="review-skills">
                                                {(formData.skills || []).map(skill => (
                                                    <span key={skill} className="skill-tag">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="review-row">
                                        <span className="review-label">Experience</span>
                                        <span className="review-value">
                                            {EXPERIENCE_LEVELS.find(e => e.value === formData.experienceLevel)?.label}
                                        </span>
                                    </div>
                                    <div className="review-row">
                                        <span className="review-label">Workers Needed</span>
                                        <span className="review-value">{formData.workersNeeded}</span>
                                    </div>
                                    <div className="review-row">
                                        <span className="review-label">Salary</span>
                                        <span className="review-value salary-highlight">
                                            ₹{formData.salary} {PAYMENT_TYPES.find(p => p.value === formData.paymentType)?.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {currentStep === 5 && (
                        <div className="form-step success-step">
                            <div className="success-animation">
                                <div className="success-checkmark">
                                    <svg viewBox="0 0 52 52">
                                        <circle cx="26" cy="26" r="25" fill="none" />
                                        <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                                    </svg>
                                </div>
                            </div>
                            <h2>Job Posted Successfully! 🎉</h2>
                            <p className="success-subtitle">Your job is now live and visible to workers</p>

                            <div className="success-summary">
                                <div className="success-job-card">
                                    <span className="job-category-badge">
                                        {CATEGORIES.find(c => c.value === formData.category)?.icon} {CATEGORIES.find(c => c.value === formData.category)?.label}
                                    </span>
                                    <h3>{formData.title}</h3>
                                    <p>📍 {formData.location?.displayText || 'Remote'}</p>
                                    <p className="job-salary">₹{formData.salary} {PAYMENT_TYPES.find(p => p.value === formData.paymentType)?.label}</p>
                                </div>
                            </div>

                            <div className="share-section">
                                <h4>Share this job</h4>
                                <div className="share-buttons">
                                    <button type="button" className="share-btn copy" onClick={handleCopyLink}>
                                        <span>📋</span> Copy Link
                                    </button>
                                    <button type="button" className="share-btn whatsapp" onClick={handleShareWhatsApp}>
                                        <span>💬</span> WhatsApp
                                    </button>
                                    <button type="button" className="share-btn linkedin" onClick={handleShareLinkedIn}>
                                        <span>💼</span> LinkedIn
                                    </button>
                                </div>
                            </div>

                            <div className="success-actions">
                                <button type="button" className="btn-secondary" onClick={() => navigate('/dashboard')}>
                                    Go to Dashboard
                                </button>
                                <button type="button" className="btn-primary-outline" onClick={() => {
                                    setCurrentStep(1)
                                    setFormData({
                                        title: '',
                                        category: '',
                                        type: 'daily',
                                        description: '',
                                        location: null,
                                        isRemote: false,
                                        skills: [],
                                        experienceLevel: 'any',
                                        workersNeeded: 1,
                                        salary: '',
                                        paymentType: 'daily'
                                    })
                                    setPublishedJob(null)
                                }}>
                                    Post Another Job
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons - hidden on success */}
                    {currentStep < 5 && (
                        <div className="form-actions">
                            {currentStep > 1 && (
                                <button type="button" className="btn-back" onClick={handleBack}>
                                    ← Back
                                </button>
                            )}
                            <div className="actions-right">
                                {currentStep < 4 ? (
                                    <button type="button" className="btn-next" onClick={handleNext}>
                                        Continue →
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn-publish"
                                        onClick={handleSubmit}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="btn-loader"></span>
                                        ) : (
                                            <>🚀 Publish Job</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Wrap with ErrorBoundary for production safety
const PostJobWrapped = () => (
    <ErrorBoundary>
        <PostJob />
    </ErrorBoundary>
)

export default PostJobWrapped
