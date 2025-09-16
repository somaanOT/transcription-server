require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT,
  },

  // AssemblyAI configuration
  assemblyai: {
    apiKey: process.env.ASSEMBLY_AI_API_KEY,
  },

  // MQTT configuration
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL,
    topic_prefix: "eutopia"
  },

  // File upload configuration
  upload: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: ['audio/wav'],
    allowedExtensions: ['.wav'],
  },

  // Directory paths
  directories: {
    uploads: './uploads',
    logs: './transcription_logs',
  },

  // Validation
  validate() {
    if (!this.assemblyai.apiKey) {
      console.error('❌ Error: ASSEMBLY_AI_API_KEY environment variable is required');
      console.log('Please set your AssemblyAI API key in the .env file:');
      console.log('ASSEMBLY_AI_API_KEY=your_api_key_here');
      process.exit(1);
    }
  }
};

module.exports = config;
