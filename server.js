const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// GET endpoint that accepts 'bytes' query parameter
app.get('/bytes', (req, res) => {
    console.log(`Hit at ${new Date().toISOString()}`);
    const bytes = req.query.size;
    
    // Validate the bytes parameter
    if (!bytes) {
        return res.status(400).json({ 
            error: 'Missing required query parameter: bytes' 
        });
    }
    
    // Convert to number and validate
    const numBytes = parseInt(bytes, 10);
    
    if (isNaN(numBytes) || numBytes < 0) {
        return res.status(400).json({ 
            error: 'Invalid bytes parameter. Must be a positive number.' 
        });
    }
    
    // Limit the maximum bytes to prevent memory issues
    const MAX_BYTES = 1000000; // 1MB limit
    if (numBytes > MAX_BYTES) {
        return res.status(400).json({ 
            error: `Bytes parameter too large. Maximum allowed: ${MAX_BYTES}` 
        });
    }
    
    // Generate a string of the specified number of bytes
    // Using 'A' character repeated to create the exact byte count
    const responseString = 'A'.repeat(numBytes);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', numBytes.toString());
    
    // Send the response
    res.send(responseString);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Try: http://localhost:${PORT}/bytes?size=100`);
});

module.exports = app;
