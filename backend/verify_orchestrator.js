const { orchestrateChat, classifyIntent } = require('./src/services/aiOrchestrator');
const mongoose = require('mongoose');
require('dotenv').config();

async function verify() {
    try {
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('Connected to MongoDB');
        }

        const queries = [
            "how to find nearby employee using my current location : Coimbatore",
            "can you find all jobs near coimbatore",
            "show me the number of workers in Coimbatore who have rating above 4.5",
            "find workers near Madurai",
            "any laborers in Chennai?",
            "hi",
            "Is my data safe?"
        ];

        for (const query of queries) {
            console.log(`\nTesting Query: "${query}"`);
            const { intent } = classifyIntent(query);
            console.log(`Intent: ${intent}`);

            const response = await orchestrateChat(query, [], 'en', {});
            if (response) {
                console.log(`✅ Handled by: ${response.source}`);
                console.log(`Text: ${response.text.substring(0, 50)}...`);
                if (response.action) console.log(`Action: ${JSON.stringify(response.action)}`);
            } else {
                console.log('⚡ Falls back to LLM');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

verify();
