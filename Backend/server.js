const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');
const path = require('path');
const terminalRouter = require('./terminal'); // Update the path to match your file structure

const fetch = (...args) => 
  import('node-fetch').then(({default: fetch}) => fetch(...args));

const CLIENT_ID = process.env.CLIENT_ID;

// SECURITY ISSUE: Never expose your client secret in client-side code or commit it to public repositories
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const app = express();

// Configure CORS to allow requests from your frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Increase payload size limit for large files
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Create workspaces directory if it doesn't exist
const workspacesDir = path.join(__dirname, 'workspaces');
if (!require('fs').existsSync(workspacesDir)) {
  require('fs').mkdirSync(workspacesDir, { recursive: true });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Mount the terminal router with proper error handling
app.use('/api/terminal', (req, res, next) => {
  console.log('Terminal API Request:', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query
  });
  next();
}, terminalRouter);

// Get access token
app.get('/getAccessToken', async (req, res) => {
  const requestToken = req.query.code;
  const stateParam = req.query.state;
  
  if (!requestToken) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  if (!stateParam) {
    return res.status(400).json({ error: "State parameter is required" });
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: requestToken,
          redirect_uri: "http://localhost:5173/"
        })
      });      
    
    const data = await response.json();
    console.log("Access Token Response:", data);
    
    if (data.error) {
      return res.status(400).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error("Error getting access token:", error);
    res.status(500).json({ error: "Failed to get access token" });
  }
});

// Get user data
app.get('/getUserData', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const response = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "User-Agent": "GitHub-OAuth-App"
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `GitHub API error: ${response.status} ${response.statusText}` 
      });
    }
    
    const data = await response.json();
    console.log("User Data Response:", data);
    res.json(data);
  } catch (error) {
    console.error("Error getting user data:", error);
    res.status(500).json({ error: "Failed to get user data" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
  console.log('Workspaces directory:', workspacesDir);
});