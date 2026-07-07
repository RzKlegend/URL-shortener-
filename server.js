const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

const DB_PATH = path.join(__dirname, 'data', 'links.json');
if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]');

app.use(express.static(__dirname));
app.use(bodyParser.json());

function loadDb() { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function saveDb(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

app.post('/api/shorten', (req, res) => {
  const { url, mode, alias } = req.body;
  if (!url || !/^https?:\/\//.test(url)) return res.status(400).json({ error: 'Invalid URL' });
  const db = loadDb();
  let shortCode = alias;
  if (!shortCode) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    shortCode = '';
    for (let i = 0; i < 6; i++) {
      shortCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  const shortUrl = `${req.protocol}://${req.get('host')}/#s/${shortCode}`;
  
  if (mode === 'local' && db.find(l => l.shortCode === shortCode && l.type === 'local')) {
    return res.status(409).json({ error: 'Alias already exists' });
  }

  const record = {
    id: Date.now().toString(),
    originalUrl: url,
    shortUrl,
    shortCode,
    type: mode,
    clicks: 0,
    date: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };
  
  db.unshift(record);
  saveDb(db);
  res.json({ shortUrl, shortCode });
});

app.get('/api/link/:code', (req, res) => {
  const code = req.params.code;
  const db = loadDb();
  const link = db.find(l => l.shortCode === code);
  if (!link) return res.status(404).json({ error: 'Not found' });
  
  // Update clicks
  link.clicks = (link.clicks || 0) + 1;
  saveDb(db);

  res.json({ originalUrl: link.originalUrl });
});

app.get('/api/links', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.split(' ')[1] || '';
  if (token !== ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  const db = loadDb();
  res.json(db);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
