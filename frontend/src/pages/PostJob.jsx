/**
 * PostJob - Premium, Modern Single-Page Job Posting Form
 * Designed for employers to quickly hire workers with bilingual (en/ta) support,
 * location detection, draft auto-save, previews, and OTP mockups.
 */

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import jobService from '../services/jobService.js'
import { toast } from 'react-hot-toast'
import ErrorBoundary from '../components/common/ErrorBoundary.jsx'
import { detectLocation } from '../services/locationService.js'
import logo from '../assets/images/logo.png'
import './PostJob.css'

// Categories — values MUST match backend category controller IDs exactly
// abbr = 2-letter badge shown instead of emoji, color = badge background
const CATEGORIES = [
    { value: 'construction', label: 'Construction',    labelTa: 'கட்டுமானம்',          abbr: 'CO', color: '#f97316' },
    { value: 'gardening',    label: 'Agriculture',     labelTa: 'விவசாயம்',            abbr: 'AG', color: '#22c55e' },
    { value: 'driving',      label: 'Delivery/Driver', labelTa: 'டெலிவரி / ஓட்டுநர்', abbr: 'DR', color: '#3b82f6' },
    { value: 'cleaning',     label: 'House Work',      labelTa: 'வீட்டு வேலை',        abbr: 'HW', color: '#a855f7' },
    { value: 'electrical',   label: 'Electrician',     labelTa: 'மின்சார வேலை',       abbr: 'EL', color: '#eab308' },
    { value: 'plumbing',     label: 'Plumbing',        labelTa: 'குழாய் பணி',          abbr: 'PL', color: '#06b6d4' },
    { value: 'painting',     label: 'Painting',        labelTa: 'வண்ணம் பூசுதல்',     abbr: 'PA', color: '#ec4899' },
    { value: 'carpentry',    label: 'Carpentry',       labelTa: 'தச்சு வேலை',         abbr: 'CA', color: '#78716c' },
    { value: 'cooking',      label: 'Cooking',         labelTa: 'சமையல்',             abbr: 'CK', color: '#ef4444' },
    { value: 'security',     label: 'Security',        labelTa: 'பாதுகாப்பு',          abbr: 'SE', color: '#0f172a' },
    { value: 'other',        label: 'Others',          labelTa: 'இதர வேலைகள்',        abbr: 'OT', color: '#64748b' }
]

// Tamil Nadu Districts for dropdown
const DISTRICTS = [
    'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 
    'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 
    'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 
    'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 
    'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 
    'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 
    'Viluppuram', 'Virudhunagar'
]

// Common skill suggestions
const COMMON_SKILLS = [
    'Masonry', 'Plumbing', 'Wiring', 'Heavy Lifting', 'Tractor Driving', 
    'Goods Delivery', 'Cleaning', 'Cooking', 'Gardening', 'Painting', 
    'Car Driving', 'Loading/Unloading', 'Welding', 'Tailoring', 'Carpentry'
]

