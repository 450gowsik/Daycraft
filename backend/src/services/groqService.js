/**
 * Groq LLM Service for DayCraft Help Chatbot
 * Uses Llama 3.1 8B model with function calling for database queries
 * Now uses Model Router for smart fallback
 */

const dbQuery = require('./dbQueryService')
const { selectModel, modelHealth, getNextFallback, isRetryableError } = require('./modelRouter')

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// System prompt with function calling instructions
const SYSTEM_PROMPT = `You are the AI Help Assistant for DayCraft, a daily-wage labor platform in Tamil Nadu, India.

=== PROJECT CONTEXT (ARCHITECTURE & DATA) ===
MERN Stack (MongoDB, Express, React, Node).
- Identity: User model (login) separated from Worker/Employer profiles.
- Roles: Users have 'roles' array ['worker', 'employer'].
- Data: 
    - Workers: have 'skills', 'hourlyRate', 'experience'.
    - Jobs: have 'title', 'wage', 'location', 'employerId'.
- Auth: JWT based, with AuthContext on frontend.
- API: /api/auth, /api/jobs, /api/workers.

ABOUT DAYCRAFT:
- Connects daily-wage workers (laborers) with employers
- Workers can find jobs in construction, security, cleaning, electrical, etc.
- Employers can find verified workers and manage their job listings
- Available in English and Tamil

CRITICAL RULES:
1. You have access to TOOLS to query REAL data from our database
2. ALWAYS use tools when asked about specific numbers, workers, jobs, or data
3. NEVER make up numbers or statistics - use the tools to get real data
4. If the user asks "how many jobs", "list jobs", or "what jobs", use getJobCount or getTodayJobs.
5. If the user asks about "DayCraft" stats generally, use getPlatformStats.
6. If a tool returns no data, say "I couldn't find that information" instead of making up data

AVAILABLE TOOLS:
- getWorkerCount: Get count of workers (total, verified, available) by location
- searchWorker: Find workers by name
- getWorkerProfile: Get detailed info about a specific worker
- getJobCount: Get job statistics by location
- searchJobs: Find available jobs
- searchEmployer: Find employers by name
- getEmployerJobs: Get jobs posted by an employer
- getPlatformStats: Get overall platform statistics
- getTodayJobs: Get jobs available today

=== NAVIGATION & ACTION SYSTEM ===

SUPPORTED ROUTES (with auth requirements):

PUBLIC ROUTES (requiresAuth: false):
- "/" -> "home", "main menu", "main page"
- "/jobs" -> "jobs", "find work", "search jobs"
- "/jobs?location=Chennai" -> "jobs in Chennai"
- "/jobs?query=painter" -> "painter jobs"
- "/jobs?location=Madurai&query=driver" -> "driver jobs in Madurai"
- "/workers" -> "workers", "laborers", "find workers"
- "/login" -> "login", "sign in"
- "/register" -> "register", "sign up", "create account"

PROTECTED ROUTES (requiresAuth: true):
- "/dashboard" -> "dashboard", "my dashboard"
- "/profile" -> "profile", "my profile", "view profile"
- "/profile/edit" -> "edit profile", "update profile"
- "/my-jobs" -> "my jobs", "my posted jobs", "my listings"
- "/applications" -> "applications", "my applications"
- "/wallet" -> "wallet", "my wallet", "balance"

SPECIAL ACTIONS:
- logout -> "logout", "sign out", "log out"
- back -> "go back", "previous page"
- refresh -> "refresh", "reload page"

=== RESPONSE FORMAT (MANDATORY) ===

You must ALWAYS return a valid JSON object with this EXACT structure:

{
  "text": "Your friendly response message here...",
  "action": {
    "type": "navigate" | "logout" | "back" | "refresh" | null,
    "payload": "/route-path",
    "requiresAuth": true | false,
    "requiresRole": "worker" | "employer" | null,
    "intentCategory": "navigation" | "mutation" | "query"
  }
}

If no action needed, use: "action": null

=== ROLE-BASED ACCESS ===

WORKER can:
- Browse jobs, apply to jobs, view profile, edit profile

EMPLOYER can:
- Manage jobs, view applicants, hire workers

If user requests action they cannot perform, respond with helpful guidance.

=== RESPONSE STYLE ===
- Be friendly and helpful
- Use emojis occasionally 😊
- Keep responses concise but informative
- Support both English and Tamil (respond in the same language as the question)
- When presenting data, format it nicely with numbers and context
- IMPORTANT: When listing specific jobs, workers, or employers, ALWAYS format the name/title as a markdown link with their ID:
  - Jobs: [Job Title](/jobs/JOB_ID)
  - Workers: [Worker Name](/workers/WORKER_ID)
  - Employers: [Employer Name](/employers/EMPLOYER_ID)

=== EXAMPLE RESPONSES ===

Q: "navigate to dashboard"
A: { "text": "📊 Taking you to your dashboard!", "action": { "type": "navigate", "payload": "/dashboard", "requiresAuth": true, "requiresRole": null, "intentCategory": "navigation" } }

Q: "find jobs near me"
A: { "text": "🔍 Let me show you available jobs nearby!", "action": { "type": "navigate", "payload": "/jobs", "requiresAuth": false, "requiresRole": null, "intentCategory": "navigation" } }

Q: "logout"
A: { "text": "👋 Logging you out. See you soon!", "action": { "type": "logout", "payload": null, "requiresAuth": true, "requiresRole": null, "intentCategory": "mutation" } }

Q: "How many workers in Chennai?"
A: (After using getWorkerCount tool) { "text": "📊 There are 47 workers registered in Chennai - 32 verified and 28 currently available!", "action": null }
`

