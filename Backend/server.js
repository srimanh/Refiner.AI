const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bodyParser = require('body-parser');

const fetch = (...args) => 
  import('node-fetch').then(({default: fetch}) => fetch(...args));

const CLIENT_ID = process.env.CLIENT_ID;

// SECURITY ISSUE: Never expose your client secret in client-side code or commit it to public repositories
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const app = express();

app.use(cors());
app.use(bodyParser.json());

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
          // redirect_uri: "https://refinerai-1.onrender.com",
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
        "User-Agent": "GitHub-OAuth-App"  // GitHub API requires a user agent
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

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});