import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api.js'
import { FaTimes, FaPaperPlane, FaQuestionCircle } from 'react-icons/fa'
import './HelpChatbot.css'

// Add styles locally since we can't easily edit the CSS file directly in this tool call context
// Ideally this should be in HelpChatbot.css, but injecting a style tag works for now or ensuring the class is styled
// Let's assume we can rely on global styles or existing link styles, but adding a specific class ensures visibility
const linkStyles = `
.chat-link {
    color: #2563eb;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 500;
}
.chat-link:hover {
    color: #1d4ed8;
}
`


// Quick question suggestions
const getQuickQuestions = (language) => [
    { en: "How are jobs recommended?", ta: "How are jobs recommended?" },
    { en: "How does Match Score work?", ta: "பொருத்த மதிப்பெண் எப்படி வேலை செய்கிறது?" },
    { en: "What is 'Best for You'?", ta: "'உங்களுக்கான சிறந்தவை' என்ன?" },
    { en: "Is my data safe?", ta: "என் தகவல் பாதுகாப்பானதா?" }
]

function HelpChatbot() {
    const { language } = useLanguage()
    const { user, isAuthenticated, logout } = useAuth()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isLLMEnabled, setIsLLMEnabled] = useState(true)
    const messagesEndRef = useRef(null)

    const quickQuestions = getQuickQuestions(language)

    // Translations
    const t = {
        welcome: language === 'ta'
            ? "Hi! Ask a question about jobs, workers, applications, payments, or your DayCraft account."
            : "Hi! Ask a question about jobs, workers, applications, payments, or your DayCraft account.",
        placeholder: language === 'ta' ? 'கேள்வி கேளுங்கள்...' : 'Ask me anything...',
        title: language === 'ta' ? 'Help Center' : 'Help Center',
        online: language === 'ta' ? 'Online' : 'Online',
        error: language === 'ta' ? 'மன்னிக்கவும், பதில் பெற முடியவில்லை.' : 'Sorry, I couldn\'t get a response. Please try again.'
    }

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Add welcome message when opened
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ type: 'bot', text: t.welcome }])
        }
    }, [isOpen])

    // Check if LLM is available
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await api.get('/chatbot/health')
                setIsLLMEnabled(response.data.status === 'ready')
            } catch {
                setIsLLMEnabled(false)
            }
        }
        checkHealth()
    }, [])

    // Execute action with auth and role checks
    const executeAction = (action) => {
        if (!action) return

        // Auth guard - check if action requires authentication
        if (action.requiresAuth && !isAuthenticated) {
            setMessages(prev => [...prev, {
                type: 'bot',
                text: language === 'ta'
                    ? '🔐 இந்த செயலுக்கு உள்நுழைவு தேவை. உள்நுழைவு பக்கத்திற்குச் செல்கிறேன்...'
                    : '🔐 This action requires login. Redirecting to login page...'
            }])
            setTimeout(() => navigate('/login'), 1500)
            return
        }

        // Role guard - check if action requires specific role
        if (action.requiresRole && user?.role !== action.requiresRole) {
            const roleMsg = action.requiresRole === 'employer'
                ? (language === 'ta' ? '📋 இந்த செயல் முதலாளிகளுக்கு மட்டுமே.' : '📋 This action is for employers only.')
                : (language === 'ta' ? '👷 இந்த செயல் தொழிலாளர்களுக்கு மட்டுமே.' : '👷 This action is for workers only.')
            setMessages(prev => [...prev, { type: 'bot', text: roleMsg }])
            return
        }

        // Execute action based on type
        switch (action.type) {
            case 'navigate':
                setTimeout(() => navigate(action.payload), 1000)
                break
            case 'logout':
                setTimeout(() => {
                    logout()
                    navigate('/login')
                }, 1000)
                break
            case 'back':
                setTimeout(() => window.history.back(), 500)
                break
            case 'refresh':
                setTimeout(() => window.location.reload(), 500)
                break
            default:
                console.warn('Unknown action type:', action.type)
        }
    }

    // Send message to LLM with auth context
    const sendToLLM = async (userMessage) => {
        try {
            const response = await api.post('/chatbot/message', {
                message: userMessage,
                history: messages.slice(-6),
                language: language,
                // Pass auth context for smart responses
                authContext: {
                    isAuthenticated,
                    role: user?.role || null,
                    userId: user?._id || null
                }
            }, {
                timeout: 60000 // 60 seconds timeout for LLM calls
            })
            return response.data.response // Returns { text, action }
        } catch (error) {
            console.error('LLM error:', error)
            throw error
        }
    }

    // Helper to safely parse response
    const processResponse = (response) => {
        // If response is already an object, return it
        if (typeof response === 'object' && response !== null) {
            return response
        }

        // If response is string, try to parse it
        if (typeof response === 'string') {
            const trimmed = response.trim()
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                try {
                    return JSON.parse(trimmed)
                } catch (e) {
                    console.warn('Failed to parse JSON string:', e)
                }
            }
            return { text: response, action: null }
        }

        return { text: t.error, action: null }
    }

    // Handle quick question click
    const handleQuestionClick = async (question) => {
        const questionText = question[language] || question.en

        // Add user question
        setMessages(prev => [...prev, { type: 'user', text: questionText }])
        setIsTyping(true)

        try {
            const rawResponse = await sendToLLM(questionText)
            const response = processResponse(rawResponse)

            setMessages(prev => [...prev, { type: 'bot', text: response.text }])

            // Execute action with auth/role guards
            if (response.action) {
                executeAction(response.action)
            }

        } catch {
            setMessages(prev => [...prev, { type: 'bot', text: t.error }])
        } finally {
            setIsTyping(false)
        }
    }

    // Handle custom message submission
    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!inputText.trim() || isTyping) return

        const userMessage = inputText.trim()
        setMessages(prev => [...prev, { type: 'user', text: userMessage }])
        setInputText('')
        setIsTyping(true)

        try {
            const rawResponse = await sendToLLM(userMessage)
            const response = processResponse(rawResponse)

            setMessages(prev => [...prev, { type: 'bot', text: response.text }])

            // Execute action with auth/role guards
            if (response.action) {
                executeAction(response.action)
            }

        } catch {
            setMessages(prev => [...prev, { type: 'bot', text: t.error }])
        } finally {
            setIsTyping(false)
        }
    }

    // Format message text (markdown-like formatting)
    const formatMessage = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '&bull; ')
    }

    return (
        <>
            <style>{linkStyles}</style>
            {/* Floating Help Button */}
            <button
                className={`help-chatbot-toggle ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Help"
            >
                {isOpen ? <FaTimes size={20} /> : <FaQuestionCircle size={22} />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="help-chatbot-window">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="header-info">
                            <FaQuestionCircle size={20} />
                            <div>
                                <h3>{t.title}</h3>
                                <span className="status-text">{t.online}</span>
                            </div>
                        </div>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>
                            <FaTimes size={16} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="chatbot-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`message ${msg.type}`}>
                                {msg.type === 'bot' && (
                                    <div className="msg-icon">
                                        <FaQuestionCircle size={14} />
                                    </div>
                                )}
                                <div
                                    className="message-bubble"
                                    onClick={(e) => {
                                        const target = e.target.closest('a')
                                        if (target && target.getAttribute('href')?.startsWith('/')) {
                                            e.preventDefault()
                                            navigate(target.getAttribute('href'))
                                        }
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: formatMessage(msg.text)
                                            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
                                    }}
                                />
                            </div>
                        ))}

                        {isTyping && (
                            <div className="message bot">
                                <div className="msg-icon">
                                    <FaQuestionCircle size={14} />
                                </div>
                                <div className="message-bubble typing">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Question Chips */}
                    <div className="quick-questions">
                        {quickQuestions.map((q, i) => (
                            <button
                                key={i}
                                className="quick-question-btn"
                                onClick={() => handleQuestionClick(q)}
                                disabled={isTyping}
                            >
                                {q[language] || q.en}
                            </button>
                        ))}
                    </div>

                    {/* Input Box */}
                    <form className="chatbot-input" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={t.placeholder}
                            disabled={isTyping}
                        />
                        <button type="submit" disabled={!inputText.trim() || isTyping}>
                            <FaPaperPlane size={16} />
                        </button>
                    </form>
                </div>
            )}
        </>
    )
}

export default HelpChatbot