// Tool definitions for Groq function calling
const TOOLS = [
    {
        type: "function",
        function: {
            name: "getWorkerCount",
            description: "Get the count of workers by location. Returns total workers, verified workers, and available workers. Use minRating for filtering high-rated workers.",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "Location/district to filter by (e.g., 'Coimbatore', 'Chennai'). Leave empty for all locations."
                    },
                    minRating: {
                        type: "number",
                        description: "Minimum rating to filter workers by (e.g., 4.5)."
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "searchWorker",
            description: "Search for workers by name. Returns matching worker profiles with ratings and skills.",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Name of the worker to search for"
                    }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getWorkerProfile",
            description: "Get detailed profile of a specific worker including rating, experience, completed jobs, skills",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Name of the worker"
                    }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getJobCount",
            description: "Get job statistics by location. Returns total jobs, open jobs, urgent jobs.",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "Location to filter jobs by"
                    },
                    status: {
                        type: "string",
                        enum: ["open", "in-progress", "completed", "cancelled"],
                        description: "Job status to filter by"
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "searchJobs",
            description: "Search for available jobs by keyword or category",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Search keyword (job title, category, skill)"
                    },
                    location: {
                        type: "string",
                        description: "Location to filter by"
                    }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "searchEmployer",
            description: "Search for employers by name or company name",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Name of the employer or company"
                    }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getEmployerJobs",
            description: "Get all jobs posted by a specific employer",
            parameters: {
                type: "object",
                properties: {
                    name: {
                        type: "string",
                        description: "Name of the employer"
                    }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getPlatformStats",
            description: "Get overall platform statistics - total workers, jobs, employers, districts covered",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getTodayJobs",
            description: "Get currently available/open jobs. Use this for questions like 'jobs available today', 'open jobs', or 'list jobs'.",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "Location to filter by"
                    }
                },
                required: []
            }
        }
    }
]

// Map tool names to actual functions
const toolExecutors = {
    getWorkerCount: async (args) => await dbQuery.getWorkerCount(args.location, args.minRating),
    searchWorker: async (args) => await dbQuery.searchWorker(args.name),
    getWorkerProfile: async (args) => await dbQuery.getWorkerProfile(args.name),
    getJobCount: async (args) => await dbQuery.getJobCount(args.location, args.status),
    searchJobs: async (args) => await dbQuery.searchJobs(args.query, args.location),
    searchEmployer: async (args) => await dbQuery.searchEmployer(args.name),
    getEmployerJobs: async (args) => await dbQuery.getEmployerJobs(args.name),
    getPlatformStats: async () => await dbQuery.getPlatformStats(),
    getTodayJobs: async (args) => await dbQuery.getTodayJobs(args.location)
}

