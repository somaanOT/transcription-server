# Audio Transcription Server with MQTT

A modular Node.js server that transcribes audio files using AssemblyAI and publishes results via MQTT.

## 🏗️ Project Structure

```
├── config/
│   └── config.js          # Configuration management
├── services/
│   ├── mqttService.js     # MQTT client service
│   ├── transcriptionService.js  # AssemblyAI transcription service
│   └── fileUtils.js       # File operations utilities
├── server.js              # Main server entry point
├── transcription.js       # Deprecated (use server.js)
└── package.json
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file:
   ```env
   ASSEMBLY_AI_API_KEY=your_assemblyai_api_key_here
   MQTT_BROKER_URL=mqtt://localhost:52000
   MQTT_TOPIC=command
   PORT=3001
   ```

3. **Start the server:**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

## 📡 MQTT Integration

The server uses a dynamic MQTT service that allows publishing to any topic with any message.

### Default Behavior
The transcription endpoint publishes to the MQTT topic `command` with the following values:

- `TEST` - When the endpoint is hit
- `YES` - When help keywords are detected in transcription
- `NO` - When no help keywords are found
- `ERROR` - When transcription fails
- `NO_FILE` - When no audio file is provided

### Dynamic MQTT Service

The `MQTTService` class provides flexible MQTT operations:

```javascript
const MQTTService = require('./services/mqttService');

const mqttService = new MQTTService('mqtt://localhost:52000');
await mqttService.connect();

// Publish to any topic with any message
mqttService.publish('sensors/temperature', '25.5°C');
mqttService.publish('lights/living-room', 'ON');
mqttService.publish('alerts/system', 'All systems operational');

// Publish with options (QoS, retain, etc.)
mqttService.publish('important/status', 'Critical update', { 
  qos: 1, 
  retain: true 
});

// Subscribe to topics
mqttService.subscribe('sensors/+', (topic, message) => {
  console.log(`Received on ${topic}: ${message}`);
});

```

## 🎵 API Endpoints

### POST /transcribe
Upload a WAV audio file for transcription.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `audio` (WAV file)

**Response:**
- Status: 200 OK
- Body: `{"success": true, "message": "Audio received, processing via MQTT"}`

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "Transcription server is running",
  "service": "AssemblyAI SDK",
  "mqttConnected": true
}
```

## 🔧 Configuration

All configuration is managed in `config/config.js` and can be overridden with environment variables:

- `PORT` - Server port (default: 3001)
- `ASSEMBLY_AI_API_KEY` - AssemblyAI API key (required)
- `MQTT_BROKER_URL` - MQTT broker URL (default: mqtt://localhost:52000)
- `MQTT_TOPIC` - MQTT topic for publishing (default: command)

## 📁 File Management

- Audio files are temporarily stored in `./uploads/`
- Processed files are moved to `./transcription_logs/` with timestamps
- Individual transcription results are saved as JSON files
- A general log file `all_transcriptions.json` maintains all transcription history

## 🛠️ Services

### MQTTService
Handles MQTT broker connection and message publishing.

### TranscriptionService
Manages AssemblyAI transcription and keyword analysis.

### FileUtils
Provides utilities for file operations, directory management, and data persistence.

## 🔄 Migration from transcription.js

The old `transcription.js` file is now deprecated. The new modular structure provides:

- Better separation of concerns
- Improved error handling
- Enhanced logging
- Easier testing and maintenance
- Configuration management
- Cleaner code organization

## 📝 Logs

The server provides detailed console logging with emojis for easy identification:
- 🎤 Transcription requests
- 📁 File operations
- 📤 MQTT publishing
- ✅ Success operations
- ❌ Error conditions
- 🔗 Connection status
