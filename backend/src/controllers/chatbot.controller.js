/**
 * Chatbot Controller - Handles AI help chatbot requests
 * Now uses AI Orchestrator for intelligent routing
 * Protected by Guardrails for rate limiting and abuse detection
 */

const { getChatResponse } = require('../services/groqService')
const { orchestrateChat, responseCache } = require('../services/aiOrchestrator')
const { runGuardrails, rateLimiter } = require('../services/guardrails')

// @desc    Get AI chatbot response
// @route   POST /api/chatbot/message
// @access  Public
exports.sendMessage = async (req, res) => {
    try {
        const { message, history = [], language = 'en', authContext = {} } = req.body

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            })
        }

        // Get user identifier (IP or user ID)
        const userId = authContext.userId || req.ip || 'anonymous'

        // Convert history to standardized format {role, content}
        const conversationHistory = history.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.text
        }))

        // 0. Run Guardrails first (rate limiting, abuse detection, token budget)
        const guardrailResult = runGuardrails({
            userId,
            message,
            history: conversationHistory
        })

        if (!guardrailResult.allowed) {
            console.log(`🛡️ Request blocked: ${guardrailResult.reason}`)
            return res.status(429).json({
                success: false,
                message: guardrailResult.message,
                reason: guardrailResult.reason,
                retryAfter: guardrailResult.retryAfter
            })
        }

        // 1. Try AI Orchestrator first (handles FAQ, navigation, job queries, cache)
        const orchestratedResponse = await orchestrateChat(message, conversationHistory, language, authContext)

        if (orchestratedResponse) {
            // Orchestrator handled the request (no LLM needed!)
            console.log(`✅ Response served by: ${orchestratedResponse.source}`)
            return res.json({
                success: true,
                response: orchestratedResponse
            })
        }

        // 2. Fall back to LLM for complex queries
        console.log('🤖 Falling back to LLM...')
        const chatResponse = await getChatResponse(message, conversationHistory, language)

        res.json({
            success: true,
            response: { ...chatResponse, source: 'llm' }
        })

    } catch (error) {
        console.error('Chatbot error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to get AI response',
            error: error.message
        })
    }
}

// @desc    Get chatbot health status
// @route   GET /api/chatbot/health
// @access  Public
exports.getHealth = async (req, res) => {
    const hasApiKey = !!process.env.GROQ_API_KEY
    const cacheStats = responseCache.getStats()

    res.json({
        success: true,
        status: hasApiKey ? 'ready' : 'not_configured',
        model: 'llama-3.1-8b-instant',
        provider: 'Groq',
        features: [
            'ai_orchestrator',
            'intent_classification',
            'smart_caching',
            'guardrails',
            'rate_limiting',
            'function_calling'
        ],
        cache: cacheStats
    })
}
