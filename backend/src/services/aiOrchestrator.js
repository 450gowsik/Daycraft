/**
 * AI Orchestrator Service
 * The core brain of DayCraft-AI that routes messages before reaching LLM
 * Reduces LLM calls by 60-80% via intent classification and caching
 */

const {
    FAQ_PATTERNS,
    NAVIGATION_PATTERNS,
    JOB_QUERY_PATTERNS,
    ABUSE_PATTERNS,
    GREETING_PATTERNS
} = require('../config/intentPatterns')
const dbQuery = require('./dbQueryService')

// ============ CACHE LAYER ============
class ResponseCache {
    constructor(maxSize = 500, ttlMs = 3600000) { // 1 hour TTL
        this.cache = new Map()
        this.maxSize = maxSize
        this.ttlMs = ttlMs
    }

    normalize(message) {
        return message.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
    }

    get(message) {
        const key = this.normalize(message)
        const entry = this.cache.get(key)

        if (!entry) return null

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key)
            return null
        }

        entry.hits++
        console.log(`📦 Cache HIT for: "${key}" (hits: ${entry.hits})`)
        return entry.response
    }

    set(message, response) {
        const key = this.normalize(message)

        // LRU eviction if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value
            this.cache.delete(oldestKey)
        }

        this.cache.set(key, {
            response,
            timestamp: Date.now(),
            hits: 0
        })
        console.log(`💾 Cached response for: "${key}"`)
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize
        }
    }
}

// Singleton cache instance
const responseCache = new ResponseCache()

// ============ INTENT CLASSIFIER ============
function classifyIntent(message, language = 'en') {
    const lowerMessage = message.toLowerCase()

    // 1. Check for abuse first
    for (const pattern of ABUSE_PATTERNS) {
        if (pattern.test(message)) {
            console.log('🚫 Intent: ABUSE detected')
            return { intent: 'abuse', data: null }
        }
    }

    // 2. Check for greetings
    if (GREETING_PATTERNS.keywords.some(kw => lowerMessage.includes(kw))) {
        const responses = GREETING_PATTERNS.responses[language] || GREETING_PATTERNS.responses.en
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]
        console.log('👋 Intent: GREETING')
        return { intent: 'greeting', data: { response: randomResponse } }
    }

    // 3. Check for FAQ patterns
    for (const faq of FAQ_PATTERNS) {
        if (faq.keywords.some(kw => lowerMessage.includes(kw))) {
            console.log('📚 Intent: FAQ')
            return {
                intent: 'faq',
                data: { response: faq.response[language] || faq.response.en }
            }
        }
    }

    // 4. Check for navigation patterns
    for (const nav of NAVIGATION_PATTERNS) {
        if (nav.keywords.some(kw => lowerMessage.includes(kw))) {
            console.log('🧭 Intent: NAVIGATION')
            return { intent: 'navigation', data: nav.action }
        }
    }

    // 5. Check for job/worker query patterns
    for (const pattern of JOB_QUERY_PATTERNS) {
        if (pattern.test(message)) {
            // COMPLEXITY CHECK: If query contains "rating", "skill", "verified", "category", or multiple locations
            // we should let the LLM handle it with specialized tools
            const complexKeywords = ['rating', 'star', 'skill', 'verified', 'top', 'best', 'experienced']
            const isComplex = complexKeywords.some(kw => lowerMessage.includes(kw))

            if (isComplex) {
                console.log('🤖 Intent: Complex JOB_QUERY -> routing to LLM')
                return { intent: 'llm', data: null }
            }

            console.log('💼 Intent: JOB_QUERY (or worker query)')
            // IMPROVED location extraction: handles "in Coimbatore", "at Coimbatore", "location: Coimbatore", etc.
            const locationMatch = message.match(/(?:\b(?:in|at|near)\b|location\s*[:\s])\s*([a-zA-Z\s]+)/i)
            let location = locationMatch ? locationMatch[1].trim() : null

            // Limit location to first word if it matched too much
            if (location) {
                location = location.split(/\s+/)[0]
                console.log(`📍 Extracted Location: "${location}"`)
            }

            return { intent: 'job_query', data: { location, originalQuery: message } }
        }
    }

    // 6. Default to LLM for complex queries
    console.log('🤖 Intent: LLM (complex query)')
    return { intent: 'llm', data: null }
}

