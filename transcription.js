require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { AssemblyAI } = require('assemblyai');

const app = express();
const PORT = process.env.PORT || 3001;

// AssemblyAI configuration
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLY_AI_API_KEY;

if (!ASSEMBLYAI_API_KEY) {
  console.error('Error: ASSEMBLY_AI_API_KEY environment variable is required');
  console.log('Please set your AssemblyAI API key in the .env file:');
  console.log('ASSEMBLY_AI_API_KEY=your_api_key_here');
  process.exit(1);
}

// Initialize AssemblyAI client
const client = new AssemblyAI({
  apiKey: ASSEMBLYAI_API_KEY,
});

// Configure multer for file uploads (only WAV files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.wav');
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit (AssemblyAI supports up to 25MB)
  },
  fileFilter: (req, file, cb) => {
    // Only accept WAV files
    if (file.mimetype === 'audio/wav' || file.originalname.toLowerCase().endsWith('.wav')) {
      cb(null, true);
    } else {
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
    service: 'AssemblyAI SDK'
  });
});

// Audio transcription endpoint
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log("==================================================")
    console.log(`Hit at ${new Date().toISOString()}`);

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided. Please upload a .wav file using the "audio" field.'
      });
    }

    console.log(`Processing audio file: ${req.file.filename}`);

    // Use the local file path for transcription
    const audioFile = req.file.path;

    // Configure transcription parameters
    const params = {
      audio: audioFile,
      language_code: 'en_us', // You can make this configurable
      punctuate: true,
      format_text: true,
      auto_highlights: false,
      sentiment_analysis: false,
      entity_detection: false
    };

    // Perform the transcription using AssemblyAI SDK
    const transcript = await client.transcripts.transcribe(params);

    // Check if transcription failed
    if (transcript.status === "error") {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }
    console.log("Transcription successful");

    // Create logs directory if it doesn't exist
    const logsDir = './transcription_logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create a unique folder for this transcription
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const transcriptionFolder = path.join(logsDir, `transcription_${timestamp}`);
    fs.mkdirSync(transcriptionFolder, { recursive: true });

    // Move the audio file to the transcription folder
    const audioFilename = `audio_${timestamp}.wav`;
    const audioFilePath = path.join(transcriptionFolder, audioFilename);
    fs.renameSync(req.file.path, audioFilePath);
    console.log(`Audio file saved to: ${audioFilePath}`);

    // Save transcription result locally
    const transcriptionData = {
      timestamp: new Date().toISOString(),
      filename: req.file.originalname,
      fileSize: req.file.size,
      audioFilePath: audioFilePath,
      transcription: transcript.text,
      confidence: transcript.confidence,
      language: transcript.language_code,
      duration: transcript.audio_duration,
      transcriptId: transcript.id,
      status: transcript.status
    };

    // Save to individual file with timestamp
    const logFilename = `transcription_${timestamp}.json`;
    const logFilePath = path.join(transcriptionFolder, logFilename);
    
    fs.writeFileSync(logFilePath, JSON.stringify(transcriptionData, null, 2));
    console.log(`Transcription saved to: ${logFilePath}`);

    // Also append to a general log file
    const generalLogPath = path.join(logsDir, 'all_transcriptions.json');
    let allTranscriptions = [];
    
    if (fs.existsSync(generalLogPath)) {
      try {
        const existingData = fs.readFileSync(generalLogPath, 'utf8');
        allTranscriptions = JSON.parse(existingData);
      } catch (error) {
        console.log('Creating new general log file');
      }
    }
    
    allTranscriptions.push(transcriptionData);
    fs.writeFileSync(generalLogPath, JSON.stringify(allTranscriptions, null, 2));

    const YES_KEYWORDS = ["help", "help utopia", "help eutopia"]

    if(transcript.text.toLowerCase().includes(YES_KEYWORDS)) {
      console.log(`YES_KEYWORDS found in transcription: ${transcript.text}`);
      res.json({
        success: true,
        command: "YES",
      });
      return;
    }

    res.json({
      success: true,
      command: "NO",
    });



    // Return the transcription result
    // res.json({
    //   success: true,
    //   transcription: transcript.text,
    //   confidence: transcript.confidence,
    //   language: transcript.language_code,
    //   duration: transcript.audio_duration,
    //   filename: req.file.originalname,
    //   fileSize: req.file.size,
    //   transcriptId: transcript.id,
    //   status: transcript.status
    // });

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Save the audio file even if transcription failed
    if (req.file && fs.existsSync(req.file.path)) {
      const logsDir = './transcription_logs';
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const errorFolder = path.join(logsDir, `error_${timestamp}`);
      fs.mkdirSync(errorFolder, { recursive: true });
      
      const audioFilename = `audio_${timestamp}.wav`;
      const audioFilePath = path.join(errorFolder, audioFilename);
      fs.renameSync(req.file.path, audioFilePath);
      
      console.log(`Audio file saved to error folder: ${audioFilePath}`);
    }

    res.status(500).json({
      success: false,
      error: 'Transcription failed',
      message: error.message
    });
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

// Start the server
app.listen(PORT, () => {
  console.log(`Transcription server is running on http://localhost:${PORT}`);
  console.log(`Upload .wav files to: http://localhost:${PORT}/transcribe`);
  console.log('Using AssemblyAI SDK for speech-to-text transcription');
  console.log(`API Key: ${ASSEMBLYAI_API_KEY.substring(0, 8)}...`);
});

module.exports = app;