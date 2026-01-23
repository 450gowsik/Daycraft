/**
 * Intent Patterns Configuration
 * Defines patterns for classifying user intents before routing to LLM
 */

// FAQ patterns - instant responses without LLM
const FAQ_PATTERNS = [
    {
        keywords: ['what is ai recommendation', 'ai recommendation', 'ai suggest'],
        response: {
            en: "🤖 **AI Recommendation** analyzes your skills, location, and work history to suggest jobs that best match your profile. The more complete your profile, the better the recommendations!",
            ta: "🤖 **AI பரிந்துரை** உங்கள் திறன்கள், இருப்பிடம் மற்றும் வேலை வரலாற்றை பகுப்பாய்வு செய்து, உங்கள் சுயவிவரத்துடன் சிறப்பாக பொருந்தும் வேலைகளை பரிந்துரைக்கிறது!"
        }
    },
    {
        keywords: ['match score', 'how does match', 'matching work'],
        response: {
            en: "📊 **Match Score** is a percentage (0-100%) showing how well a job fits your profile. It considers: skills match, location proximity, wage expectations, and past work experience.",
            ta: "📊 **பொருத்த மதிப்பெண்** ஒரு சதவீதம் (0-100%) ஆகும், இது ஒரு வேலை உங்கள் சுயவிவரத்துடன் எவ்வளவு சிறப்பாக பொருந்துகிறது என்பதைக் காட்டுகிறது."
        }
    },
    {
        keywords: ['best for you', 'recommended for', 'personalized'],
        response: {
            en: "⭐ **Best for You** shows jobs specifically picked for YOUR profile. These have the highest match scores based on your skills, location, and preferences.",
            ta: "⭐ **உங்களுக்கான சிறந்தவை** உங்கள் சுயவிவரத்திற்காக குறிப்பாக தேர்ந்தெடுக்கப்பட்ட வேலைகளைக் காட்டுகிறது."
        }
    },
    {
        keywords: ['data safe', 'privacy', 'secure', 'information safe'],
        response: {
            en: "🔒 **Your data is safe!** We use industry-standard encryption. Your personal information is never shared with employers without your consent. You control your visibility.",
            ta: "🔒 **உங்கள் தரவு பாதுகாப்பானது!** நாங்கள் தொழில்துறை தர குறியாக்கத்தைப் பயன்படுத்துகிறோம். உங்கள் தனிப்பட்ட தகவல்கள் உங்கள் அனுமதியின்றி முதலாளிகளுடன் பகிரப்படாது."
        }
    },
    {
        keywords: ['how to apply', 'apply for job', 'application process'],
        response: {
            en: "📝 **To apply for a job:**\n1. Browse jobs or check 'Best for You'\n2. Click on a job card\n3. Review details and tap 'Apply'\n4. Wait for employer response\n\nMake sure your profile is complete for better chances!",
            ta: "📝 **வேலைக்கு விண்ணப்பிக்க:**\n1. வேலைகளை உலாவுங்கள்\n2. வேலை அட்டையைக் கிளிக் செய்யுங்கள்\n3. விவரங்களைப் பார்த்து 'விண்ணப்பி' என்பதைத் தட்டவும்"
        }
    },
    {
        keywords: ['quick apply', 'one click apply', 'fast apply'],
        response: {
            en: "⚡ **Quick Apply** lets you apply to jobs with just one tap! Your saved profile info is automatically sent to employers. Enable it in Settings for faster applications.",
            ta: "⚡ **விரைவு விண்ணப்பம்** ஒரே தட்டலில் வேலைகளுக்கு விண்ணப்பிக்க உங்களை அனுமதிக்கிறது!"
        }
    },
    {
        keywords: ['what is daycraft', 'about daycraft', 'daycraft platform'],
        response: {
            en: "👷 **DayCraft** is a platform connecting daily-wage workers with local employers. Find verified jobs, get AI-powered recommendations, and build steady income through our trusted platform!",
            ta: "👷 **DayCraft** தினசரி கூலி தொழிலாளர்களை உள்ளூர் முதலாளிகளுடன் இணைக்கும் தளமாகும்!"
        }
    }
]

