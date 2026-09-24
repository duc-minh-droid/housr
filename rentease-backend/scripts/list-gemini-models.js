import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        console.log('Fetching available models...\n');
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Available models:\n');
        data.models.forEach(model => {
            console.log(`Name: ${model.name}`);
            console.log(`Display Name: ${model.displayName}`);
            console.log(`Supported: ${model.supportedGenerationMethods.join(', ')}`);
            console.log('---');
        });
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        if (error.message.includes('401') || error.message.includes('403')) {
            console.log('\n⚠️  Invalid API Key!');
            console.log('\nYour current API key appears to be invalid or expired.');
            console.log('\n📝 To fix:');
            console.log('1. Visit: https://aistudio.google.com/app/apikey');
            console.log('2. Create a new API key');
            console.log('3. Update .env file: GEMINI_API_KEY=your_new_key');
        }
    }
}

listModels();