/**
 * Execute a tool call from the LLM
 * @param {Object} toolCall - The tool call from LLM response
 * @returns {Object} Tool execution result
 */
const executeToolCall = async (toolCall) => {
    const { name, arguments: argsString } = toolCall.function

    try {
        const args = JSON.parse(argsString || '{}')
        console.log(`Executing tool: ${name}`, args)

        const executor = toolExecutors[name]
        if (!executor) {
            return { error: `Unknown tool: ${name}` }
        }

        const result = await executor(args)
        console.log(`Tool ${name} result:`, JSON.stringify(result).slice(0, 200))
        return result
    } catch (error) {
        console.error(`Tool execution error:`, error)
        return { error: error.message }
    }
}

/**
 * Send a message to Groq LLM and get a response with function calling support
 * @param {string} userMessage - The user's question
 * @param {Array} conversationHistory - Previous messages for context
 * @param {string} language - 'en' or 'ta' for localization
 * @returns {Promise<Object>} - The AI response object { text, action }
 */
const getChatResponse = async (userMessage, conversationHistory = [], language = 'en') => {
    const apiKey = process.env.GROQ_API_KEY

    console.log('Using Groq API Key:', apiKey ? '***' + apiKey.slice(-4) : 'MISSING')

    if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured')
    }

    // Build messages array with system prompt and conversation history
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory.slice(-6),
        { role: 'user', content: userMessage }
    ]

    // Use Model Router to select the best available model
    const selectedModel = selectModel()
    let currentModel = selectedModel.name

    try {
        console.log('Sending request to Groq with function calling...')
        console.log('Selected Model:', currentModel, selectedModel.config.supportsTools ? '(tools enabled)' : '(tools disabled)')
        console.log('Messages count:', messages.length)
        console.log('Tools count:', TOOLS.length)

        // First API call - may return tool calls
        // NOTE: Don't use response_format here as it conflicts with tool_choice
        // Using llama3-groq-70b-8192-tool-use-preview - specifically designed for function calling
        let response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: currentModel,
                messages: messages,
                tools: selectedModel.config.supportsTools ? TOOLS : undefined,
                tool_choice: selectedModel.config.supportsTools ? 'auto' : undefined,
                temperature: 0.3,
                max_tokens: selectedModel.config.maxTokens || 1000
            })
        })

        console.log('Groq API response status:', response.status)

        if (response.ok) {
            modelHealth.recordSuccess(currentModel)
        } else {
            const errorText = await response.text()
            console.error('Groq API Error:', response.status, errorText)

            // Check for rate limit error (429) - switch to fallback model immediately
            if (response.status === 429 || errorText.includes('rate_limit_exceeded')) {
                // Record failure for current model
                modelHealth.recordFailure(currentModel, { message: errorText })

                // Get next fallback model
                const fallback = getNextFallback(currentModel)
                if (!fallback) {
                    throw new Error('All models exhausted, no fallback available')
                }

                currentModel = fallback.name
                console.log(`⚠️ Rate limit reached. Switching to fallback model: ${currentModel}...`)

                response = await fetch(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: currentModel,
                        messages: messages,
                        tools: fallback.config.supportsTools ? TOOLS : undefined,
                        tool_choice: fallback.config.supportsTools ? 'auto' : undefined,
                        temperature: 0.3,
                        max_tokens: fallback.config.maxTokens || 1000
                    })
                })

                if (!response.ok) {
                    const fallbackError = await response.text()
                    console.error('Fallback model also failed:', response.status, fallbackError)
                    modelHealth.recordFailure(currentModel, { message: fallbackError })
                    throw new Error(`Both primary and fallback models failed: ${response.status}`)
                }

                console.log('✅ Successfully switched to fallback model')
                modelHealth.recordSuccess(currentModel)
            }
            // Check for tool_use_failed error and retry without tools
            else if (errorText.includes('tool_use_failed') || errorText.includes('Failed to call a function')) {
                console.log('Tool calling failed, retrying without tools...')

                // Extract the location/query from the failed generation if possible
                const failedMatch = errorText.match(/"location":\s*"([^"]+)"/)
                const locationFromError = failedMatch ? failedMatch[1] : null

                // Make a direct query to the database if we can identify the intent
                if (locationFromError) {
                    console.log('Attempting direct database query for location:', locationFromError)
                    try {
                        const jobResults = await dbQuery.searchJobs('', locationFromError)
                        if (jobResults && (jobResults.jobs?.length > 0 || jobResults.count > 0)) {
                            const jobs = jobResults.jobs || []
                            let responseText = `📋 Here are the jobs available in ${locationFromError}:\n\n`
                            if (jobs.length === 0) {
                                responseText = `📭 No jobs found in ${locationFromError} at the moment. Check back later or browse all available jobs!`
                            } else {
                                jobs.slice(0, 5).forEach((job, i) => {
                                    responseText += `${i + 1}. **[${job.title || job.category}](/jobs/${job._id})** - ₹${job.wage || job.payment}/day\n   📍 ${job.location || locationFromError}\n\n`
                                })
                                if (jobs.length > 5) {
                                    responseText += `...and ${jobs.length - 5} more jobs available.`
                                }
                            }
                            return { text: responseText, action: { type: 'navigate', payload: '/jobs', requiresAuth: false, intentCategory: 'navigation' } }
                        }
                    } catch (dbError) {
                        console.error('Direct DB query failed:', dbError)
                    }
                }

                // Fallback: retry without tools using a reliable model
                currentModel = 'llama-3.1-8b-instant' // Use fallback for retry
                response = await fetch(GROQ_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: currentModel,
                        messages: messages,
                        temperature: 0.5,
                        max_tokens: 500
                    })
                })

                if (!response.ok) {
                    throw new Error(`Groq API request failed: ${response.status}`)
                }
            } else {
                throw new Error(`Groq API request failed: ${response.status}`)
            }
        }

        let data = await response.json()
        let assistantMessage = data.choices[0]?.message

        // Check if LLM wants to call tools
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            console.log('LLM requested tool calls:', assistantMessage.tool_calls.length)

            // Add assistant message to conversation
            messages.push(assistantMessage)

            // Execute each tool call and add results
            for (const toolCall of assistantMessage.tool_calls) {
                const toolResult = await executeToolCall(toolCall)

                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(toolResult)
                })
            }

            // Second API call with tool results
            console.log(`Sending tool results back to LLM using model: ${currentModel}...`)
            response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: currentModel, // Use the currently active/working model
                    messages: messages,
                    temperature: 0.5,
                    max_tokens: 500
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Groq API Error (second call):', response.status, errorText)

                // Handle rate limit for second call too (in case primary worked first time but failed second)
                if (response.status === 429 || errorText.includes('rate_limit_exceeded')) {
                    modelHealth.recordFailure(currentModel, { message: errorText })

                    const fallback = getNextFallback(currentModel)
                    if (fallback) {
                        currentModel = fallback.name
                        console.log('⚠️ Rate limit on second call, switching to fallback:', currentModel)

                        response = await fetch(GROQ_API_URL, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: currentModel,
                                messages: messages,
                                temperature: 0.5,
                                max_tokens: fallback.config.maxTokens || 500
                            })
                        })

                        if (!response.ok) {
                            const secondFallbackError = await response.text()
                            modelHealth.recordFailure(currentModel, { message: secondFallbackError })
                            throw new Error(`Fallback model also failed on second call: ${response.status}`)
                        }

                        modelHealth.recordSuccess(currentModel)
                    } else {
                        throw new Error(`All models exhausted on second call: ${response.status}`)
                    }
                } else {
                    throw new Error(`Groq API request failed: ${response.status}`)
                }
            }

            data = await response.json()
            assistantMessage = data.choices[0]?.message
        }

        // Parse the final response
        if (!assistantMessage || !assistantMessage.content) {
            console.error('No assistant message content returned from Groq')
            return {
                text: 'I apologize, but I could not process that request. Please try again.',
                action: null
            }
        }

        const content = assistantMessage.content

        try {
            // Try to parse as JSON directly
            const parsedContent = JSON.parse(content)
            return parsedContent
        } catch (parseError) {
            // Try to extract JSON from the text (LLM sometimes wraps JSON in text)
            const jsonMatch = content.match(/\{[\s\S]*"text"[\s\S]*\}/)
            if (jsonMatch) {
                try {
                    const extractedJson = JSON.parse(jsonMatch[0])
                    return extractedJson
                } catch (e) {
                    // Couldn't parse extracted JSON
                }
            }

            // Check for navigation intent in text and create action
            const lowerContent = content?.toLowerCase() || ''
            let action = null

            // Detect navigation intents
            if (lowerContent.includes('navigat') || lowerContent.includes('go to') || lowerContent.includes('take you') || lowerContent.includes('redirect')) {
                // Public routes
                if (lowerContent.includes('job') && !lowerContent.includes('my job') && !lowerContent.includes('post')) {
                    action = { type: 'navigate', payload: '/jobs', requiresAuth: false, intentCategory: 'navigation' }
                } else if (lowerContent.includes('worker') || lowerContent.includes('laborer')) {
                    action = { type: 'navigate', payload: '/workers', requiresAuth: false, intentCategory: 'navigation' }
                } else if (lowerContent.includes('home') || lowerContent.includes('main')) {
                    action = { type: 'navigate', payload: '/', requiresAuth: false, intentCategory: 'navigation' }
                } else if (lowerContent.includes('login')) {
                    action = { type: 'navigate', payload: '/login', requiresAuth: false, intentCategory: 'navigation' }
                } else if (lowerContent.includes('register') || lowerContent.includes('sign up')) {
                    action = { type: 'navigate', payload: '/register', requiresAuth: false, intentCategory: 'navigation' }
                }
                // Protected routes
                else if (lowerContent.includes('dashboard')) {
                    action = { type: 'navigate', payload: '/dashboard', requiresAuth: true, intentCategory: 'navigation' }
                } else if (lowerContent.includes('profile')) {
                    action = { type: 'navigate', payload: '/profile', requiresAuth: true, intentCategory: 'navigation' }
                } else if (lowerContent.includes('my job') || lowerContent.includes('posted job') || lowerContent.includes('my listing')) {
                    action = { type: 'navigate', payload: '/my-jobs', requiresAuth: true, requiresRole: 'employer', intentCategory: 'navigation' }
                } else if (lowerContent.includes('application')) {
                    action = { type: 'navigate', payload: '/applications', requiresAuth: true, intentCategory: 'navigation' }
                } else if (lowerContent.includes('wallet') || lowerContent.includes('balance')) {
                    action = { type: 'navigate', payload: '/wallet', requiresAuth: true, intentCategory: 'navigation' }
                }
            }

            // Special actions
            if (lowerContent.includes('logout') || lowerContent.includes('sign out') || lowerContent.includes('log out')) {
                action = { type: 'logout', payload: null, requiresAuth: true, intentCategory: 'mutation' }
            } else if (lowerContent.includes('go back') || lowerContent.includes('previous')) {
                action = { type: 'back', payload: null, requiresAuth: false, intentCategory: 'navigation' }
            } else if (lowerContent.includes('refresh') || lowerContent.includes('reload')) {
                action = { type: 'refresh', payload: null, requiresAuth: false, intentCategory: 'navigation' }
            }

            // Clean up the text - remove JSON if embedded
            let cleanText = content?.replace(/\{[\s\S]*\}/g, '').trim() || content

            console.warn('Response not JSON, parsed text:', cleanText?.slice(0, 100))
            return {
                text: cleanText || 'Sorry, I couldn\'t generate a response.',
                action: action
            }
        }

    } catch (error) {
        console.error('=== GROQ SERVICE ERROR ===')
        console.error('Error type:', error.constructor.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        console.error('User message was:', userMessage)
        console.error('========================')

        const errorMsg = language === 'ta'
            ? 'மன்னிக்கவும், தற்போது சேவை கிடைக்கவில்லை. பின்னர் முயற்சிக்கவும்.'
            : 'Sorry, the AI service is temporarily unavailable. Please try again later.'

        return { text: errorMsg, action: null }
    }
}

module.exports = {
    getChatResponse
}
