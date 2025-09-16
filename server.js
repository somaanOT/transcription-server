const express = require('express');
const multer = require('multer');
const path = require('path');

// Import our services
const MQTTService = require('./services/mqttService');
const TranscriptionService = require('./services/transcriptionService');
const FileUtils = require('./services/fileUtils');
const config = require('./config/config');

// Validate configuration
config.validate();

const app = express();
const PORT = config.server.port;

const MQTT_TOPIC_COMMAND = "command";

// Initialize services
const mqttService = new MQTTService(config.mqtt.brokerUrl, config.mqtt.topic_prefix);
const transcriptionService = new TranscriptionService(config.assemblyai.apiKey);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    FileUtils.ensureDirectoryExists(config.directories.uploads);
    cb(null, config.directories.uploads);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.wav');
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter - Fieldname:', file.fieldname);
    console.log('🔍 File filter - Original name:', file.originalname);
    console.log('🔍 File filter - MIME type:', file.mimetype);
    
    const isValidMimeType = config.upload.allowedMimeTypes.includes(file.mimetype);
    const isValidExtension = config.upload.allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    console.log('🔍 File filter - Valid MIME type:', isValidMimeType);
    console.log('🔍 File filter - Valid extension:', isValidExtension);
    
    if (isValidMimeType || isValidExtension) {
      console.log('✅ File accepted by filter');
      cb(null, true);
    } else {
      console.log('❌ File rejected by filter');
      cb(new Error('Invalid file type. Only .wav files are allowed.'), false);
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Transcription server is running',
    service: 'AssemblyAI SDK',
    mqttConnected: mqttService.getConnectionStatus()
  });
});

// Audio transcription endpoint
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log("=".repeat(50));
    console.log(`🎤 Transcription request at ${new Date().toISOString()}`);
    console.log('📋 Request body keys:', req.body ? Object.keys(req.body) : 'No body');
    console.log('📁 Request file:', req.file ? 'Present' : 'Missing');
    console.log('📝 Content-Type:', req.get('Content-Type'));
    
    // Check if file was uploaded
    if (!req.file) {
      console.log('❌ No audio file provided');
      return res.status(400).json({
        success: false,
        error: 'No audio file provided. Please upload a .wav file using the "audio" field.'
      });
    }

    // // Always respond with 200 OK to the API call
    // res.status(200).json({
    //   success: true,
    //   message: "Audio received. Response will be sent on MQTT"
    // });    

    console.log(`📁 Processing audio file: ${req.file.filename}`);

    // Perform transcription
    const transcript = await transcriptionService.transcribeAudio(req.file.path);

    // Create logs directory
    FileUtils.ensureDirectoryExists(config.directories.logs);

    // Create timestamped folder for this transcription
    const { folderPath, timestamp } = FileUtils.createTimestampedFolder(
      config.directories.logs, 
      'transcription'
    );

    // Move audio file to transcription folder
    const audioFilename = `audio_${timestamp}.wav`;
    const audioFilePath = path.join(folderPath, audioFilename);
    FileUtils.moveFile(req.file.path, audioFilePath);

    // Create transcription data
    const transcriptionData = FileUtils.createTranscriptionData(
      req.file, 
      audioFilePath, 
      transcript
    );

    // Save individual transcription file
    const logFilename = `transcription_${timestamp}.json`;
    const logFilePath = path.join(folderPath, logFilename);
    FileUtils.saveTranscriptionData(transcriptionData, logFilePath);

    // Append to general log
    const generalLogPath = path.join(config.directories.logs, 'all_transcriptions.json');
    FileUtils.appendToGeneralLog(transcriptionData, generalLogPath);

    // Analyze transcription and publish result
    const command = transcriptionService.analyzeTranscription(transcript.text);

    // Let the device know the command result
    // mqttService.publish(MQTT_TOPIC_COMMAND, command);

    res.json({
        success: true,
        command: command,
    })

    console.log("=".repeat(50));

  } catch (error) {
    console.error('❌ Error Occurred:', error);

    res.json({
        success: false,
        command: "ERROR",
    })
    // mqttService.publish(MQTT_TOPIC_COMMAND, "ERROR");

    
    // Save the audio file even if transcription failed
    if (req.file && require('fs').existsSync(req.file.path)) {
      const { folderPath, timestamp } = FileUtils.createTimestampedFolder(
        config.directories.logs, 
        'error'
      );
      
      const audioFilename = `audio_${timestamp}.wav`;
      const audioFilePath = path.join(folderPath, audioFilename);
      FileUtils.moveFile(req.file.path, audioFilePath);
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Audio file must be smaller than 25MB'
      });
    }
  }
  
  res.status(500).json({
    error: 'Server error',
    message: error.message
  });
});

// Initialize MQTT connection and start server
async function startServer() {
  try {
    // Connect to MQTT broker
    // await mqttService.connect();
    
    // Start the HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Transcription server is running on http://localhost:${PORT}`);
      console.log(`📤 Upload .wav files to: http://localhost:${PORT}/transcribe`);
    //   console.log(`🔗 MQTT broker: ${config.mqtt.brokerUrl}`);
    //   console.log(`📡 MQTT topic: ${config.mqtt.topic}`);
      console.log(`🔑 API Key: ${config.assemblyai.apiKey.substring(0, 8)}...`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  mqttService.disconnect();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;