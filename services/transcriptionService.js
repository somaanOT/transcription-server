const { AssemblyAI } = require('assemblyai');
const fs = require('fs');
const path = require('path');

class TranscriptionService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('AssemblyAI API key is required');
    }
    
    this.client = new AssemblyAI({ apiKey });
    this.yesKeywords = ["help", "help utopia", "help eutopia"];
  }

  async transcribeAudio(audioFilePath) {
    try {
      console.log(`🎵 Processing audio file: ${path.basename(audioFilePath)}`);

      const params = {
        audio: audioFilePath,
        language_code: 'en_us',
        punctuate: true,
        format_text: true,
        auto_highlights: false,
        sentiment_analysis: false,
        entity_detection: false
      };

      const transcript = await this.client.transcripts.transcribe(params);

      if (transcript.status === "error") {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      console.log("✅ Transcription successful");
      return transcript;
    } catch (error) {
      console.error('❌ Transcription error:', error);
      throw error;
    }
  }

  analyzeTranscription(transcriptText) {
    const lowerText = transcriptText.toLowerCase();
    
    for (const keyword of this.yesKeywords) {
      if (lowerText.includes(keyword)) {
        console.log(`🎯 YES keyword found: "${keyword}" in transcription: ${transcriptText}`);
        return 'YES';
      }
    }
    
    console.log("❌ No YES keywords found in transcription");
    return 'NO';
  }

  setYesKeywords(keywords) {
    this.yesKeywords = keywords;
  }

  getYesKeywords() {
    return this.yesKeywords;
  }
}

module.exports = TranscriptionService;
