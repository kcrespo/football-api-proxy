// api/football.js (pour Vercel)
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
        const matchdayNum = match.matchday;
        if (!transformedMatches[matchdayNum]) {
          transformedMatches[matchdayNum] = [];
        }
        
        transformedMatches[matchdayNum].push({
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
      source: 'football-data.org via Vercel',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
