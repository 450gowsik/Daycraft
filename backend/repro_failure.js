const { orchestrateChat } = require('./src/services/aiOrchestrator');
const { getChatResponse } = require('./src/services/groqService');
const mongoose = require('mongoose');
require('dotenv').config();

async function testQuery() {
    try {
        // Connect to DB as orchestrator might need it for job queries
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('Connected to MongoDB');
        }

        const query = "how to find nearby employee using my current location : Coimbatore";
        console.log(`Testing query: "${query}"`);

        // 1. Test Orchestrator
        console.log('\n--- Testing Orchestrator ---');
        const orchestratedResponse = await orchestrateChat(query, [], 'en', {});

        if (orchestratedResponse) {
            console.log('✅ Orchestrator handled it:');
            console.log(JSON.stringify(orchestratedResponse, null, 2));
        } else {
            console.log('⚡ Orchestrator fell back to LLM');

            // 2. Test LLM Fallback
            console.log('\n--- Testing LLM Fallback ---');
            try {
                const llmResponse = await getChatResponse(query, [], 'en');
                console.log('✅ LLM Response:');
                console.log(JSON.stringify(llmResponse, null, 2));
            } catch (llmError) {
                console.error('❌ LLM Fallback Failed:');
                console.error(llmError.message);
                if (llmError.stack) console.error(llmError.stack);
            }
        }

    } catch (error) {
        console.error('❌ Test script error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

testQuery();
