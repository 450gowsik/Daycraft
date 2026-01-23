/**
 * Model Router Service
 * Handles smart model selection and automatic fallback
 */

// ============ MODEL CONFIGURATION ============
const MODELS = {
    primary: {
        name: 'llama-3.1-8b-instant',
        maxTokens: 1000,
        timeout: 15000,   // 15 seconds
        supportsTools: true
    },
    fallback: {
        name: 'gemma2-9b-it',
        maxTokens: 800,
        timeout: 20000,   // 20 seconds
        supportsTools: true
    },
    emergency: {
        name: 'llama-3.2-1b-preview',
        maxTokens: 500,
        timeout: 10000,   // 10 seconds
        supportsTools: false
    }
}

// ============ MODEL HEALTH TRACKING ============
class ModelHealth {
    constructor() {
        this.health = new Map()
        this.cooldownPeriod = 300000  // 5 minutes cooldown after failures
        this.maxConsecutiveFailures = 3

        // Initialize health for all models
        Object.keys(MODELS).forEach(key => {
            this.health.set(MODELS[key].name, {
                consecutiveFailures: 0,
                lastFailure: null,
                isHealthy: true,
                totalRequests: 0,
                totalFailures: 0
            })
        })
    }

    /**
     * Check if model is healthy (not in cooldown)
     */
    isHealthy(modelName) {
        const status = this.health.get(modelName)
        if (!status) return true

        // If model was unhealthy, check if cooldown period has passed
        if (!status.isHealthy) {
            const timeSinceFailure = Date.now() - status.lastFailure
            if (timeSinceFailure > this.cooldownPeriod) {
                // Reset health
                status.isHealthy = true
                status.consecutiveFailures = 0
                console.log(`🔄 Model ${modelName} health reset after cooldown`)
            }
        }

        return status.isHealthy
    }

    /**
     * Record a successful request
     */
    recordSuccess(modelName) {
        const status = this.health.get(modelName)
        if (status) {
            status.consecutiveFailures = 0
            status.isHealthy = true
            status.totalRequests++
            console.log(`✅ ${modelName}: Request successful`)
        }
    }

    /**
     * Record a failed request
     */
    recordFailure(modelName, error) {
        const status = this.health.get(modelName)
        if (status) {
            status.consecutiveFailures++
            status.lastFailure = Date.now()
            status.totalFailures++
            status.totalRequests++

            // Mark unhealthy if too many consecutive failures
            if (status.consecutiveFailures >= this.maxConsecutiveFailures) {
                status.isHealthy = false
                console.log(`⚠️ ${modelName}: Marked UNHEALTHY after ${status.consecutiveFailures} consecutive failures`)
            }

            console.log(`❌ ${modelName}: Request failed (${status.consecutiveFailures}/${this.maxConsecutiveFailures})`)
        }
    }

    /**
     * Get all model health stats
     */
    getStats() {
        const stats = {}
        this.health.forEach((value, key) => {
            stats[key] = {
                isHealthy: value.isHealthy,
                consecutiveFailures: value.consecutiveFailures,
                successRate: value.totalRequests > 0
                    ? ((value.totalRequests - value.totalFailures) / value.totalRequests * 100).toFixed(1) + '%'
                    : 'N/A'
            }
        })
        return stats
    }
}

// Singleton instance
const modelHealth = new ModelHealth()

// ============ MODEL ROUTER ============
/**
 * Select the best available model
 * @returns {{ name: string, config: Object }}
 */
function selectModel() {
    // Try primary first
    if (modelHealth.isHealthy(MODELS.primary.name)) {
        return { name: MODELS.primary.name, config: MODELS.primary }
    }

    // Try fallback
    if (modelHealth.isHealthy(MODELS.fallback.name)) {
        console.log('⚡ Routing to fallback model:', MODELS.fallback.name)
        return { name: MODELS.fallback.name, config: MODELS.fallback }
    }

    // Use emergency model as last resort
    console.log('🆘 Using emergency model:', MODELS.emergency.name)
    return { name: MODELS.emergency.name, config: MODELS.emergency }
}

/**
 * Get next fallback model after a failure
 * @param {string} failedModel - The model that just failed
 * @returns {{ name: string, config: Object } | null}
 */
function getNextFallback(failedModel) {
    if (failedModel === MODELS.primary.name) {
        return { name: MODELS.fallback.name, config: MODELS.fallback }
    }
    if (failedModel === MODELS.fallback.name) {
        return { name: MODELS.emergency.name, config: MODELS.emergency }
    }
    return null  // No more fallbacks
}

/**
 * Check if error is retryable with different model
 */
function isRetryableError(error, statusCode) {
    // Rate limit - definitely retry with fallback
    if (statusCode === 429) return true

    // Server errors - might be temporary
    if (statusCode >= 500 && statusCode < 600) return true

    // Timeout
    if (error?.message?.includes('timeout')) return true

    // Model-specific errors
    if (error?.message?.includes('model_not_found')) return true
    if (error?.message?.includes('model_decommissioned')) return true

    return false
}

module.exports = {
    MODELS,
    modelHealth,
    selectModel,
    getNextFallback,
    isRetryableError
}
