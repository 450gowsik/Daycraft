const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Use relative paths from backend directory
const User = require('./src/models/User');
const Job = require('./src/models/Job');

async function verifyJobPosting() {
    try {
        console.log('Connecting to MongoDB...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Create a test employer
        const testEmail = `test_employer_${Date.now()}@example.com`;
        const employer = await User.create({
            name: 'Test Employer',
            email: testEmail,
            role: 'employer',
            profileCompleted: true,
            authProvider: 'email',
            isActive: true
        });
        console.log(`Created test employer: ${employer._id} (${testEmail})`);

        // 2. Mock a request object like auth middleware would
        const jobData = {
            title: { en: 'Test Job', ta: 'தேர்வு வேலை' },
            description: { en: 'Test Description', ta: 'தேர்வு விளக்கம்' },
            category: 'other',
            role: 'other_worker',
            location: 'Chennai',
            wage: 500,
            wageType: 'daily',
            duration: '1 day',
            requiredWorkers: 1,
            urgent: false
        };

        console.log('Attempting to create job...');
        const job = await Job.create({
            employer: employer._id,
            ...jobData,
            status: 'open'
        });

        console.log(`Job created successfully: ${job._id}`);

        // 4. Cleanup
        await Job.deleteOne({ _id: job._id });
        await User.deleteOne({ _id: employer._id });
        console.log('Cleanup complete.');

        console.log('\nVERIFICATION SUCCESSFUL: Employer can post jobs with single-role structure.');
        process.exit(0);
    } catch (error) {
        if (error.name === 'ValidationError') {
            console.error('\nVERIFICATION FAILED: Validation Error', JSON.stringify(error.errors, null, 2));
        } else {
            console.error('\nVERIFICATION FAILED:', error);
        }
        process.exit(1);
    }
}

verifyJobPosting();
