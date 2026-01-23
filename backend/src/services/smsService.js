const axios = require('axios');
const env = require('../config/env');

/**
 * SMS Service using Fast2SMS
 */
const smsService = {
    /**
     * Send a quick SMS via Fast2SMS
     * @param {string} numbers - Comma separated phone numbers
     * @param {string} message - Message text
     */
    sendSMS: async (numbers, message) => {
        if (!env.FAST2SMS_API_KEY || !env.SMS_ENABLED) {
            console.log(`[SMS MOCK] To: ${numbers} | Message: ${message}`);
            return { success: true, message: 'SMS logged to console (mock mode)' };
        }

        try {
            const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
                route: 'q',
                message: message,
                language: 'english',
                flash: 0,
                numbers: numbers
            }, {
                headers: {
                    'authorization': env.FAST2SMS_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.return) {
                return { success: true, data: response.data };
            } else {
                console.error('Fast2SMS Error:', response.data.message);
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error('SMS Service Error:', error.response?.data || error.message);
            return { success: false, message: 'Failed to send SMS' };
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
