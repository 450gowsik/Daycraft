import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useJobs } from '../context/JobContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getDetailedIcon } from '../constants/categories.js'
import { useState, useEffect, useRef } from 'react'
import './Home.css'

// Animated Counter with Intersection Observer
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0)
    const [hasAnimated, setHasAnimated] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true)
                }
            },
            { threshold: 0.3 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [hasAnimated])

    useEffect(() => {
        if (!hasAnimated) return
        let start = 0
        const increment = target / (duration / 16)
        const timer = setInterval(() => {
            start += increment
            if (start >= target) {
                setCount(target)
                clearInterval(timer)
            } else {
                setCount(Math.floor(start))
            }
        }, 16)
        return () => clearInterval(timer)
    }, [hasAnimated, target, duration])

    return (
        <span ref={ref} className="counter-value">
            {count.toLocaleString()}{suffix}
        </span>
    )
}

// Floating Particles Component
function FloatingParticles() {
    return (
        <div className="particles-container">
            {[...Array(20)].map((_, i) => (
                <div key={i} className="particle"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${15 + Math.random() * 10}s`,
                    }}
                />
            ))}
        </div>
    )
}

function Home() {
    const { language } = useLanguage()
    const { categories } = useJobs()
    const { user } = useAuth()
    const [activeTestimonial, setActiveTestimonial] = useState(0)
    const [featuredJobs, setFeaturedJobs] = useState([])
    const [isLoadingJobs, setIsLoadingJobs] = useState(true)
    const [userLocation, setUserLocation] = useState(null)

    // Category icons mapping
    const categoryIcons = {
        'construction': '🏗️', 'electrical': '⚡', 'plumbing': '🔧', 'painting': '🎨',
        'cleaning': '🧹', 'cooking': '👨‍🍳', 'driving': '🚗', 'gardening': '🌱',
        'security': '🛡️', 'carpentry': '🪚', 'other': '💼'
    }

    // Get user's location from profile
    useEffect(() => {
        if (user?.location) {
            setUserLocation(user.location)
        }
    }, [user])

    // Fetch featured jobs from API - prioritize user's location
    useEffect(() => {
        const fetchFeaturedJobs = async () => {
            setIsLoadingJobs(true)
            try {
                // Build URL with location filter if user has a saved location
                let url = 'http://localhost:5000/api/jobs?limit=24&status=open'

                if (userLocation) {
                    // Extract city/district from user's location string
                    const locationParts = userLocation.split(',').map(s => s.trim())
                    const searchLocation = locationParts[0] || userLocation
                    url += `&location=${encodeURIComponent(searchLocation)}`
                }

                const response = await fetch(url)
                const data = await response.json()

                if (data.success && data.jobs && data.jobs.length > 0) {
                    setFeaturedJobs(data.jobs)
                } else if (userLocation) {
                    // If no jobs found for user's location, fetch nearby district jobs
                    const fallbackResponse = await fetch('http://localhost:5000/api/jobs?limit=24&status=open')
                    const fallbackData = await fallbackResponse.json()

                    if (fallbackData.success && fallbackData.jobs) {
                        // Sort to prioritize jobs matching user's location
                        const sortedJobs = fallbackData.jobs.sort((a, b) => {
                            const aMatches = a.location?.toLowerCase().includes(userLocation.toLowerCase().split(',')[0]) ? 1 : 0
                            const bMatches = b.location?.toLowerCase().includes(userLocation.toLowerCase().split(',')[0]) ? 1 : 0
                            return bMatches - aMatches
                        })
                        setFeaturedJobs(sortedJobs.slice(0, 24))
                    }
                } else {
                    // No user location - just get any jobs
                    const demoResponse = await import('../data/demoJobs.json')
                    setFeaturedJobs((demoResponse.default || demoResponse).slice(0, 24))
                }
            } catch (error) {
                console.error('Error fetching featured jobs:', error)
                // Fallback to demo data on error
                try {
                    const demoResponse = await import('../data/demoJobs.json')
                    setFeaturedJobs((demoResponse.default || demoResponse).slice(0, 24))
                } catch (e) {
                    console.error('Failed to load demo jobs:', e)
                }
            } finally {
                setIsLoadingJobs(false)
            }
        }
        fetchFeaturedJobs()
    }, [userLocation])

    // Testimonials
    const testimonials = [
        {
            id: 1, name: language === 'ta' ? 'முருகன் கே.' : 'Murugan K.',
            role: language === 'ta' ? 'கட்டுமான தொழிலாளி' : 'Construction Worker', location: 'Chennai', rating: 5,
            text: language === 'ta' ? 'DayCraft மூலம் தினமும் நல்ல வேலை கிடைக்கிறது. குடும்பத்தை நன்றாக பராமரிக்க முடிகிறது.' : 'DayCraft has transformed my life. I find quality work every day and can provide for my family better than ever before.',
            image: '👷'
        },
        {
            id: 2, name: language === 'ta' ? 'லட்சுமி ஆர்.' : 'Lakshmi R.',
            role: language === 'ta' ? 'வீட்டு உதவியாளர்' : 'House Helper', location: 'Coimbatore', rating: 5,
            text: language === 'ta' ? 'பாதுகாப்பான வேலை சூழல். நம்பகமான வேலை வழங்குனர்கள்.' : 'Safe working environment with verified employers. Payments are always on time and transparent.',
            image: '👩'
        },
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
        }, 6000)
        return () => clearInterval(timer)
    }, [testimonials.length])

    const howItWorks = [
        { icon: '📱', title: language === 'ta' ? 'பதிவு செய்க' : 'Sign Up', desc: language === 'ta' ? 'உங்கள் சுயவிவரத்தை உருவாக்குங்கள்' : 'Create your profile in minutes' },
        { icon: '🔍', title: language === 'ta' ? 'வேலை தேடு' : 'Find Jobs', desc: language === 'ta' ? 'அருகிலுள்ள வேலைகளைக் கண்டறியவும்' : 'Discover opportunities nearby' },
        { icon: '🤝', title: language === 'ta' ? 'இணைக்கவும்' : 'Connect', desc: language === 'ta' ? 'வேலை வழங்குனர்களை தொடர்புகொள்ளுங்கள்' : 'Chat with employers directly' },
        { icon: '💰', title: language === 'ta' ? 'சம்பளம்' : 'Get Paid', desc: language === 'ta' ? 'உடனடி கூலி பெறுங்கள்' : 'Receive instant payments' },
    ]

    const benefits = [
        { icon: '✅', title: language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified Users', desc: language === 'ta' ? 'அனைவரும் OTP உடன் சரிபார்க்கப்படுகிறார்கள்' : 'All users are OTP verified' },
        { icon: '⚡', title: language === 'ta' ? 'உடனடி கூலி' : 'Instant Pay', desc: language === 'ta' ? 'வேலை முடிந்ததும் உடனே பணம்' : 'Get paid immediately after work' },
        { icon: '📍', title: language === 'ta' ? 'அருகிலுள்ளவை' : 'Hyperlocal', desc: language === 'ta' ? 'நடந்து செல்லக்கூடிய தூரத்தில்' : 'Find work within walking distance' },
        { icon: '🛡️', title: language === 'ta' ? 'பாதுகாப்பு' : 'Secure', desc: language === 'ta' ? 'பாதுகாப்பான தளம்' : 'Safe and trusted platform' },
        { icon: '📱', title: language === 'ta' ? 'எளிய செயலி' : 'Easy App', desc: language === 'ta' ? 'யாரும் எளிதாக பயன்படுத்தலாம்' : 'Simple for everyone to use' },
        { icon: '🌐', title: language === 'ta' ? 'பல மொழிகள்' : 'Multi-language', desc: language === 'ta' ? 'தமிழ், ஆங்கிலம்' : 'Tamil & English support' },
    ]

    const partners = ['L&T', 'Tata Projects', 'Asian Paints', 'Godrej', 'Urban Company', 'HomeLane', 'Livspace', 'JSW']

    return (
        <div className="home-page">
            {/* HERO SECTION */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-gradient"></div>
                    <div className="hero-mesh"></div>
                    <FloatingParticles />
                </div>

                <div className="container hero-container">
                    <div className="hero-content">


                        <h1 className="hero-title animate-fadeInUp">
                            {language === 'ta' ? (
                                <>உங்கள் அருகில் <span className="text-gradient">வேலை</span> கண்டறியுங்கள்</>
                            ) : (
                                <>Find <span className="text-gradient">Work</span> Near You</>
                            )}
                        </h1>

                        <p className="hero-subtitle animate-fadeInUp delay-1">
                            {language === 'ta'
                                ? 'DayCraft தினசரி கூலி தொழிலாளர்களை சரிபார்க்கப்பட்ட உள்ளூர் வேலை வழங்குனர்களுடன் இணைக்கிறது. அருகிலுள்ள வேலைகளைக் கண்டறியுங்கள், விரைவாக வேலைக்கு அமருங்கள், எளிய நம்பகமான தளத்தின் மூலம் நிலையான வருமானத்தை உருவாக்குங்கள்.'
                                : 'DayCraft connects daily-wage workers with verified local employers. Find nearby jobs, get hired faster, and build steady income through a simple, trusted platform.'}
                        </p>

                        <div className="hero-cta animate-fadeInUp delay-2">
                            <Link to="/jobs" className="btn btn-primary btn-xl">
                                <span>🔍</span> {language === 'ta' ? 'வேலைகளைத் தேடு' : 'Find Jobs'}
                            </Link>
                            <Link to="/register" className="btn btn-white btn-xl">
                                <span>📝</span> {language === 'ta' ? 'வேலை வழங்கு' : 'Post a Job'}
                            </Link>
                        </div>

                        <div className="hero-stats animate-fadeInUp delay-3">
                            <div className="hero-stat glass-card">
                                <span className="stat-value"><AnimatedCounter target={50} suffix="K+" /></span>
                                <span className="stat-label">{language === 'ta' ? 'தொழிலாளர்கள்' : 'Workers'}</span>
                            </div>
                            <div className="hero-stat glass-card">
                                <span className="stat-value"><AnimatedCounter target={100} suffix="K+" /></span>
                                <span className="stat-label">{language === 'ta' ? 'வேலைகள்' : 'Jobs Done'}</span>
                            </div>
                            <div className="hero-stat glass-card">
                                <span className="stat-value">4.9</span>
                                <span className="stat-label">{language === 'ta' ? 'மதிப்பீடு' : 'Rating'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="hero-visual animate-fadeInRight delay-2">
                        <div className="hero-card-stack">
                            <div className="hero-main-card glass-card">
                                <img src="/hero-background.png" alt="Workers" className="hero-image" />
                            </div>
                            <div className="floating-badge badge-1 glass">
                                <span className="fb-icon">✅</span>
                                <span className="fb-text">{language === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified'}</span>
                            </div>
                            <div className="floating-badge badge-2 glass">
                                <span className="fb-icon">💰</span>
                                <span className="fb-text">₹800/day</span>
                            </div>
                            <div className="floating-badge badge-3 glass">
                                <span className="fb-icon">⭐</span>
                                <span className="fb-text">4.9 Rating</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUST BAR */}
            <section className="trust-bar">
                <div className="container">
                    <div className="trust-items">
                        <div className="trust-item"><span>✅</span> {language === 'ta' ? 'OTP சரிபார்க்கப்பட்டது' : 'OTP Verified'}</div>
                        <div className="trust-item"><span>🛡️</span> {language === 'ta' ? 'நம்பகமான வேலையளிப்போர்' : 'Trusted Employers'}</div>
                        <div className="trust-item"><span>📍</span> {language === 'ta' ? 'இட அடிப்படை' : 'Location-Based'}</div>
                        <div className="trust-item"><span>⚡</span> {language === 'ta' ? 'உடனடி கூலி' : 'Instant Payments'}</div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="how-it-works section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">{language === 'ta' ? 'எப்படி செயல்படுகிறது' : 'How It Works'}</span>
                        <h2>{language === 'ta' ? 'எளிய 4 படிகளில் தொடங்குங்கள்' : 'Get Started in 4 Simple Steps'}</h2>
                    </div>
                    <div className="steps-container">
                        {howItWorks.map((step, i) => (
                            <div key={i} className="step-card glass-card" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="step-number">{i + 1}</div>
                                <div className="step-icon">{step.icon}</div>
                                <h4>{step.title}</h4>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURED JOBS */}
            <section className="featured-section section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">
                            {userLocation
                                ? (language === 'ta' ? `📍 ${userLocation} வேலைகள்` : `📍 Jobs in ${userLocation}`)
                                : (language === 'ta' ? 'சிறப்பு வேலைகள்' : 'Featured Jobs')
                            }
                        </span>
                        <h2>
                            {userLocation
                                ? (language === 'ta' ? 'உங்கள் அருகிலுள்ள வேலைகள்' : 'Jobs Near You')
                                : (language === 'ta' ? 'இன்றைய சிறந்த வாய்ப்புகள்' : 'Today\'s Top Opportunities')
                            }
                        </h2>
                    </div>
                    <div className="featured-grid">
                        {isLoadingJobs ? (
                            // Skeleton loading state
                            [...Array(8)].map((_, i) => (
                                <div key={i} className="featured-card card-premium skeleton-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="fc-header">
                                        <div className="skeleton-icon"></div>
                                    </div>
                                    <div className="skeleton-title"></div>
                                    <div className="skeleton-text"></div>
                                    <div className="skeleton-text short"></div>
                                    <div className="fc-footer">
                                        <div className="skeleton-wage"></div>
                                        <div className="skeleton-btn"></div>
                                    </div>
                                </div>
                            ))
                        ) : featuredJobs.length > 0 ? (
                            featuredJobs.map((job, i) => {
                                const title = job.title?.[language] || job.title?.en || job.title || ''
                                const categoryIcon = getDetailedIcon(job.title, job.category)
                                return (
                                    <Link to={`/jobs/${job._id || job.id}`} key={job._id || job.id} className="featured-card card-premium" style={{ animationDelay: `${(i % 10) * 0.05}s` }}>
                                        <div className="fc-header">
                                            <div className="fc-category">{categoryIcon}</div>
                                            {job.urgent && <span className="badge badge-error">🔥 {language === 'ta' ? 'அவசரம்' : 'Urgent'}</span>}
                                        </div>
                                        <h4 className="fc-title">{title}</h4>
                                        <p className="fc-employer">{job.employer?.name || 'Employer'}</p>
                                        <div className="fc-meta">
                                            <span className="fc-location">📍 {job.location}</span>
                                        </div>
                                        <div className="fc-footer">
                                            <div className="fc-wage">
                                                <span className="wage-amount">₹{job.wage?.toLocaleString() || '--'}</span>
                                                <span className="wage-period">/{language === 'ta' ? 'நாள்' : 'day'}</span>
                                            </div>
                                            <span className="btn btn-primary btn-sm">{language === 'ta' ? 'விண்ணப்பி' : 'Apply'}</span>
                                        </div>
                                    </Link>
                                )
                            })
                        ) : (
                            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>
                                {language === 'ta' ? 'வேலைகள் இல்லை' : 'No jobs available'}
                            </p>
                        )}
                    </div>
                    <div className="text-center mt-8">
                        <Link to="/jobs" className="btn btn-outline btn-lg">{language === 'ta' ? 'அனைத்து வேலைகளும்' : 'View All Jobs'} →</Link>
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section className="categories-section section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">{language === 'ta' ? 'வகைகள்' : 'Categories'}</span>
                        <h2>{language === 'ta' ? 'திறமை வாரியாக தேடுங்கள்' : 'Browse by Specialty'}</h2>
                    </div>
                    <div className="categories-grid">
                        {categories.map((cat, i) => (
                            <Link to={`/jobs?category=${cat.id}`} key={cat.id} className="category-card glass-card" style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="cat-icon">{cat.icon}</div>
                                <div className="cat-name">{language === 'ta' ? cat.name.ta : cat.name.en}</div>
                                <div className="cat-count">{cat.jobCount || 0}+ {language === 'ta' ? 'வேலைகள்' : 'Jobs'}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* BENEFITS */}
            <section className="benefits-section section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">{language === 'ta' ? 'ஏன் நாங்கள்' : 'Why Choose Us'}</span>
                        <h2>{language === 'ta' ? 'DayCraft சிறப்புகள்' : 'The DayCraft Advantage'}</h2>
                    </div>
                    <div className="benefits-grid">
                        {benefits.map((b, i) => (
                            <div key={i} className="benefit-card" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="benefit-icon">{b.icon}</div>
                                <h4>{b.title}</h4>
                                <p>{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="testimonials-section section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">{language === 'ta' ? 'வெற்றிக் கதைகள்' : 'Success Stories'}</span>
                        <h2>{language === 'ta' ? 'பயனர்கள் கூறுவது' : 'What Our Users Say'}</h2>
                    </div>
                    <div className="testimonial-container">
                        {testimonials.map((t, i) => (
                            <div key={t.id} className={`testimonial-card glass-card ${i === activeTestimonial ? 'active' : ''}`}>
                                <div className="t-stars">{'⭐'.repeat(t.rating)}</div>
                                <p className="t-text">"{t.text}"</p>
                                <div className="t-author">
                                    <div className="t-avatar">{t.image}</div>
                                    <div className="t-info">
                                        <strong>{t.name}</strong>
                                        <span>{t.role} • 📍 {t.location}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="testimonial-dots">
                        {testimonials.map((_, i) => (
                            <button key={i} className={`dot ${i === activeTestimonial ? 'active' : ''}`} onClick={() => setActiveTestimonial(i)} />
                        ))}
                    </div>
                </div>
            </section>

            {/* GLOBAL STATS */}
            <section className="global-stats-section section">
                <div className="container">
                    <div className="stats-grid">
                        <div className="global-stat">
                            <span className="gs-value"><AnimatedCounter target={50000} suffix="+" /></span>
                            <span className="gs-label">{language === 'ta' ? 'பதிவு செய்யப்பட்ட தொழிலாளர்கள்' : 'Registered Workers'}</span>
                        </div>
                        <div className="global-stat">
                            <span className="gs-value"><AnimatedCounter target={100000} suffix="+" /></span>
                            <span className="gs-label">{language === 'ta' ? 'முடிக்கப்பட்ட வேலைகள்' : 'Jobs Completed'}</span>
                        </div>
                        <div className="global-stat">
                            <span className="gs-value"><AnimatedCounter target={500} suffix="+" /></span>
                            <span className="gs-label">{language === 'ta' ? 'நகரங்கள்' : 'Cities Covered'}</span>
                        </div>
                        <div className="global-stat">
                            <span className="gs-value">4.9<span className="gs-suffix">/5</span></span>
                            <span className="gs-label">{language === 'ta' ? 'மதிப்பீடு' : 'Avg. Rating'}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* PARTNERS */}
            <section className="partners-section section-sm">
                <div className="container">
                    <p className="partners-label">{language === 'ta' ? 'நம்பகமான கூட்டாளர்கள்' : 'Trusted by leading companies'}</p>
                    <div className="partners-marquee">
                        <div className="partners-track">
                            {[...partners, ...partners].map((p, i) => (
                                <div key={i} className="partner-logo">{p}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section section">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-bg"></div>
                        <div className="cta-content">
                            <h2>{language === 'ta' ? 'இன்றே தொடங்குங்கள்' : 'Ready to Get Started?'}</h2>
                            <p>{language === 'ta' ? 'ஆயிரக்கணக்கான தொழிலாளர்கள் மற்றும் வேலை வழங்குனர்களுடன் இணைய பதிவு செய்யுங்கள்.' : 'Join thousands of workers and employers finding success on DayCraft.'}</p>
                            <div className="cta-buttons">
                                <Link to="/register" className="btn btn-white btn-xl">👷 {language === 'ta' ? 'தொழிலாளியாக சேர்க' : 'Join as Worker'}</Link>
                                <Link to="/register" className="btn btn-outline-white btn-xl">💼 {language === 'ta' ? 'வேலை வழங்குனராக' : 'Hire Workers'}</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <h3>DayCraft</h3>
                            <p>{language === 'ta' ? 'இந்தியாவின் #1 தினசரி கூலி வேலை தளம்' : 'India\'s #1 daily-wage job platform'}</p>
                            <div className="social-links">
                                <a href="#">📘</a><a href="#">🐦</a><a href="#">📷</a><a href="#">💼</a>
                            </div>
                        </div>
                        <div className="footer-links">
                            <h4>{language === 'ta' ? 'விரைவு இணைப்புகள்' : 'Quick Links'}</h4>
                            <ul>
                                <li><Link to="/jobs">{language === 'ta' ? 'வேலைகள்' : 'Find Jobs'}</Link></li>
                                <li><Link to="/workers">{language === 'ta' ? 'தொழிலாளர்கள்' : 'Find Workers'}</Link></li>
                                <li><Link to="/register">{language === 'ta' ? 'பதிவு' : 'Register'}</Link></li>
                            </ul>
                        </div>
                        <div className="footer-links">
                            <h4>{language === 'ta' ? 'ஆதரவு' : 'Support'}</h4>
                            <ul>
                                <li><a href="#">{language === 'ta' ? 'உதவி' : 'Help'}</a></li>
                                <li><a href="#">{language === 'ta' ? 'தொடர்பு' : 'Contact'}</a></li>
                                <li><a href="#">{language === 'ta' ? 'தனியுரிமை' : 'Privacy'}</a></li>
                            </ul>
                        </div>
                        <div className="footer-newsletter">
                            <h4>{language === 'ta' ? 'புதுப்பிப்புகள்' : 'Stay Updated'}</h4>
                            <p>{language === 'ta' ? 'புதிய வேலைகளைப் பெறுங்கள்' : 'Get notified about new jobs'}</p>
                            <div className="newsletter-form">
                                <input type="email" placeholder={language === 'ta' ? 'மின்னஞ்சல்' : 'Email'} className="form-input" />
                                <button
                                    className="btn btn-primary"
                                    onClick={() => alert(language === 'ta' ? 'நன்றி! நீங்கள் இணைந்தீர்கள்.' : 'Thanks for joining!')}
                                >
                                    {language === 'ta' ? 'சேர்' : 'Join'}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>© 2026 DayCraft. {language === 'ta' ? 'அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.' : 'All rights reserved.'}</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home
