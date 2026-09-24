import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
    try {
        console.log('Testing Gemini API...');
        console.log('API Key:', process.env.GEMINI_API_KEY ? 'Set (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'NOT SET');
        
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent('Say hello in 5 words');
        const response = await result.response;
        const text = response.text();
        
        console.log('\n✅ Success! Gemini API is working.');
        console.log('Response:', text);
    } catch (error) {
        console.error('\n❌ Error testing Gemini API:');
        console.error('Message:', error.message);
        console.error('\nFull error:', error);
        
        console.log('\n📝 To fix this:');
        console.log('1. Get a FREE API key from: https://makersuite.google.com/app/apikey');
        console.log('2. Add it to your .env file: GEMINI_API_KEY=your_key_here');
        console.log('3. Restart the server');
    }
}

testGemini();
