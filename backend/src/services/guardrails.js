/**
 * Guardrails Service
 * Enforces rate limits, token budgets, and abuse detection
 */

// ============ RATE LIMITER ============
class RateLimiter {
    constructor(options = {}) {
        this.maxRequestsPerHour = options.maxRequestsPerHour || 50
        this.maxRequestsPerMinute = options.maxRequestsPerMinute || 10
        this.userRequests = new Map() // userId -> { hourly: [], minutely: [] }
    }

    /**
     * Check if user is within rate limits
     * @param {string} userId - User identifier (IP or user ID)
     * @returns {{ allowed: boolean, reason?: string, retryAfter?: number }}
     */
    checkLimit(userId) {
        const now = Date.now()
        const oneHourAgo = now - 3600000
        const oneMinuteAgo = now - 60000

        // Initialize user record if not exists
        if (!this.userRequests.has(userId)) {
            this.userRequests.set(userId, { hourly: [], minutely: [] })
        }

        const userRecord = this.userRequests.get(userId)

        // Clean up old entries
        userRecord.hourly = userRecord.hourly.filter(t => t > oneHourAgo)
        userRecord.minutely = userRecord.minutely.filter(t => t > oneMinuteAgo)

        // Check minute limit
        if (userRecord.minutely.length >= this.maxRequestsPerMinute) {
            const oldestMinute = userRecord.minutely[0]
            const retryAfter = Math.ceil((oldestMinute + 60000 - now) / 1000)
            console.log(`⚠️ Rate limit (minute): User ${userId} exceeded ${this.maxRequestsPerMinute} req/min`)
            return {
                allowed: false,
                reason: 'rate_limit_minute',
                retryAfter,
                message: `Too many requests. Please wait ${retryAfter} seconds.`
            }
        }

        // Check hour limit
        if (userRecord.hourly.length >= this.maxRequestsPerHour) {
            const oldestHour = userRecord.hourly[0]
            const retryAfter = Math.ceil((oldestHour + 3600000 - now) / 1000)
            console.log(`⚠️ Rate limit (hour): User ${userId} exceeded ${this.maxRequestsPerHour} req/hr`)
            return {
                allowed: false,
                reason: 'rate_limit_hour',
                retryAfter,
                message: `Hourly limit reached. Please wait ${Math.ceil(retryAfter / 60)} minutes.`
            }
        }

        return { allowed: true }
    }

    /**
     * Record a request for a user
     * @param {string} userId - User identifier
     */
    recordRequest(userId) {
        const now = Date.now()

        if (!this.userRequests.has(userId)) {
            this.userRequests.set(userId, { hourly: [], minutely: [] })
        }

        const userRecord = this.userRequests.get(userId)
        userRecord.hourly.push(now)
        userRecord.minutely.push(now)
    }

    /**
     * Get current usage stats for a user
     * @param {string} userId 
     */
    getStats(userId) {
        if (!this.userRequests.has(userId)) {
            return { hourlyUsed: 0, minutelyUsed: 0 }
        }

        const now = Date.now()
        const userRecord = this.userRequests.get(userId)

        return {
            hourlyUsed: userRecord.hourly.filter(t => t > now - 3600000).length,
            hourlyLimit: this.maxRequestsPerHour,
            minutelyUsed: userRecord.minutely.filter(t => t > now - 60000).length,
            minutelyLimit: this.maxRequestsPerMinute
        }
    }

    /**
     * Reset limits for a user (admin function)
     */
    resetUser(userId) {
        this.userRequests.delete(userId)
    }
}

// Singleton instance
const rateLimiter = new RateLimiter({
    maxRequestsPerHour: 100,   // Generous limit
    maxRequestsPerMinute: 15   // Burst protection
})

// ============ TOKEN BUDGET ============
const TOKEN_LIMITS = {
    maxInputTokens: 500,      // Max tokens in user message
    maxOutputTokens: 300,     // Max tokens in AI response
    maxHistoryTokens: 2000    // Max tokens in conversation history
}

/**
 * Estimate token count (rough approximation: ~4 chars per token)
 */
function estimateTokens(text) {
    return Math.ceil(text.length / 4)
}

/**
 * Check if message is within token budget
 */
function checkTokenBudget(message, history = []) {
    const messageTokens = estimateTokens(message)

    if (messageTokens > TOKEN_LIMITS.maxInputTokens) {
        return {
            allowed: false,
            reason: 'message_too_long',
            message: `Message is too long (${messageTokens} tokens). Please keep it under ${TOKEN_LIMITS.maxInputTokens} tokens (~${TOKEN_LIMITS.maxInputTokens * 4} characters).`
        }
    }

    const historyTokens = history.reduce((sum, msg) => sum + estimateTokens(msg.content || ''), 0)
    if (historyTokens > TOKEN_LIMITS.maxHistoryTokens) {
        // Silently truncate history, don't block user
        console.log(`⚠️ History truncated: ${historyTokens} tokens > ${TOKEN_LIMITS.maxHistoryTokens} limit`)
    }

    return { allowed: true }
}

// ============ ABUSE DETECTION ============
const ABUSE_WORDS = [
    'fuck', 'shit', 'damn', 'bastard', 'idiot', 'stupid',
    'kill', 'die', 'hate', 'racist', 'xxx'
]

const SPAM_PATTERNS = [
    /(.)\1{10,}/,              // Repeated characters: "aaaaaaaaaa"
    /(\b\w+\b)(\s+\1){5,}/i,   // Repeated words: "hello hello hello..."
]

/**
 * Check message for abuse or spam
 */
function checkAbuse(message) {
    const lower = message.toLowerCase()

    // Check for abuse words
    for (const word of ABUSE_WORDS) {
        if (lower.includes(word)) {
            console.log(`🚫 Abuse detected: "${word}"`)
            return {
                isAbusive: true,
                reason: 'inappropriate_language',
                message: "Please keep the conversation respectful. I'm here to help you!"
            }
        }
    }

    // Check for spam patterns
    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(message)) {
            console.log('🚫 Spam pattern detected')
            return {
                isAbusive: true,
                reason: 'spam_detected',
                message: "That looks like spam. Please send a genuine message."
            }
        }
    }

    return { isAbusive: false }
}

// ============ MAIN GUARDRAILS CHECK ============
/**
 * Run all guardrail checks on a request
 * @param {Object} params
 * @param {string} params.userId - User identifier
 * @param {string} params.message - User message
 * @param {Array} params.history - Conversation history
 * @returns {{ allowed: boolean, reason?: string, message?: string }}
 */
function runGuardrails({ userId, message, history = [] }) {
    console.log('\n🛡️ Running Guardrails...')

    // 1. Check abuse first (blocks malicious content regardless of limits)
    const abuseCheck = checkAbuse(message)
    if (abuseCheck.isAbusive) {
        return {
            allowed: false,
            ...abuseCheck
        }
    }

    // 2. Check rate limits
    const rateCheck = rateLimiter.checkLimit(userId)
    if (!rateCheck.allowed) {
        return {
            allowed: false,
            ...rateCheck
        }
    }

    // 3. Check token budget
    const tokenCheck = checkTokenBudget(message, history)
    if (!tokenCheck.allowed) {
        return {
            allowed: false,
            ...tokenCheck
        }
    }

    // 4. Record the request
    rateLimiter.recordRequest(userId)

    console.log('✅ Guardrails passed')
    return { allowed: true }
}

module.exports = {
    runGuardrails,
    rateLimiter,
    checkAbuse,
    checkTokenBudget,
    estimateTokens,
    TOKEN_LIMITS
}