const translations = {
    en: {
        pageTitle: 'Post a Job',
        tagline: 'Connect with reliable and skilled workers near your location.',
        jobDetails: '1. Job Details',
        paymentDetails: '2. Payment Details',
        locationDetails: '3. Location',
        workerReqs: '4. Worker Requirements',
        contactDetails: '5. Contact Information',
        jobSettings: '6. Job Settings',
        jobTitleLabel: 'Job Title *',
        jobTitlePlaceholder: 'e.g., Bricklayer needed for house construction',
        categoryLabel: 'Job Category *',
        descLabel: 'Job Description *',
        descPlaceholder: 'Describe the work, timing, and responsibilities in simple terms...',
        workersNeededLabel: 'Number of Workers Required *',
        salaryTypeLabel: 'Salary Type *',
        salaryAmountLabel: 'Salary Amount *',
        negotiableLabel: 'Wage is negotiable',
        stateLabel: 'State *',
        districtLabel: 'District *',
        addressLabel: 'Full Address *',
        addressPlaceholder: 'Street name, landmark, area details...',
        currentLocBtn: 'Use Current Location',
        experienceLabel: 'Required Experience (Optional)',
        ageRangeLabel: 'Preferred Age Range',
        genderLabel: 'Gender Preference',
        skillsLabel: 'Required Skills (Press Enter to add)',
        skillsPlaceholder: 'e.g., painting, concrete mixing',
        employerNameLabel: 'Employer Name *',
        mobileLabel: 'Mobile Number *',
        whatsappLabel: 'WhatsApp Number',
        emailLabel: 'Email Address (Optional)',
        immediateLabel: 'Urgent Hiring / Immediate Start',
        expiryLabel: 'Job Expiry Date *',
        otpLabel: 'OTP Verification *',
        otpSendBtn: 'Send OTP Verification Code',
        otpVerifiedText: 'Phone Number Verified successfully!',
        saveDraft: 'Save Draft',
        preview: 'Preview Post',
        publish: 'Publish Job',
        loading: 'Publishing...',
        prevBack: 'Back to Editor',
        prevTitle: 'Job Post Preview',
        successTitle: 'Job Published Successfully! 🎉',
        successSubtitle: 'Workers in your area will receive instant SMS notifications.',
        shareText: 'Share this job opening:',
        copyLink: 'Copy Link',
        closeBtn: 'Done',
        any: 'Any',
        male: 'Male',
        female: 'Female',
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        fixed: 'Fixed Amount',
        validationError: 'Please fix the errors in the form before submitting.',
        draftSaved: 'Draft saved successfully!',
        draftLoaded: 'Previous draft loaded!',
        gpsSuccess: 'Location captured successfully!',
        gpsError: 'Could not fetch location. Please enter details manually.',
        back: 'Back',
        cancel: 'Cancel'
    },
    ta: {
        pageTitle: 'வேலையை வெளியிடுக',
        tagline: 'உங்கள் பகுதியில் உள்ள திறமையான தொழிலாளர்களை எளிதாகக் கண்டறியுங்கள்.',
        jobDetails: '1. வேலை விவரங்கள்',
        paymentDetails: '2. சம்பள விவரங்கள்',
        locationDetails: '3. வேலை செய்யும் இடம்',
        workerReqs: '4. தொழிலாளர் தேவைகள்',
        contactDetails: '5. தொடர்பு விபரங்கள்',
        jobSettings: '6. வேலை அமைப்புகள்',
        jobTitleLabel: 'வேலைத் தலைப்பு *',
        jobTitlePlaceholder: 'எ.கா., வீடு கட்ட செங்கல் அடுக்க ஆட்கள் தேவை',
        categoryLabel: 'வேலை வகை *',
        descLabel: 'வேலை விளக்கம் *',
        descPlaceholder: 'செய்ய வேண்டிய வேலை, நேரம், மற்றும் பொறுப்புகளை எளிய முறையில் விளக்கவும்...',
        workersNeededLabel: 'தேவைப்படும் தொழிலாளர்கள் எண்ணிக்கை *',
        salaryTypeLabel: 'சம்பள முறை *',
        salaryAmountLabel: 'சம்பளத் தொகை *',
        negotiableLabel: 'சம்பளம் பேசித் தீர்மானிக்கலாம்',
        stateLabel: 'மாநிலம் *',
        districtLabel: 'மாவட்டம் *',
        addressLabel: 'முழு முகவரி *',
        addressPlaceholder: 'தெரு பெயர், லேண்ட்மார்க், பகுதி விவரங்கள்...',
        currentLocBtn: 'தற்போதைய இருப்பிடத்தைப் பயன்படுத்து',
        experienceLabel: 'தேவைப்படும் அனுபவம் (விருப்பத்திற்குரியது)',
        ageRangeLabel: 'விருப்ப வயது வரம்பு',
        genderLabel: 'பாலின விருப்பம்',
        skillsLabel: 'தேவைப்படும் திறன்கள் (சேர்க்க Enter அழுத்தவும்)',
        skillsPlaceholder: 'எ.கா., பெயிண்டிங், சிமெண்ட் கலவை',
        employerNameLabel: 'முதலாளி பெயர் *',
        mobileLabel: 'அலைபேசி எண் *',
        whatsappLabel: 'வாட்ஸ்அப் எண்',
        emailLabel: 'மின்னஞ்சல் முகவரி (விருப்பத்திற்குரியது)',
        immediateLabel: 'உடனடி வேலை / அவசரம்',
        expiryLabel: 'வேலை விளம்பர முடிவு நாள் *',
        otpLabel: 'OTP சரிபார்ப்பு *',
        otpSendBtn: 'OTP குறியீட்டை அனுப்பு',
        otpVerifiedText: 'தொலைபேசி எண் வெற்றிகரமாக சரிபார்க்கப்பட்டது!',
        saveDraft: 'வரைவை சேமி',
        preview: 'முன்னோட்டம்',
        publish: 'வேலையை வெளியிடு',
        loading: 'வெளியிடுகிறது...',
        prevBack: 'திரும்ப திருத்து',
        prevTitle: 'வேலை விளம்பர முன்னோட்டம்',
        successTitle: 'வேலை வெற்றிகரமாக வெளியிடப்பட்டது! 🎉',
        successSubtitle: 'உங்கள் பகுதியில் உள்ள தொழிலாளர்களுக்கு உடனடி அறிவிப்பு அனுப்பப்படும்.',
        shareText: 'இந்த வேலையை பகிரவும்:',
        copyLink: 'இணைப்பை நகலெடு',
        closeBtn: 'முடிந்தது',
        any: 'யாரும்',
        male: 'ஆண்',
        female: 'பெண்',
        daily: 'தினசரி',
        weekly: 'வாராந்திர',
        monthly: 'மாதாந்திர',
        fixed: 'நிலையான தொகை',
        validationError: 'படிவத்தில் உள்ள பிழைகளைச் சரிசெய்த பின் சமர்ப்பிக்கவும்.',
        draftSaved: 'வரைவு வெற்றிகரமாக சேமிக்கப்பட்டது!',
        draftLoaded: 'முந்தைய வரைவு ஏற்றப்பட்டது!',
        gpsSuccess: 'இருப்பிடம் வெற்றிகரமாக பெறப்பட்டது!',
        gpsError: 'இருப்பிடத்தைப் பெற முடியவில்லை. முகவரியை நேரடியாக உள்ளிடவும்.',
        back: 'பின்செல்',
        cancel: 'ரத்து'
    }
}

