import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Generation Route
  app.post("/api/generate-material", async (req, res) => {
    try {
      const { topic, subject } = req.body;
      
      if (!topic || !subject) {
        return res.status(400).json({ error: "Missing topic or subject" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Missing Gemini API Key" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `You are a personalized study companion for a university student named Chibote. 
      She is studying a subject called "${subject}", and specifically looking at the topic "${topic}".
      
      Provide a highly encouraging, clear, and structured study primer. Format your response strictly as JSON:
      {
        "summary": "A warm, concise 2-3 paragraph explanation of the topic, speaking directly to Chibote.",
        "whyItMatters": "A motivating one-liner tying it back to the big picture.",
        "resources": [
          {"title": "Resource title 1", "url": "https://example.com/1"},
          {"title": "Resource title 2", "url": "https://example.com/2"}
        ],
        "quiz": [
          {
            "question": "A quick multiple choice question testing the summary.",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0
          },
          {
            "question": "Another multiple choice question.",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 2
          }
        ]
      }
      Do not include any markdown block ticks around the JSON, just raw JSON. Make the resource links point to plausible generic educational resources (like Khan Academy, Wikipedia, or YouTube search links) if you don't have exact URLs.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const rawText = response.text || "{}";
      const cleanText = rawText.replace(/```json\n|\n```/g, '');
      
      const result = JSON.parse(cleanText);
      res.json(result);
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "Failed to generate study material", details: error.message });
    }
  });

  // Spotify OAuth Routes
  app.get("/api/auth/spotify/url", (req, res) => {
    const { redirectUri } = req.query;
    if (!redirectUri) {
      return res.status(400).json({ error: "Missing redirectUri" });
    }

    const state = JSON.stringify({ redirectUri: String(redirectUri) });
    const encodedState = Buffer.from(state).toString('base64');

    const params = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID || '',
      response_type: 'code',
      redirect_uri: String(redirectUri),
      scope: 'user-read-currently-playing user-read-playback-state user-modify-playback-state',
      state: encodedState
    });

    res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  });

  app.get(["/api/auth/spotify/callback", "/api/auth/spotify/callback/"], async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
      return res.send(`<p>Error: ${error}</p>`);
    }

    if (!code || !state) {
      return res.status(400).send('Missing code or state');
    }

    try {
      const decodedState = Buffer.from(String(state), 'base64').toString('utf-8');
      const { redirectUri } = JSON.parse(decodedState);

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: String(code),
          redirect_uri: redirectUri
        })
      });

      const tokens = await response.json();

      if (!response.ok) {
        throw new Error(tokens.error_description || 'Failed to fetch tokens');
      }

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', tokens: ${JSON.stringify(tokens)} }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("Spotify Auth Error:", err);
      res.status(500).send(`Authentication failed: ${err.message}`);
    }
  });

  app.post("/api/auth/spotify/refresh", async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: "Missing refresh_token" });

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: String(refresh_token)
        })
      });

      const tokens = await response.json();
      if (!response.ok) throw new Error(tokens.error_description || 'Failed to refresh token');

      res.json(tokens);
    } catch (err: any) {
      console.error("Spotify Refresh Error:", err);
      res.status(500).json({ error: "Failed to refresh token", details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
