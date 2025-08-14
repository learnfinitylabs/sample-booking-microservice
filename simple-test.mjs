import fetch from 'node-fetch';

console.log('🚀 Simple Booking API Test');
console.log('Testing basic endpoints...');

const BASE_URL = 'http://localhost:5173';
const API_KEY = '61d98f73-6746-4700-b388-93bd9de72801.uydigcx8engdm4az6mjhc';

async function simpleTest() {
    try {
        // Test health
        console.log('Testing health endpoint...');
        const health = await fetch(`${BASE_URL}/api/health`);
        const healthData = await health.json();
        console.log('Health status:', healthData.status);
        
        // Test resources
        console.log('Testing resources endpoint...');
        const resources = await fetch(`${BASE_URL}/api/resources?api_key=${API_KEY}`);
        const resourcesData = await resources.json();
        console.log('Resources found:', resourcesData.data?.length || 0);
        
        console.log('✅ Basic tests completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

simpleTest();
