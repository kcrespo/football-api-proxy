const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/football', async (req, res) => {
  try {
    const { matchday } = req.query;
    const API_KEY = process.env.FOOTBALL_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ 
        success: false,
        error: 'Clé API non configurée' 
      });
    }
    
    let apiUrl = 'https://api.football-data.org/v4/competitions/2015/matches';
    if (matchday) apiUrl += `?matchday=${matchday}`;

    const response = await fetch(apiUrl, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}`);
    }

    const data = await response.json();
    
    const transformedMatches = {};
    if (data.matches) {
      data.matches.forEach(match => {
        const matchday = match.matchday;
        if (!transformedMatches[matchday]) {
          transformedMatches[matchday] = [];
        }
        
        transformedMatches[matchday].push({
          id: match.id,
          homeTeam: match.homeTeam.shortName || match.homeTeam.name,
          awayTeam: match.awayTeam.shortName || match.awayTeam.name,
          date: match.utcDate,
          status: match.status,
          result: match.status === 'FINISHED' 
            ? `${match.score.fullTime.home}-${match.score.fullTime.away}` 
            : null
        });
      });
    }

    res.json({
      success: true,
      matches: transformedMatches,
      source: 'football-data.org'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({ message: '⚽ Football API Proxy OK!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
