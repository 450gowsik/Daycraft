/**
 * Human-Friendly Error Mapping
 * Maps technical API error codes/messages to localized, user-friendly strings.
 */
const errorMap = {
    // Auth Errors
    'Invalid email or password': {
        en: 'Invalid email or password. Please try again.',
        ta: 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். மீண்டும் முயற்சிக்கவும்.'
    },
    'User with this email already exists': {
        en: 'An account already exists with this email.',
        ta: 'இந்த மின்னஞ்சலில் ஏற்கனவே ஒரு கணக்கு உள்ளது.'
    },
    'Not authorized to access this route': {
        en: 'Your session has expired. Please log in again.',
        ta: 'உங்கள் அமர்வு முடிந்தது. மீண்டும் உள்நுழையவும்.'
    },

    // OTP Errors
    'Invalid OTP': {
        en: 'Incorrect code. Please check and try again.',
        ta: 'தவறான குறியீடு. சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'
    },
    'OTP expired or not found': {
        en: 'Code expired. Please request a new one.',
        ta: 'குறியீடு காலாவதியானது. புதிய ஒன்றை கோரவும்.'
    },

    // Network/Server Errors
    'Network Error': {
        en: 'Connection issue. Please check your internet.',
        ta: 'இணைப்பு சிக்கல். உங்கள் இணையத்தை சரிபார்க்கவும்.'
    },
    'Server Error': {
        en: 'Something went wrong on our end. We are fixing it!',
        ta: 'எங்கள் தரப்பில் ஏதோ தவறு நிகழ்ந்துவிட்டது. நாங்கள் அதை சரிசெய்கிறோம்!'
    }
};

export const mapError = (technicalMessage, language = 'en') => {
    // Fallback if message not in map
    const mapped = errorMap[technicalMessage];
    if (mapped) return mapped[language] || mapped.en;

    return technicalMessage; // Return original if no map exists
};

export default mapError;
