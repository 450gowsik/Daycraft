/**
 * Migration Script: Local MongoDB to MongoDB Atlas
 * 
 * This script copies all data from your local MongoDB to MongoDB Atlas cloud.
 * Run with: node scripts/migrateToCloud.js
 */

const { MongoClient } = require('mongodb');

// Connection strings
const LOCAL_URI = 'mongodb://localhost:27017/daycraft';
const CLOUD_URI = 'mongodb+srv://gowsikbabubabu_db_user:gowsiksharma@daycraft.b2da3va.mongodb.net/daycraft?retryWrites=true&w=majority&appName=daycraft';

async function migrateData() {
    console.log('🚀 Starting data migration from localhost to MongoDB Atlas...\n');

    let localClient, cloudClient;

    try {
        // Connect to local MongoDB
        console.log('📡 Connecting to local MongoDB...');
        localClient = new MongoClient(LOCAL_URI);
        await localClient.connect();
        console.log('✅ Connected to local MongoDB\n');

        // Connect to cloud MongoDB
        console.log('☁️  Connecting to MongoDB Atlas...');
        cloudClient = new MongoClient(CLOUD_URI);
        await cloudClient.connect();
        console.log('✅ Connected to MongoDB Atlas\n');

        const localDb = localClient.db('daycraft');
        const cloudDb = cloudClient.db('daycraft');

        // Get all collections from local database
        const collections = await localDb.listCollections().toArray();
        console.log(`📦 Found ${collections.length} collections to migrate:\n`);

        let totalDocuments = 0;

        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;

            // Skip system collections
            if (collectionName.startsWith('system.')) {
                console.log(`⏭️  Skipping system collection: ${collectionName}`);
                continue;
            }

            const localCollection = localDb.collection(collectionName);
            const cloudCollection = cloudDb.collection(collectionName);

            // Get all documents from local collection
            const documents = await localCollection.find({}).toArray();
            const docCount = documents.length;

            if (docCount === 0) {
                console.log(`📭 ${collectionName}: No documents to migrate`);
                continue;
            }

            // Check existing documents in cloud to avoid duplicates
            const existingCount = await cloudCollection.countDocuments();

            if (existingCount > 0) {
                console.log(`⚠️  ${collectionName}: Cloud already has ${existingCount} documents`);
                console.log(`   Clearing cloud collection before migration...`);
                await cloudCollection.deleteMany({});
            }

            // Insert documents to cloud
            const result = await cloudCollection.insertMany(documents);
            console.log(`✅ ${collectionName}: Migrated ${result.insertedCount} documents`);
            totalDocuments += result.insertedCount;
        }

        console.log('\n' + '='.repeat(50));
        console.log(`🎉 Migration complete! Total documents migrated: ${totalDocuments}`);
        console.log('='.repeat(50));

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        // Close connections
        if (localClient) {
            await localClient.close();
            console.log('\n📴 Closed local MongoDB connection');
        }
        if (cloudClient) {
            await cloudClient.close();
            console.log('📴 Closed MongoDB Atlas connection');
        }
    }
}

// Run migration
migrateData()
    .then(() => {
        console.log('\n✨ All done! Your data is now in MongoDB Atlas.');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n💥 Error during migration:', err);
        process.exit(1);
    });