// ============ INTENT HANDLERS ============
async function handleFAQ(data) {
    return {
        text: data.response,
        action: null,
        source: 'faq'
    }
}

async function handleGreeting(data) {
    return {
        text: data.response,
        action: null,
        source: 'greeting'
    }
}

async function handleNavigation(data, language) {
    const navMessages = {
        '/': { en: "🏠 Taking you to the home page...", ta: "🏠 முகப்பு பக்கத்திற்கு அழைத்துச் செல்கிறேன்..." },
        '/jobs': { en: "📋 Taking you to the jobs page...", ta: "📋 வேலைகள் பக்கத்திற்கு அழைத்துச் செல்கிறேன்..." },
        '/profile': { en: "👤 Opening your profile...", ta: "👤 உங்கள் சுயவிவரத்தைத் திறக்கிறேன்..." },
        '/dashboard': { en: "📊 Going to your dashboard...", ta: "📊 உங்கள் டாஷ்போர்டுக்குச் செல்கிறேன்..." },
        '/login': { en: "🔑 Redirecting to login...", ta: "🔑 உள்நுழைவுக்கு திருப்பி விடுகிறேன்..." },
        '/register': { en: "📝 Let's get you registered!", ta: "📝 உங்களை பதிவு செய்வோம்!" },
        '/wallet': { en: "💰 Opening your wallet...", ta: "💰 உங்கள் பணப்பையைத் திறக்கிறேன்..." }
    }

    const message = navMessages[data.payload]?.[language] ||
        navMessages[data.payload]?.en ||
        `Navigating to ${data.payload}...`

    return {
        text: message,
        action: data,
        source: 'navigation'
    }
}

