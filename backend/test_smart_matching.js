const mongoose = require('mongoose');
const User = require('./src/models/User');
const Job = require('./src/models/Job');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');

async function runTest() {
    const suffix = Date.now();
    console.log('--- Smart SMS Verification Test (Run ID: ' + suffix + ') ---');
    await connectDB();

    // 1. Cleanup ANY old test data
    await User.deleteMany({ name: /test_worker/i });
    await User.deleteMany({ email: /test_worker/i });
    await Job.deleteMany({ title: /Test Plumber Job/i });

    // 2. Create Test Workers with Unique Emails/Phones
    const workers = [
        {
            name: 'John Perfect ' + suffix,
            email: `john_${suffix}@test.com`,
            role: 'worker',
            skills: [{ en: 'Plumbing', ta: 'பிளம்பிங்' }],
            location: 'Chennai Central',
            geoLocation: { type: 'Point', coordinates: [80.2707, 13.0827] },
            phone: `9111${suffix.toString().slice(-6)}`,
            phoneVerified: true,
            isActive: true,
            rating: 5,
            completedJobs: 10,
            password: 'password123'
        },
        {
            name: 'James Good ' + suffix,
            email: `james_${suffix}@test.com`,
            role: 'worker',
            skills: [{ en: 'Plumbing', ta: 'பிளம்பிங்' }],
            location: 'Tambaram',
            geoLocation: { type: 'Point', coordinates: [80.1177, 12.9230] },
            phone: `9222${suffix.toString().slice(-6)}`,
            phoneVerified: true,
            isActive: true,
            rating: 4,
            completedJobs: 5,
            password: 'password123'
        },
        {
            name: 'Bob Unrelated ' + suffix,
            email: `bob_${suffix}@test.com`,
            role: 'worker',
            skills: [{ en: 'Carpentry', ta: 'தச்சு வேலை' }],
            location: 'Chennai Central',
            geoLocation: { type: 'Point', coordinates: [80.2707, 13.0827] },
            phone: `9333${suffix.toString().slice(-6)}`,
            phoneVerified: true,
            isActive: true,
            rating: 3,
            completedJobs: 1,
            password: 'password123'
        },
        {
            name: 'Dave Unverified ' + suffix,
            email: `dave_${suffix}@test.com`,
            role: 'worker',
            skills: [{ en: 'Plumbing', ta: 'பிளம்பிங்' }],
            location: 'Chennai Central',
            geoLocation: { type: 'Point', coordinates: [80.2707, 13.0827] },
            phone: `9444${suffix.toString().slice(-6)}`,
            phoneVerified: false,
            isActive: true,
            rating: 5,
            completedJobs: 10,
            password: 'password123'
        }
    ];

    console.log('Inserting test workers...');
    try {
        await User.insertMany(workers);
        console.log('Successfully inserted 4 test workers.');
    } catch (err) {
        console.error('InsertMany Error:', err.message);
        if (err.writeErrors) console.error('Write Errors:', err.writeErrors[0].errmsg);
        mongoose.connection.close();
        return;
    }

    // 3. Mock Job
    const job = {
        title: 'Repair leaking pipes',
        category: 'Plumbing',
        skills: [{ en: 'Plumbing', ta: 'பிளம்பிங்' }],
        location: 'Chennai Central',
        geoLocation: { type: 'Point', coordinates: [80.2707, 13.0827] }
    };

    const matchingService = require('./src/services/matchingService');
    const smsService = require('./src/services/smsService');

    // FETCH (Mirroring Job Controller)
    const candidates = await User.find({
        role: 'worker',
        isActive: true,
        phoneVerified: true
    }).select('name phone skills location availability rating completedJobs geoLocation');

    console.log(`\nFound ${candidates.length} candidate(s) for initial scoring.`);

    const rankedWorkers = matchingService.getTopMatchingWorkers(candidates, job, 50);

    console.log('\n--- Match Analysis (Filtered by phoneVerified) ---');
    rankedWorkers.forEach(m => {
        console.log(`[${m.match.total}%] ${m.worker.name} (Phone: ${m.worker.phone})`);
        console.log(`      Breakdown: Skill:${m.match.breakdown.skill}, Dist:${m.match.breakdown.distance}, Qual:${m.match.breakdown.quality}`);
    });

    const smsCandidates = rankedWorkers
        .filter(m => m.match.total >= 65)
        .slice(0, 5);

    console.log(`\nFound ${smsCandidates.length} high-relevance match(es) (Threshold 65%)`);

    for (const { worker, match } of smsCandidates) {
        console.log(`\nSIMULATING SMS TO ${worker.name}...`);
        const distanceText = match.breakdown.distance > 0 ? `${Math.round(30 - match.breakdown.distance)}km away` : 'near you';
        await smsService.sendMatchAlert(worker.phone, job.title, job.location, distanceText);
    }

    console.log('\n--- Cleanup ---');
    await User.deleteMany({ email: /test\.com$/ });
    console.log('Done.');
    mongoose.connection.close();
}

runTest().catch(err => {
    console.error('Fatal Test Error:', err);
    mongoose.connection.close();
});
