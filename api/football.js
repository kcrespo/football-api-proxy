export default async function handler(req, res) {
  // CORS headers complets
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 heures

  // IMPORTANT : Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    console.log('🔄 Requête OPTIONS (preflight) reçue');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { matchday } = req.query;
    const API_KEY = process.env.FOOTBALL_API_KEY;
    
    console.log(`📡 Requête API reçue depuis: ${req.headers.origin || 'inconnu'}`);
    console.log(`🔑 Clé API configurée: ${!!API_KEY}`);
    
    if (!API_KEY) {
      return res.status(500).json({ 
        success: false,
        error: 'Clé API non configurée' 
      });
    }
    
    let apiUrl = 'https://api.football-data.org/v4/competitions/2015/matches';
    if (matchday) apiUrl += `?matchday=${matchday}`;

    console.log(`🎯 Appel Football-Data: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: { 
        'X-Auth-Token': API_KEY,
        'User-Agent': 'PronosticsApp/1.0'
      }
    });

    console.log(`📊 Réponse Football-Data: ${response.status}`);

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

    console.log(`✅ ${Object.keys(transformedMatches).length} journées préparées`);

    return res.status(200).json({
      success: true,
      matches: transformedMatches,
      source: 'football-data.org via Vercel',
      timestamp: new Date().toISOString(),
      totalMatches: data.matches?.length || 0
    });

  } catch (error) {
    console.error('❌ Erreur API:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