function PostJob() {
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()
    const { language, toggleLanguage } = useLanguage()
    const t = translations[language] || translations.en

    // Form inputs state
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        workersNeeded: 1,
        salaryType: 'daily',
        salaryAmount: '',
        negotiable: false,
        state: 'Tamil Nadu',
        district: '',
        address: '',
        lat: '',
        lng: '',
        experience: 'any',
        ageRange: 'any',
        gender: 'any',
        skills: [],
        employerName: '',
        mobileNumber: '',
        whatsappNumber: '',
        email: '',
        immediateHiring: false,
        expiryDate: '',
        isOtpVerified: false
    })

    const [skillInput, setSkillInput] = useState('')
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [otpCode, setOtpCode] = useState('')
    const [generatedJobId, setGeneratedJobId] = useState(null)
    const [activeSection, setActiveSection] = useState(1)
    // Map query — updates when district changes
    const [mapQuery, setMapQuery] = useState('Tamil Nadu, India')

    // Load initial user details and draft
    useEffect(() => {
        if (!authLoading && user) {
            // Set defaults from profile
            setFormData(prev => ({
                ...prev,
                employerName: prev.employerName || user.name || '',
                mobileNumber: prev.mobileNumber || user.phone || '',
                whatsappNumber: prev.whatsappNumber || user.phone || ''
            }))

            // Check local storage draft
            const savedDraft = localStorage.getItem('daycraft_job_draft')
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft)
                    setFormData(prev => ({ ...prev, ...parsed }))
                    toast.success(t.draftLoaded)
                } catch (e) {
                    console.error('Failed to parse draft', e)
                }
            }
        }
    }, [user, authLoading, language])

    // Expiry date default setter
    useEffect(() => {
        if (!formData.expiryDate) {
            const defaultDate = new Date()
            defaultDate.setDate(defaultDate.getDate() + 30) // 30 days default
            const yyyy = defaultDate.getFullYear()
            const mm = String(defaultDate.getMonth() + 1).padStart(2, '0')
            const dd = String(defaultDate.getDate()).padStart(2, '0')
            setFormData(prev => ({ ...prev, expiryDate: `${yyyy}-${mm}-${dd}` }))
        }
    }, [])

    // Auto-detect location from IP on mount
    useEffect(() => {
        const autoDetect = async () => {
            // Skip if district already set (e.g. from draft)
            if (formData.district) return

            const detected = await detectLocation(language)
            if (detected && detected.districtName) {
                // Check if the detected district exists in the DISTRICTS array
                const matchedDistrict = DISTRICTS.find(
                    d => d.toLowerCase() === detected.districtName.toLowerCase()
                )
                if (matchedDistrict) {
                    setFormData(prev => ({
                        ...prev,
                        district: matchedDistrict,
                        lat: detected.lat ? String(detected.lat) : prev.lat,
                        lng: detected.lon ? String(detected.lon) : prev.lng
                    }))
                    setMapQuery(`${matchedDistrict}, Tamil Nadu, India`)
                    toast.success(
                        language === 'en'
                            ? `📍 Location auto-detected: ${matchedDistrict}`
                            : `📍 இருப்பிடம் தானாகக் கண்டறியப்பட்டது: ${matchedDistrict}`,
                        { duration: 3000, id: 'ip-detect' }
                    )
                }
            }
        }
        autoDetect()
    }, [])

    // Handle scroll to track active section
    useEffect(() => {
        const handleScroll = () => {
            const sections = [1, 2, 3, 4, 5, 6]
            for (const sectionNum of sections) {
                const element = document.getElementById(`section-${sectionNum}`)
                if (element) {
                    const rect = element.getBoundingClientRect()
                    if (rect.top <= 180 && rect.bottom >= 180) {
                        setActiveSection(sectionNum)
                        break
                    }
                }
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Input handlers
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
        // Update map when district changes
        if (name === 'district' && value) {
            setMapQuery(`${value}, Tamil Nadu, India`)
        }
        if (name === 'address' && value && formData.district) {
            setMapQuery(`${value}, ${formData.district}, Tamil Nadu, India`)
        }
    }

    // Geolocation handler
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error(t.gpsError)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    lat: position.coords.latitude.toFixed(6),
                    lng: position.coords.longitude.toFixed(6)
                }))
                toast.success(t.gpsSuccess)
            },
            (error) => {
                console.error(error)
                toast.error(t.gpsError)
            }
        )
    }

    // Skill Tag handlers
    const handleAddSkill = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const trimmed = skillInput.trim()
            if (trimmed && !formData.skills.includes(trimmed)) {
                setFormData(prev => ({
                    ...prev,
                    skills: [...prev.skills, trimmed]
                }))
                setSkillInput('')
            }
        }
    }

    const handleRemoveSkill = (skillToRemove) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skillToRemove)
        }))
    }

    // Validation logic
    const validateForm = () => {
        const newErrors = {}
        if (!formData.title.trim()) newErrors.title = language === 'en' ? 'Job Title is required' : 'வேலைத் தலைப்பு தேவை'
        if (!formData.category) newErrors.category = language === 'en' ? 'Category is required' : 'வேலை வகை தேவை'
        if (!formData.description.trim()) newErrors.description = language === 'en' ? 'Description is required' : 'வேலை விளக்கம் தேவை'
        if (formData.description.trim().length < 10) newErrors.description = language === 'en' ? 'Description must be at least 10 characters' : 'விளக்கம் குறைந்தது 10 எழுத்துக்கள் இருக்க வேண்டும்'
        if (!formData.salaryAmount || formData.salaryAmount <= 0) newErrors.salaryAmount = language === 'en' ? 'Valid Salary is required' : 'முறையான சம்பளம் தேவை'
        if (!formData.district) newErrors.district = language === 'en' ? 'District is required' : 'மாவட்டம் தேவை'
        if (!formData.address.trim()) newErrors.address = language === 'en' ? 'Full Address is required' : 'முழு முகவரி தேவை'
        if (!formData.employerName.trim()) newErrors.employerName = language === 'en' ? 'Employer Name is required' : 'முதலாளி பெயர் தேவை'
        if (!formData.mobileNumber.trim()) newErrors.mobileNumber = language === 'en' ? 'Mobile Number is required' : 'அலைபேசி எண் தேவை'
        if (!/^\d{10}$/.test(formData.mobileNumber.trim())) newErrors.mobileNumber = language === 'en' ? 'Must be a 10-digit number' : '10 இலக்க எண்ணாக இருக்க வேண்டும்'
        if (!formData.expiryDate) newErrors.expiryDate = language === 'en' ? 'Expiry Date is required' : 'விளம்பர முடிவு நாள் தேவை'
        if (!formData.isOtpVerified) newErrors.otp = language === 'en' ? 'OTP Verification is required' : 'OTP சரிபார்ப்பு தேவை'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Save Draft
    const handleSaveDraft = () => {
        localStorage.setItem('daycraft_job_draft', JSON.stringify(formData))
        toast.success(t.draftSaved)
    }

    // OTP Mocking Flow
    const handleSendOtp = () => {
        if (!formData.mobileNumber || !/^\d{10}$/.test(formData.mobileNumber.trim())) {
            setErrors(prev => ({ ...prev, mobileNumber: language === 'en' ? 'Enter a valid 10-digit mobile number first' : 'முதலில் 10 இலக்க அலைபேசி எண்ணை உள்ளிடவும்' }))
            toast.error(language === 'en' ? 'Invalid Mobile Number' : 'தவறான அலைபேசி எண்')
            return
        }
        setShowOtpModal(true)
        toast.success(language === 'en' ? 'OTP sent to mobile number!' : 'அலைபேசி எண்ணிற்கு OTP அனுப்பப்பட்டது!')
    }

    const handleVerifyOtp = () => {
        if (otpCode.trim() === '1234' || otpCode.trim().length === 4) {
            setFormData(prev => ({ ...prev, isOtpVerified: true }))
            setErrors(prev => ({ ...prev, otp: '' }))
            setShowOtpModal(false)
            toast.success(t.otpVerifiedText)
        } else {
            toast.error(language === 'en' ? 'Invalid OTP. Try entering any 4-digit code (e.g. 1234)' : 'தவறான OTP. ஏதேனும் 4 இலக்க குறியீட்டை உள்ளிடவும் (எ.கா. 1234)')
        }
    }

    // Submit Job
    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error(t.validationError)
            // Scroll to first error
            const firstErrorKey = Object.keys(errors)[0]
            const errorElement = document.getElementsByName(firstErrorKey)[0] || document.getElementById(firstErrorKey)
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            return
        }

        setIsLoading(true)
        try {
            const payload = {
                title: { en: formData.title, ta: formData.title },
                description: { en: formData.description, ta: formData.description },
                category: formData.category,
                location: `${formData.address}, ${formData.district}, ${formData.state}`,
                geoLocation: formData.lat && formData.lng ? {
                    coordinates: [parseFloat(formData.lng), parseFloat(formData.lat)]
                } : null,
                salary: parseFloat(formData.salaryAmount),
                paymentType: formData.salaryType,
                workersNeeded: formData.workersNeeded,
                skills: formData.skills.map(s => ({ en: s, ta: s })),
                experienceLevel: formData.experience,
                urgent: formData.immediateHiring,
                employer: user.id
            }

            const response = await jobService.createJob(payload)
            setGeneratedJobId(response?.job?._id || 'mock-id')
            localStorage.removeItem('daycraft_job_draft') // Clear draft on successful post
            setShowSuccessModal(true)
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || 'Failed to publish job')
        } finally {
            setIsLoading(false)
        }
    }

    // Share Options
    const getJobUrl = () => {
        return `${window.location.origin}/jobs/${generatedJobId || ''}`
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(getJobUrl())
        toast.success(t.copyLink + '!')
    }

    if (authLoading) {
        return (
            <div className="loader-container">
                <div className="btn-loader"></div>
            </div>
        )
    }

    return (
        <div className="post-job-page">
            {/* Page Header */}
            <header className="page-header-post">
                <div className="header-container-post">
                    <div className="header-left">
                        <Link to="/dashboard" className="btn-back">
                            <span className="back-arrow">←</span>
                            <span className="back-text">{t.back}</span>
                        </Link>
                        <img src={logo} alt="DayCraft" className="header-logo" />
                    </div>
                    <div className="header-right">
                        <h1 className="header-title">{t.pageTitle}</h1>
                        <button onClick={toggleLanguage} className="lang-switcher">
                            🌐 {language === 'en' ? 'தமிழ்' : 'English'}
                        </button>
                    </div>
                </div>
            </header>

            <div className="page-layout-post container">
                {/* Scroll Spy Sidebar Nav (Desktop Only) */}
                <aside className="sidebar-spy">
                    <div className="spy-progress-container">
                        <div className="spy-line"></div>
                        <div className="spy-items">
                            {[
                                { num: 1, label: t.jobDetails },
                                { num: 2, label: t.paymentDetails },
                                { num: 3, label: t.locationDetails },
                                { num: 4, label: t.workerReqs },
                                { num: 5, label: t.contactDetails },
                                { num: 6, label: t.jobSettings }
                            ].map(spy => (
                                <a
                                    key={spy.num}
                                    href={`#section-${spy.num}`}
                                    className={`spy-item ${activeSection === spy.num ? 'active' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        document.getElementById(`section-${spy.num}`).scrollIntoView({ behavior: 'smooth', block: 'start' })
                                    }}
                                >
                                    <div className="spy-circle">{spy.num}</div>
                                    <span className="spy-label">{spy.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Form Main Area */}
                <main className="form-main">
                    <div className="form-intro">
                        <h2>{t.pageTitle}</h2>
                        <p>{t.tagline}</p>
                    </div>

                    <form className="form-post-job" onSubmit={(e) => e.preventDefault()}>
                        
                        {/* Section 1: Job Details */}
                        <fieldset id="section-1" className="form-section-card">
                            <div className="card-header">
                                <span className="card-badge">1</span>
                                <legend>{t.jobDetails}</legend>
                            </div>

                            {/* Job Title */}
                            <div className="form-group">
                                <label htmlFor="title">{t.jobTitleLabel}</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder={t.jobTitlePlaceholder}
                                    className={errors.title ? 'input-error' : ''}
                                />
                                {errors.title && <span className="error-msg">⚠️ {errors.title}</span>}
                            </div>

                            {/* Job Category */}
                            <div className="form-group">
                                <label>{t.categoryLabel}</label>
                                <div className="category-selection-grid">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            className={`category-select-btn ${formData.category === cat.value ? 'active' : ''}`}
                                            style={formData.category === cat.value ? { '--cat-color': cat.color, borderColor: cat.color } : { '--cat-color': cat.color }}
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, category: cat.value }))
                                                setErrors(prev => ({ ...prev, category: '' }))
                                            }}
                                        >
                                            <span
                                                className="cat-abbr"
                                                style={{ background: cat.color }}
                                            >{cat.abbr}</span>
                                            <span className="cat-text">{language === 'en' ? cat.label : cat.labelTa}</span>
                                        </button>
                                    ))}
                                </div>
                                {errors.category && <span className="error-msg">⚠️ {errors.category}</span>}
                            </div>

                            {/* Job Description */}
                            <div className="form-group">
                                <label htmlFor="description">{t.descLabel}</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows="4"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder={t.descPlaceholder}
                                    className={errors.description ? 'input-error' : ''}
                                />
                                {errors.description && <span className="error-msg">⚠️ {errors.description}</span>}
                            </div>

                            {/* Workers Required */}
                            <div className="form-group">
                                <label htmlFor="workersNeeded">{t.workersNeededLabel}</label>
                                <div className="counter-wrapper">
                                    <button
                                        type="button"
                                        className="counter-btn"
                                        onClick={() => setFormData(prev => ({ ...prev, workersNeeded: Math.max(1, prev.workersNeeded - 1) }))}
                                    >
                                        −
                                    </button>
                                    <input
                                        type="number"
                                        id="workersNeeded"
                                        name="workersNeeded"
                                        value={formData.workersNeeded}
                                        onChange={handleChange}
                                        min="1"
                                        className="counter-input"
                                    />
                                    <button
                                        type="button"
                                        className="counter-btn"
                                        onClick={() => setFormData(prev => ({ ...prev, workersNeeded: prev.workersNeeded + 1 }))}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </fieldset>

                        {/* Section 2: Payment Details */}
                        <fieldset id="section-2" className="form-section-card">
                            <div className="card-header">
                                <span className="card-badge">2</span>
                                <legend>{t.paymentDetails}</legend>
                            </div>

                            <div className="payment-grid">
                                {/* Salary Type */}
                                <div className="form-group">
                                    <label htmlFor="salaryType">{t.salaryTypeLabel}</label>
                                    <select
                                        id="salaryType"
                                        name="salaryType"
                                        value={formData.salaryType}
                                        onChange={handleChange}
                                    >
                                        <option value="daily">{t.daily}</option>
                                        <option value="weekly">{t.weekly}</option>
                                        <option value="monthly">{t.monthly}</option>
                                        <option value="fixed">{t.fixed}</option>
                                    </select>
                                </div>

                                {/* Salary Amount */}
                                <div className="form-group">
                                    <label htmlFor="salaryAmount">{t.salaryAmountLabel}</label>
                                    <div className="amount-input-wrapper">
                                        <span className="currency-symbol">₹</span>
                                        <input
                                            type="number"
                                            id="salaryAmount"
                                            name="salaryAmount"
                                            value={formData.salaryAmount}
                                            onChange={handleChange}
                                            placeholder="500"
                                            className={errors.salaryAmount ? 'input-error' : ''}
                                        />
                                    </div>
                                    {errors.salaryAmount && <span className="error-msg">⚠️ {errors.salaryAmount}</span>}
                                </div>
                            </div>

                            {/* Negotiable Toggle */}
                            <div className="form-group checkbox-toggle-wrapper">
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        name="negotiable"
                                        checked={formData.negotiable}
                                        onChange={handleChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span className="toggle-label">{t.negotiableLabel}</span>
                            </div>
                        </fieldset>

                        {/* Section 3: Location */}
                        <fieldset id="section-3" className="form-section-card">
                            <div className="card-header">
                                <span className="card-badge">3</span>
                                <legend>{t.locationDetails}</legend>
                            </div>

                            <div className="location-grid">
                                {/* State */}
                                <div className="form-group">
                                    <label htmlFor="state">{t.stateLabel}</label>
                                    <input
                                        type="text"
                                        id="state"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        disabled
                                    />
                                </div>

                                {/* District */}
                                <div className="form-group">
                                    <label htmlFor="district">{t.districtLabel}</label>
                                    <select
                                        id="district"
                                        name="district"
                                        value={formData.district}
                                        onChange={handleChange}
                                        className={errors.district ? 'input-error' : ''}
                                    >
                                        <option value="">{language === 'en' ? '-- Select District --' : '-- மாவட்டம் தேர்வு செய் --'}</option>
                                        {DISTRICTS.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    {errors.district && <span className="error-msg">⚠️ {errors.district}</span>}
                                </div>
                            </div>

                            {/* Full Address */}
                            <div className="form-group">
                                <label htmlFor="address">{t.addressLabel}</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder={t.addressPlaceholder}
                                    className={errors.address ? 'input-error' : ''}
                                />
                                {errors.address && <span className="error-msg">⚠️ {errors.address}</span>}
                            </div>

                            {/* GPS Geolocation */}
                            <div className="form-group gps-location-row">
                                <button
                                    type="button"
                                    onClick={handleGetCurrentLocation}
                                    className="btn-gps"
                                >
                                    &#9679; {t.currentLocBtn}
                                </button>
                                {formData.lat && formData.lng && (
                                    <span className="gps-coordinates-badge">
                                        &#10003; GPS Captured ({formData.lat}, {formData.lng})
                                    </span>
                                )}
                            </div>

                            {/* Live Map Preview */}
                            <div className="map-preview-wrapper">
                                <div className="map-preview-label">
                                    <span className="map-pin-dot"></span>
                                    {formData.district
                                        ? `Showing: ${formData.district}, Tamil Nadu`
                                        : 'Select a district to see location on map'}
                                </div>
                                <div className="map-frame-container">
                                    <iframe
                                        key={mapQuery}
                                        title="Job Location Map"
                                        className="map-iframe"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=13&output=embed&hl=en`}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            </div>
                        </fieldset>

                        {/* Section 4: Worker Requirements */}
                        <fieldset id="section-4" className="form-section-card">
                            <div className="card-header">
                                <span className="card-badge">4</span>
                                <legend>{t.workerReqs}</legend>
                            </div>

                            <div className="requirements-grid">
                                {/* Experience */}
                                <div className="form-group">
                                    <label htmlFor="experience">{t.experienceLabel}</label>
                                    <select
                                        id="experience"
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                    >
                                        <option value="any">{language === 'en' ? 'Any Experience' : 'அனுபவம் தேவையில்லை'}</option>
                                        <option value="1">{language === 'en' ? 'Minimum 1 Year' : 'குறைந்தது 1 வருடம்'}</option>
                                        <option value="2">{language === 'en' ? '2+ Years' : '2+ வருடங்கள்'}</option>
                                        <option value="5">{language === 'en' ? '5+ Years' : '5+ வருடங்கள்'}</option>
                                    </select>
                                </div>

                                {/* Age Range */}
                                <div className="form-group">
                                    <label htmlFor="ageRange">{t.ageRangeLabel}</label>
                                    <select
                                        id="ageRange"
                                        name="ageRange"
                                        value={formData.ageRange}
                                        onChange={handleChange}
                                    >
                                        <option value="any">{t.any}</option>
                                        <option value="18-30">18 - 30</option>
                                        <option value="30-50">30 - 50</option>
                                        <option value="18-50">18 - 50</option>
                                    </select>
                                </div>

                                {/* Gender */}
                                <div className="form-group">
                                    <label htmlFor="gender">{t.genderLabel}</label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="any">{t.any}</option>
                                        <option value="male">{t.male}</option>
                                        <option value="female">{t.female}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Required Skills */}
                            <div className="form-group">
                                <label htmlFor="skillInput">{t.skillsLabel}</label>
                                <div className="skills-input-box">
                                    <input
                                        type="text"
                                        id="skillInput"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={handleAddSkill}
                                        placeholder={t.skillsPlaceholder}
                                    />
                                </div>

                                {/* Skills Suggestion Chips */}
                                <div className="skills-suggestions-chips">
                                    {COMMON_SKILLS.filter(s => !formData.skills.includes(s)).map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            className="suggestion-chip"
                                            onClick={() => setFormData(prev => ({ ...prev, skills: [...prev.skills, s] }))}
                                        >
                                            + {s}
                                        </button>
                                    ))}
                                </div>

                                {/* Tag display */}
                                <div className="skills-tag-display">
                                    {formData.skills.map(skill => (
                                        <span key={skill} className="skill-tag-chip">
                                            {skill}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSkill(skill)}
                                                className="remove-skill-btn"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </fieldset>

                        {/* Section 5: Contact */}
                        <fieldset id="section-5" className="form-section-card">
                            <div className="card-header">
                                <span className="card-badge">5</span>
                                <legend>{t.contactDetails}</legend>
                            </div>

                            <div className="contact-grid">
                                {/* Name */}
                                <div className="form-group">
                                    <label htmlFor="employerName">{t.employerNameLabel}</label>
                                    <input
                                        type="text"
                                        id="employerName"
                                        name="employerName"
                                        value={formData.employerName}
                                        onChange={handleChange}
                                        className={errors.employerName ? 'input-error' : ''}
                                    />
                                    {errors.employerName && <span className="error-msg">⚠️ {errors.employerName}</span>}
                                </div>

                                {/* Mobile */}
                                <div className="form-group">
                                    <label htmlFor="mobileNumber">{t.mobileLabel}</label>
                                    <input
                                        type="tel"
                                        id="mobileNumber"
                                        name="mobileNumber"
                                        value={formData.mobileNumber}
                                        onChange={handleChange}
                                        className={errors.mobileNumber ? 'input-error' : ''}
                                        placeholder="9876543210"
                                    />
                                    {errors.mobileNumber && <span className="error-msg">⚠️ {errors.mobileNumber}</span>}
                                </div>

                                {/* WhatsApp */}
                                <div className="form-group">
                                    <label htmlFor="whatsappNumber">{t.whatsappLabel}</label>
                                    <input
                                        type="tel"
                                        id="whatsappNumber"
                                        name="whatsappNumber"
                                        value={formData.whatsappNumber}
                                        onChange={handleChange}
                                        placeholder="9876543210"
                                    />
                                </div>

                                {/* Email */}
                                <div className="form-group">
                                    <label htmlFor="email">{t.emailLabel}</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="employer@example.com"
                                    />
                                </div>
                            </div>
                        </fieldset>

                        {/* Section 6: Job Settings & OTP Verification */}
                        <fieldset id="section-6" className="form-section-card">
                            <div className="card-header">
                                <span className="card-badge">6</span>
                                <legend>{t.jobSettings}</legend>
                            </div>

                            <div className="settings-grid">
                                {/* Immediate Hiring Toggle */}
                                <div className="form-group checkbox-toggle-wrapper">
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            name="immediateHiring"
                                            checked={formData.immediateHiring}
                                            onChange={handleChange}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                    <span className="toggle-label">{t.immediateLabel}</span>
                                </div>

                                {/* Expiry Date */}
                                <div className="form-group">
                                    <label htmlFor="expiryDate">{t.expiryLabel}</label>
                                    <input
                                        type="date"
                                        id="expiryDate"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleChange}
                                        className={errors.expiryDate ? 'input-error' : ''}
                                    />
                                    {errors.expiryDate && <span className="error-msg">⚠️ {errors.expiryDate}</span>}
                                </div>
                            </div>

                            {/* OTP Verification Block */}
                            <div className="otp-verification-block">
                                <label className="form-group-label">{t.otpLabel}</label>
                                <p className="otp-description">
                                    {language === 'en' 
                                        ? 'Verify your mobile number to avoid fake listings.' 
                                        : 'தவறான வேலை பதிவுகளைத் தவிர்க்க அலைபேசி எண்ணை சரிபார்க்கவும்.'}
                                </p>
                                
                                {formData.isOtpVerified ? (
                                    <div className="otp-success-alert">
                                        🛡️ {t.otpVerifiedText}
                                    </div>
                                ) : (
                                    <div className="otp-action-row">
                                        <button
                                            type="button"
                                            onClick={handleSendOtp}
                                            className="btn-send-otp"
                                        >
                                            📲 {t.otpSendBtn}
                                        </button>
                                        {errors.otp && <span className="error-msg otp-error">⚠️ {errors.otp}</span>}
                                    </div>
                                )}
                            </div>
                        </fieldset>

                        {/* Bottom CTA Actions */}
                        <div className="bottom-cta-row">
                            <button
                                type="button"
                                className="btn-cta-secondary"
                                onClick={handleSaveDraft}
                            >
                                💾 {t.saveDraft}
                            </button>
                            <button
                                type="button"
                                className="btn-cta-info"
                                onClick={() => setShowPreviewModal(true)}
                            >
                                👁️ {t.preview}
                            </button>
                            <button
                                type="button"
                                className="btn-cta-primary"
                                onClick={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? t.loading : `🚀 ${t.publish}`}
                            </button>
                        </div>

                    </form>
                </main>
            </div>

            {/* OTP Verification Modal */}
            {showOtpModal && (
                <div className="modal-backdrop-post">
                    <div className="modal-content-post otp-modal animate-pop">
                        <h3>{language === 'en' ? 'Verify Mobile Number' : 'அலைபேசி எண் சரிபார்ப்பு'}</h3>
                        <p>{language === 'en' ? `Enter the 4-digit code sent to ${formData.mobileNumber}:` : `${formData.mobileNumber} எண்ணிற்கு அனுப்பப்பட்ட 4 இலக்க குறியீட்டை உள்ளிடவும்:`}</p>
                        
                        <div className="otp-input-field-wrapper">
                            <input
                                type="text"
                                maxLength="4"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="1234"
                                className="otp-code-input"
                            />
                        </div>
                        <p className="otp-hint-msg">{language === 'en' ? 'Tip: Enter any 4 digit code to verify' : 'குறிப்பு: சரிபார்க்க ஏதேனும் 4 இலக்க குறியீட்டை உள்ளிடவும்'}</p>

                        <div className="modal-actions-post">
                            <button
                                type="button"
                                className="btn-modal-cancel"
                                onClick={() => setShowOtpModal(false)}
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="button"
                                className="btn-modal-verify"
                                onClick={handleVerifyOtp}
                            >
                                {language === 'en' ? 'Verify Code' : 'சரிபார்க்கவும்'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && (
                <div className="modal-backdrop-post">
                    <div className="modal-content-post preview-modal animate-pop">
                        <div className="modal-header-preview">
                            <h3>{t.prevTitle}</h3>
                            <button className="close-x" onClick={() => setShowPreviewModal(false)}>×</button>
                        </div>

                        <div className="preview-job-post-card">
                            <div className="job-preview-header">
                                <div>
                                    <h4 className="job-preview-title">{formData.title || (language === 'en' ? 'Untitled Job Post' : 'தலைப்பற்ற வேலை விளம்பரம்')}</h4>
                                    <p className="job-preview-meta">
                                        🏢 {formData.employerName || 'Employer'} | 📍 {formData.address || 'Address'}, {formData.district || 'District'}
                                    </p>
                                </div>
                                {formData.category && (
                                    <span className="preview-cat-badge">
                                        {CATEGORIES.find(c => c.value === formData.category)?.icon} {CATEGORIES.find(c => c.value === formData.category)?.label}
                                    </span>
                                )}
                            </div>

                            <div className="job-preview-body">
                                <h5>{language === 'en' ? 'Description' : 'வேலை விளக்கம்'}</h5>
                                <p className="job-preview-description">{formData.description || (language === 'en' ? 'No description provided yet.' : 'வேலை விளக்கம் ஏதும் வழங்கப்படவில்லை.')}</p>

                                <div className="job-preview-grid">
                                    <div className="preview-meta-box">
                                        <span>💵 {language === 'en' ? 'Salary' : 'சம்பளம்'}</span>
                                        <strong>₹{formData.salaryAmount || '0'} / {formData.salaryType}</strong>
                                    </div>
                                    <div className="preview-meta-box">
                                        <span>👥 {language === 'en' ? 'Workers' : 'தொழிலாளர்கள்'}</span>
                                        <strong>{formData.workersNeeded} {language === 'en' ? 'Workers' : 'தொழிலாளர்கள்'}</strong>
                                    </div>
                                    <div className="preview-meta-box">
                                        <span>👔 {language === 'en' ? 'Experience' : 'அனுபவம்'}</span>
                                        <strong>{formData.experience}</strong>
                                    </div>
                                    <div className="preview-meta-box">
                                        <span>🚻 {language === 'en' ? 'Gender' : 'பாலினம்'}</span>
                                        <strong>{formData.gender}</strong>
                                    </div>
                                </div>

                                {formData.skills.length > 0 && (
                                    <div className="preview-skills-block">
                                        <h5>{language === 'en' ? 'Required Skills' : 'தேவைப்படும் திறன்கள்'}</h5>
                                        <div className="preview-skills-list">
                                            {formData.skills.map(s => (
                                                <span key={s} className="preview-skill-tag">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions-post text-right">
                            <button
                                type="button"
                                className="btn-modal-back"
                                onClick={() => setShowPreviewModal(false)}
                            >
                                {t.prevBack}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="modal-backdrop-post">
                    <div className="modal-content-post success-modal animate-pop">
                        <div className="success-icon-badge">🎉</div>
                        <h3>{t.successTitle}</h3>
                        <p className="success-sub">{t.successSubtitle}</p>

                        <div className="share-box-post">
                            <p>{t.shareText}</p>
                            <div className="share-action-row">
                                <button
                                    type="button"
                                    onClick={handleCopyLink}
                                    className="share-btn-copy"
                                >
                                    📋 {t.copyLink}
                                </button>
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`New job post: ${formData.title} - Salary ₹${formData.salaryAmount}/${formData.salaryType} in ${formData.district}. Apply here: ${getJobUrl()}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="share-btn-whatsapp"
                                >
                                    💬 WhatsApp
                                </a>
                            </div>
                        </div>

                        <div className="modal-actions-post text-center">
                            <button
                                type="button"
                                className="btn-success-close"
                                onClick={() => {
                                    setShowSuccessModal(false)
                                    navigate('/dashboard')
                                }}
                            >
                                {t.closeBtn}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const PostJobWrapped = () => (
    <ErrorBoundary>
        <PostJob />
    </ErrorBoundary>
)

export default PostJobWrapped