// Navigation patterns - trigger app navigation
const NAVIGATION_PATTERNS = [
    {
        keywords: ['show jobs', 'find jobs', 'browse jobs', 'see jobs', 'job list', 'available jobs'],
        action: { type: 'navigate', payload: '/jobs', requiresAuth: false }
    },
    {
        keywords: ['my profile', 'view profile', 'edit profile', 'update profile'],
        action: { type: 'navigate', payload: '/profile', requiresAuth: true }
    },
    {
        keywords: ['post job', 'create job', 'add job', 'hire worker'],
        action: { type: 'navigate', payload: '/post-job', requiresAuth: true, requiresRole: 'employer' }
    },
    {
        keywords: ['my applications', 'applied jobs', 'application status'],
        action: { type: 'navigate', payload: '/applications', requiresAuth: true }
    },
    {
        keywords: ['home page', 'main page', 'go home', 'take me home', 'navigate to home'],
        action: { type: 'navigate', payload: '/', requiresAuth: false }
    },
    {
        keywords: ['dashboard', 'my dashboard'],
        action: { type: 'navigate', payload: '/dashboard', requiresAuth: true }
    },
    {
        keywords: ['settings', 'preferences', 'account settings'],
        action: { type: 'navigate', payload: '/settings', requiresAuth: true }
    },
    {
        keywords: ['logout', 'sign out', 'log out'],
        action: { type: 'logout' }
    },
    {
        keywords: ['login', 'sign in', 'log in'],
        action: { type: 'navigate', payload: '/login', requiresAuth: false }
    },
    {
        keywords: ['register', 'sign up', 'create account'],
        action: { type: 'navigate', payload: '/register', requiresAuth: false }
    },
    {
        keywords: ['wallet', 'my balance', 'payment history', 'transactions'],
        action: { type: 'navigate', payload: '/wallet', requiresAuth: true }
    }
]

// Job query patterns - route to DB/algorithm instead of LLM
const JOB_QUERY_PATTERNS = [
    /jobs?\s+in\s+(\w+)/i,           // "jobs in Chennai"
    /work\s+in\s+(\w+)/i,            // "work in Ranipet"
    /(\w+)\s+jobs?/i,                // "painter jobs"
    /find\s+(\w+)\s+work/i,          // "find plumber work"
    /₹\s*\d+/,                       // contains rupee amount
    /\d+\s*(per|\/)\s*day/i,         // "500 per day"
    /nearby\s+jobs?/i,               // "nearby jobs"
    /urgent\s+jobs?/i,               // "urgent jobs"
    /today.?s?\s+jobs?/i,            // "today's jobs"
    /nearby\s+(employees?|workers?|laborers?)/i, // "nearby employee"
    /find\s+(employees?|workers?|laborers?)/i,   // "find worker"
    /(employees?|workers?|laborers?)\s+in\s+(\w+)/i // "worker in Coimbatore"
]

// Abuse/block patterns
const ABUSE_PATTERNS = [
    /\b(fuck|shit|damn|bastard|idiot|stupid)\b/i,
    // Add more patterns as needed
]

// Greeting patterns - simple responses
const GREETING_PATTERNS = {
    keywords: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'],
    responses: {
        en: [
            "👋 Hello! How can I help you today?",
            "👋 Hi there! What would you like to know about DayCraft?",
            "👋 Hey! I'm here to help. Ask me anything!"
        ],
        ta: [
            "👋 வணக்கம்! இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
            "👋 வணக்கம்! DayCraft பற்றி என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?"
        ]
    }
}

module.exports = {
    FAQ_PATTERNS,
    NAVIGATION_PATTERNS,
    JOB_QUERY_PATTERNS,
    ABUSE_PATTERNS,
    GREETING_PATTERNS
}
