import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ---- In-memory leaderboard (MVP) ----
const scores = []; // { fid, username, score, createdAt }

app.post('/api/score', (req, res) => {
  const { fid, username, score } = req.body || {};
  const numericScore = Number(score);

  if (!Number.isFinite(numericScore) || numericScore < 0) {
    return res.status(400).json({ ok: false, error: 'invalid score' });
  }

  scores.push({
    fid: fid ?? null,
    username: username ?? null,
    score: numericScore,
    createdAt: new Date().toISOString(),
  });

  return res.json({ ok: true, saved: { fid, username, score: numericScore } });
});

app.get('/api/leaderboard', (req, res) => {
  const top = [...scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 25);
  res.json({ ok: true, top, total: scores.length });
});

// Health check
app.get('/health', (req, res) => res.send('ok'));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Farcaster Mario Mini App running on http://localhost:${port}`);
});
