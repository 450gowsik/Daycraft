require('dotenv').config({ path: './.env' })
const mongoose = require('mongoose')
const User = require('./src/models/User') // Assuming User model is needed for Employer/Worker base
const Worker = require('./src/models/Worker')
const Job = require('./src/models/Job')
const matchingService = require('./src/services/matching.service')

const verifyMatching = async () => {
    try {
        console.log('Connecting to DB...')
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/daycraft')
        console.log('Connected.')

        // 1. Setup Data
        console.log('Seeding Test Data...')

        // Employer
        const employer = await User.create({
            name: 'Test Employer',
            email: `emp_${Date.now()}@test.com`,
            password: 'password123',
            role: 'employer',
            profileCompleted: true
        })

        // Job: Requires 'Plumber', Location: Chennai (13.0827, 80.2707)
        const job = await Job.create({
            employer: employer._id,
            title: { en: 'Urgent Plumber Needed' },
            description: { en: 'Fix leaking pipe' },
            category: 'Plumbing',
            location: 'Chennai',
            geoLocation: { type: 'Point', coordinates: [80.2707, 13.0827] }, // [lng, lat]
            wage: 500,
            skills: [{ en: 'Pipe Fixing' }, { en: 'Tap Repair' }],
            status: 'open'
        })

        // Workers
        const workersData = [
            {
                // Perfect Match: Verified, Skilled, Near (1km)
                name: 'Worker A (Perfect)',
                email: `w1_${Date.now()}@test.com`,
                location: 'Chennai Near',
                geoLocation: { type: 'Point', coordinates: [80.2750, 13.0850] },
                skills: [{ en: 'Pipe Fixing' }, { en: 'Drilling' }],
                phoneVerified: true, idVerified: true, photoVerified: true, profileCompleted: true,
                rating: 5.0,
                completedJobs: 10
            },
            {
                // Good Match: Verified, Skilled, Far (10km)
                name: 'Worker B (Far)',
                email: `w2_${Date.now()}@test.com`,
                location: 'Chennai Far',
                geoLocation: { type: 'Point', coordinates: [80.2000, 13.0000] },
                skills: [{ en: 'Pipe Fixing' }],
                phoneVerified: true, idVerified: true, photoVerified: true, profileCompleted: true,
                rating: 4.5,
                completedJobs: 5
            },
            {
                // Trusted but Unkilled: Verified, Near, No Skills
                name: 'Worker C (Unskilled)',
                email: `w3_${Date.now()}@test.com`,
                location: 'Chennai Near',
                geoLocation: { type: 'Point', coordinates: [80.2750, 13.0850] },
                skills: [{ en: 'Painting' }], // Mismatch
                phoneVerified: true, idVerified: true, photoVerified: true, profileCompleted: true,
                rating: 5.0,
                completedJobs: 20
            },
            {
                // Unverified: Skilled, Near, but Unverified (Should be excluded)
                name: 'Worker D (Unverified)',
                email: `w4_${Date.now()}@test.com`,
                location: 'Chennai Near',
                geoLocation: { type: 'Point', coordinates: [80.2750, 13.0850] },
                skills: [{ en: 'Pipe Fixing' }],
                phoneVerified: false, idVerified: false, photoVerified: false, profileCompleted: false, // Score 0
                rating: 4.0,
                completedJobs: 0
            }
        ]

        const workers = await Worker.create(workersData)

        // 2. Run Matching
        console.log('\nRunning Matching Algorithm...')
        console.time('MatchingTime')
        const matches = await matchingService.findMatchesForJob(job._id)
        console.timeEnd('MatchingTime')

        // 3. Verify Results
        console.log('\n--- MATCHING RESULTS ---')
        matches.forEach((m, i) => {
            console.log(`#${i + 1} ${m.worker.name}`)
            console.log(`   Total Score: ${m.scores.total}`)
            console.log(`   Breakdown: Match=${m.scores.match}, Verification=${m.scores.verification}`)
            console.log(`   Distance: ${m.distance}km`)
            console.log('------------------------')
        })

        // Assertions
        const names = matches.map(m => m.worker.name)

        // 1. Unverified worker should be excluded (Verification Gate)
        if (names.includes('Worker D (Unverified)')) console.error('FAIL: Unverified worker included!')
        else console.log('PASS: Unverified worker excluded.')

        // 2. Unskilled worker should be excluded (Hard Constraint)
        if (names.includes('Worker C (Unskilled)')) console.error('FAIL: Unskilled worker included!')
        else console.log('PASS: Unskilled worker excluded.')

        // 3. Perfect match should be #1
        if (names[0] === 'Worker A (Perfect)') console.log('PASS: Perfect match is ranked first.')
        else console.error(`FAIL: Top rank is ${names[0]}`)

        // Cleanup
        console.log('\nCleaning up...')
        await Job.deleteOne({ _id: job._id })
        await User.deleteOne({ _id: employer._id })
        await Worker.deleteMany({ _id: { $in: workers.map(w => w._id) } })
        console.log('Done.')
        process.exit(0)

    } catch (error) {
        console.error('Verification Failed:', error)
        process.exit(1)
    }
}

verifyMatching()
