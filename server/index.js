import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { americanToImplied, removeVig, formatPercent } from './utils.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const ODDS_API_KEY = process.env.ODDS_API_KEY;

function processGame(game) {
  const bookmakers = game.bookmakers;
  if (!bookmakers || bookmakers.length === 0) return null;

  // Average implied probabilities across all books
  let homeProbSum = 0;
  let awayProbSum = 0;
  let bookCount = 0;

  bookmakers.forEach(book => {
    const market = book.markets.find(m => m.key === 'h2h');
    if (!market) return;

    const homeOutcome = market.outcomes.find(o => o.name === game.home_team);
    const awayOutcome = market.outcomes.find(o => o.name === game.away_team);
    if (!homeOutcome || !awayOutcome) return;

    const homeImplied = americanToImplied(homeOutcome.price);
    const awayImplied = americanToImplied(awayOutcome.price);
    const vigRemoved = removeVig(homeImplied, awayImplied);

    homeProbSum += vigRemoved.home;
    awayProbSum += vigRemoved.away;
    bookCount++;
  });

  if (bookCount === 0) return null;

  const consensusHome = homeProbSum / bookCount;
  const consensusAway = awayProbSum / bookCount;

  return {
    id: game.id,
    homeTeam: game.home_team,
    awayTeam: game.away_team,
    commenceTime: game.commence_time,
    consensus: {
      home: formatPercent(consensusHome),
      away: formatPercent(consensusAway),
      homeRaw: consensusHome,
      awayRaw: consensusAway
    },
    bookCount
  };
}

app.get('/api/odds/nba', async (req, res) => {
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american`
    );
    const data = await response.json();
    const processed = data
      .map(processGame)
      .filter(Boolean);
    res.json(processed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch odds' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});