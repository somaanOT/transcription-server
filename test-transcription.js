const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Test script for the transcription endpoint
async function testTranscription() {
  const serverUrl = 'http://localhost:3001';
  
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch(`${serverUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Note: To test the actual transcription, you would need:
    // 1. A real .wav audio file
    // 2. AssemblyAI API key set up in .env file
    // 3. The assemblyai package installed
    
    console.log('\nTo test transcription:');
    console.log('1. Install dependencies: npm install');
    console.log('2. Set up AssemblyAI API key in .env file:');
    console.log('   ASSEMBLY_AI_API_KEY=your_api_key_here');
    console.log('3. Start the server: node transcription.js');
    console.log('4. Use curl or Postman to POST to http://localhost:3001/transcribe');
    console.log('   with a .wav audio file in the "audio" field');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Example curl command for testing
console.log('Example curl command:');
console.log('curl -X POST -F "audio=@your-audio-file.wav" http://localhost:3001/transcribe');

testTranscription();
