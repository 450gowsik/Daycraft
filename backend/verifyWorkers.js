// Check and force verify all workers
const mongoose = require('mongoose')

async function forceVerifyWorkers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/daycraft')
        console.log('Connected to MongoDB')

        // First check current state
        const workers = await mongoose.connection.db.collection('users').find({ role: 'worker' }).limit(3).toArray()
        console.log('\nSample workers BEFORE:')
        workers.forEach(w => {
            console.log(`  ${w.name}: phone=${w.phoneVerified}, id=${w.idVerified}, location=${w.locationVerified}`)
        })

        // Force update ALL workers (not just those with false values)
        const result = await mongoose.connection.db.collection('users').updateMany(
            { role: 'worker' },
            {
                $set: {
                    phoneVerified: true,
                    idVerified: true,
                    locationVerified: true,
                    isActive: true  // Also ensure they're active
                }
            }
        )

        console.log(`\n✅ Matched ${result.matchedCount} workers, Modified ${result.modifiedCount}`)

        // Verify the update
        const workersAfter = await mongoose.connection.db.collection('users').find({ role: 'worker' }).limit(3).toArray()
        console.log('\nSample workers AFTER:')
        workersAfter.forEach(w => {
            console.log(`  ${w.name}: phone=${w.phoneVerified}, id=${w.idVerified}, location=${w.locationVerified}`)
        })

        // Count verified workers
        const verifiedCount = await mongoose.connection.db.collection('users').countDocuments({
            role: 'worker',
            phoneVerified: true,
            idVerified: true,
            locationVerified: true
        })
        console.log(`\n🎯 Total fully verified workers: ${verifiedCount}`)

        await mongoose.disconnect()
        process.exit(0)
    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

forceVerifyWorkers()