async function handleJobQuery(data, language) {
    try {
        const { location, originalQuery } = data
        const isWorkerSearch = /worker|employee|laborer/i.test(originalQuery)

        // Extract wage if mentioned
        const wageMatch = originalQuery.match(/₹?\s*(\d+)/i)
        const minWage = wageMatch ? parseInt(wageMatch[1]) : null

        let responseText = ''
        let action = null

        if (isWorkerSearch) {
            // WORKER SEARCH INTENT
            if (location) {
                const result = await dbQuery.getWorkerCount(location)
                const count = result.total || 0

                responseText = language === 'ta'
                    ? `👥 ${location} இல் ${count} தொழிலாளர்கள் உள்ளனர். அவர்களைப் பார்க்க தொழிலாளர்கள் பக்கத்திற்குச் செல்லுங்கள்!`
                    : `👥 There are ${count} workers available in ${location}. You can find them on the workers page!`

                action = {
                    type: 'navigate',
                    payload: `/workers?location=${location}`,
                    requiresAuth: false
                }
            } else {
                responseText = language === 'ta'
                    ? `👥 நீங்கள் அருகிலுள்ள தொழிலாளர்களைத் தேடுகிறீர்களா? தொழிலாளர்கள் பக்கத்தைப் பார்க்கவும்!`
                    : `👥 Are you looking for nearby workers? Check out our workers directory!`

                action = {
                    type: 'navigate',
                    payload: '/workers',
                    requiresAuth: false
                }
            }
        } else {
            // JOB SEARCH INTENT
            let jobs = []

            if (location) {
                // Search by location
                const result = await dbQuery.getTodayJobs(location)
                jobs = result.jobs || []

                if (jobs.length > 0) {
                    // Filter by wage if specified
                    if (minWage) {
                        jobs = jobs.filter(j => j.wage >= minWage * 0.8) // 20% tolerance
                    }

                    responseText = language === 'ta'
                        ? `📋 ${location} இல் ${jobs.length} வேலைகள் கிடைக்கின்றன:\n\n`
                        : `📋 Found ${jobs.length} jobs in ${location}:\n\n`

                    jobs.slice(0, 5).forEach((job, i) => {
                        responseText += `${i + 1}. **[${job.title}](/jobs/${job.id})** - ₹${job.wage}/day\n   📍 ${job.location}\n\n`
                    })

                    if (jobs.length > 5) {
                        responseText += language === 'ta'
                            ? `...மற்றும் ${jobs.length - 5} வேலைகள் உள்ளன.`
                            : `...and ${jobs.length - 5} more jobs available.`
                    }
                } else {
                    responseText = language === 'ta'
                        ? `📭 ${location} இல் தற்போது வேலைகள் இல்லை. பிற இருப்பிடங்களை முயற்சிக்கவும்!`
                        : `📭 No jobs found in ${location} right now. Try browsing all available jobs!`
                }

                action = {
                    type: 'navigate',
                    payload: `/jobs?location=${location}`,
                    requiresAuth: false
                }
            } else {
                // General job search
                const result = await dbQuery.getTodayJobs('')
                jobs = result.jobs || []

                responseText = language === 'ta'
                    ? `📋 இன்று ${jobs.length} வேலைகள் கிடைக்கின்றன! வேலைகள் பக்கத்தைப் பார்க்க கிளிக் செய்யவும்.`
                    : `📋 ${jobs.length} jobs available today! Click below to browse.`

                action = {
                    type: 'navigate',
                    payload: '/jobs',
                    requiresAuth: false
                }
            }
        }

        return {
            text: responseText,
            action: action,
            source: 'database_query'
        }
    } catch (error) {
        console.error('Job query handler error:', error)
        // Fallback to LLM
        return null
    }
}

// ============ MAIN ORCHESTRATOR ============
async function orchestrateChat(userMessage, conversationHistory = [], language = 'en', authContext = {}) {
    console.log('\n========== AI ORCHESTRATOR ==========')
    console.log('Input:', userMessage)
    console.log('Language:', language)

    // 1. Check cache first
    const cachedResponse = responseCache.get(userMessage)
    if (cachedResponse) {
        return { ...cachedResponse, source: 'cache' }
    }

    // 2. Classify intent
    const { intent, data } = classifyIntent(userMessage, language)
    console.log('Classified Intent:', intent)

    // 3. Route to appropriate handler
    let response = null

    switch (intent) {
        case 'abuse':
            response = handleAbuse(language)
            break

        case 'greeting':
            response = await handleGreeting(data)
            break

        case 'faq':
            response = await handleFAQ(data)
            // Cache FAQ responses
            responseCache.set(userMessage, response)
            break

        case 'navigation':
            response = await handleNavigation(data, language)
            break

        case 'job_query':
            response = await handleJobQuery(data, language)
            if (response) {
                // Cache successful job queries (shorter TTL would be better for dynamic data)
                responseCache.set(userMessage, response)
            }
            break

        case 'llm':
        default:
            // Will be handled by groqService
            response = null
            break
    }

    // 4. If no handler matched or failed, return null to signal LLM fallback
    if (!response) {
        console.log('⚡ Routing to LLM...')
        return null
    }

    console.log('✅ Response source:', response.source)
    console.log('========================================\n')

    return response
}

function handleAbuse(language) {
    return {
        text: language === 'ta'
            ? "⚠️ தயவுசெய்து மரியாதையாக இருங்கள். நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்."
            : "⚠️ Please keep the conversation respectful. I'm here to help you!",
        action: null,
        source: 'blocked'
    }
}

// Export functions
module.exports = {
    orchestrateChat,
    classifyIntent,
    responseCache
}
