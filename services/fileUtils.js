const fs = require('fs');
const path = require('path');

class FileUtils {
  static ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static createTimestampedFolder(baseDir, prefix = 'transcription') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderName = `${prefix}_${timestamp}`;
    const folderPath = path.join(baseDir, folderName);
    
    this.ensureDirectoryExists(folderPath);
    return { folderPath, timestamp };
  }

  static moveFile(sourcePath, destinationPath) {
    try {
      fs.renameSync(sourcePath, destinationPath);
      console.log(`📁 File moved to: ${destinationPath}`);
      return true;
    } catch (error) {
      console.error('❌ Error moving file:', error);
      return false;
    }
  }

  static saveTranscriptionData(data, filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`💾 Transcription data saved to: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ Error saving transcription data:', error);
      return false;
    }
  }

  static appendToGeneralLog(data, logPath) {
    try {
      let allTranscriptions = [];
      
      if (fs.existsSync(logPath)) {
        try {
          const existingData = fs.readFileSync(logPath, 'utf8');
          allTranscriptions = JSON.parse(existingData);
        } catch (error) {
          console.log('📝 Creating new general log file');
        }
      }
      
      allTranscriptions.push(data);
      fs.writeFileSync(logPath, JSON.stringify(allTranscriptions, null, 2));
      console.log(`📝 Appended to general log: ${logPath}`);
      return true;
    } catch (error) {
      console.error('❌ Error appending to general log:', error);
      return false;
    }
  }

  static createTranscriptionData(originalFile, audioFilePath, transcript) {
    return {
      timestamp: new Date().toISOString(),
      filename: originalFile.originalname,
      fileSize: originalFile.size,
      audioFilePath: audioFilePath,
      transcription: transcript.text,
      confidence: transcript.confidence,
      language: transcript.language_code,
      duration: transcript.audio_duration,
      transcriptId: transcript.id,
      status: transcript.status
    };
  }

  static cleanupTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up temp file: ${filePath}`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up temp file:', error);
    }
  }
}

module.exports = FileUtils;
