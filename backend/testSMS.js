const smsService = require('./src/services/smsService');
const env = require('./src/config/env');

async function testSMS() {
    console.log('--- SMS Service Test ---');
    console.log('SMS Enabled:', env.SMS_ENABLED);
    console.log('API Key Present:', !!env.FAST2SMS_API_KEY);

    // Test OTP
    console.log('\nTesting OTP...');
    await smsService.sendOTP('9876543210', '123456');

    // Test Job Alert
    console.log('\nTesting Job Alert...');
    await smsService.sendJobAlert('9876543210', 'Plumber Wanted', 'hired');

    // Test Match Alert
    console.log('\nTesting Match Alert...');
    await smsService.sendMatchAlert('9876543210', 'Electrician', 'Chennai');

    console.log('\n--- Test Complete ---');
}

testSMS().catch(err => console.error('Test Failed:', err));
