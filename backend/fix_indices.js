const mongoose = require('mongoose');
require('dotenv').config();

const fixIndices = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/daycraft');
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('users');

        // List indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes);

        // Drop the phone index if it exists
        try {
            await collection.dropIndex('phone_1');
            console.log('Dropped phone_1 index');
        } catch (e) {
            console.log('phone_1 index not found or already dropped:', e.message);
        }

        // Drop email index too just in case (to ensure it re-creates cleanly if needed)
        // keeping email index is usually safer, but if email is sparse in schema and not in DB, same issue.
        // Schema says email is sparse and unique. Let's strictly target phone first as per error.

        console.log('Done. Mongoose should recreate indexes on next app start.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixIndices();
