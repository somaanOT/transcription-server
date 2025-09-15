# Audio Transcription Server

A simple Express.js server that provides an API endpoint for audio transcription using AssemblyAI.

## Features

- Upload .wav audio files via POST request
- High-quality transcription using AssemblyAI
- Automatic file cleanup after processing
- Error handling and validation
- File size limit (25MB)
- Confidence score and language detection in transcription results
- Real-time polling for transcription completion

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. AssemblyAI Setup

You need to set up AssemblyAI API:

1. Sign up for a free account at [AssemblyAI](https://www.assemblyai.com/)
2. Get your API key from the dashboard
3. Create a `.env` file in the project root and add your API key:

```bash
# Create .env file
ASSEMBLY_AI_API_KEY=your_api_key_here
```

### 3. Start the Server

```bash
node transcription.js
```

The server will start on `http://localhost:3001`

## API Usage

### Health Check

```bash
GET http://localhost:3001/health
```

### Transcribe Audio

```bash
POST http://localhost:3001/transcribe
Content-Type: multipart/form-data

# Send audio file in the "audio" field
```

#### Example with curl:

```bash
curl -X POST -F "audio=@your-audio-file.wav" http://localhost:3001/transcribe
```

#### Example with JavaScript:

```javascript
const formData = new FormData();
formData.append('audio', audioFile);

fetch('http://localhost:3001/transcribe', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Response Format

### Success Response:

```json
{
  "success": true,
  "transcription": "Your transcribed text here",
  "confidence": 0.95,
  "language": "en_us",
  "duration": 45.2,
  "filename": "original-file.wav",
  "fileSize": 1024000,
  "transcriptId": "abc123def456"
}
```

### Error Response:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Supported Audio Formats

- WAV files only (as required by AssemblyAI)

## File Limits

- Maximum file size: 25MB (AssemblyAI limit)
- Files are automatically deleted after processing

## Testing

Run the test script:

```bash
node test-transcription.js
```

This will test the health endpoint and provide example usage instructions.
