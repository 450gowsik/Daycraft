const twilio = require('twilio');
const env = require('../config/env');

// Initialize Twilio client
let client = null;
if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
}

/**
 * SMS Service using Twilio
 */
const smsService = {
    /**
     * Send a quick SMS via Twilio
     * @param {string} number - E.164 formatted phone number
     * @param {string} message - Message text
     */
    sendSMS: async (number, message) => {
        if (!client || !env.SMS_ENABLED) {
            console.log(`[SMS MOCK] To: ${number} | Message: ${message}`);
            return { success: true, message: 'SMS logged to console (mock mode)' };
        }

        try {
            console.log(`[TWILIO] Attempting to send message to: ${number}`);

            const response = await client.messages.create({
                body: message,
                from: env.TWILIO_PHONE_NUMBER,
                to: number
            });

            console.log(`[TWILIO SUCCESS] SID: ${response.sid} | Status: ${response.status}`);

            return {
                success: true,
                sid: response.sid,
                status: response.status,
                data: response
            };
        } catch (error) {
            console.error('[TWILIO ERROR] code:', error.code);
            console.error('[TWILIO ERROR] message:', error.message);

            // Fallback to mock mode on error so development isn't blocked
            if (env.isDevelopment()) {
                console.log(`[SMS FALLBACK] To: ${number} | Message: ${message}`);
                return {
                    success: true,
                    message: 'SMS failed (fallback to console)',
                    mock: true
                };
            }

            return {
                success: false,
                message: error.message,
                code: error.code
            };
        }
    },

    /**
     * Send OTP specifically
     */
    sendOTP: async (phoneNumber, otp) => {
        const message = `Your DayCraft verification code is: ${otp}. Valid for 10 minutes.`;
        return await smsService.sendSMS(phoneNumber, message);
    },

    /**
     * Send Job Notification
     */
    sendJobAlert: async (phoneNumber, jobTitle, status) => {
        const message = `DayCraft Alert: Your application for "${jobTitle}" has been ${status}. Check the app for details.`;
        return await smsService.sendSMS(phoneNumber, message);
    },

    /**
     * Send Match Alert
     */
    sendMatchAlert: async (phoneNumber, jobTitle, location, distanceText = 'near you') => {
        const message = `DayCraft Match: A new "${jobTitle}" job is available ${distanceText} in ${location}. Open DayCraft to apply!`;
        return await smsService.sendSMS(phoneNumber, message);
    }
};

module.exports = smsService;
