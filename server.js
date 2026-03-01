require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Database ────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log('✅  Connected to Neon PostgreSQL'))
  .catch(err => { console.error('❌  DB connection failed:', err.message); process.exit(1); });

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/login
 * Validates admin credentials from .env
 */
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: 'Missing credentials.' });

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    return res.json({ success: true, message: 'Login successful.', token: process.env.ADMIN_TOKEN });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials.' });
});

/**
 * POST /api/register
 * Inserts a new team registration into PostgreSQL
 */
app.post('/api/register', async (req, res) => {
  const {
    teamName, collegeName, deptName,
    m1name, m1phone, m1email,
    m2name, m2phone, m2email,
    demoLink
  } = req.body;

  // Basic validation
  const required = { teamName, collegeName, deptName, m1name, m1phone, m1email, m2name, m2phone, m2email, demoLink };
  const missing = Object.keys(required).filter(k => !required[k]?.trim());
  if (missing.length)
    return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(', ')}` });

  try {
    const result = await pool.query(
      `INSERT INTO registrations
         (team_name, college_name, dept_name,
          m1_name, m1_phone, m1_email,
          m2_name, m2_phone, m2_email,
          demo_link)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, created_at`,
      [
        teamName.trim(), collegeName.trim(), deptName.trim(),
        m1name.trim(), m1phone.trim(), m1email.trim(),
        m2name.trim(), m2phone.trim(), m2email.trim(),
        demoLink.trim()
      ]
    );
    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

/**
 * GET /api/registrations
 * Returns all registrations (admin only — protected by session token in header)
 */
app.get('/api/registrations', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, team_name, college_name, dept_name,
              m1_name, m1_phone, m1_email,
              m2_name, m2_phone, m2_email,
              demo_link,
              TO_CHAR(created_at, 'DD Mon YYYY, HH12:MI AM') AS timestamp
       FROM registrations
       ORDER BY id DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Fetch error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/**
 * DELETE /api/registrations
 * Deletes all registrations (admin only)
 */
app.delete('/api/registrations', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM registrations');
    return res.json({ success: true, message: 'All registrations cleared.' });
  } catch (err) {
    console.error('Delete error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Admin middleware ─────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  // Simple token check: client sends "Bearer vizora_admin_token" after login
  const auth = req.headers.authorization;
  if (auth === `Bearer ${process.env.ADMIN_TOKEN}`) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized.' });
}

// ─── Catch-all → serve frontend ───────────────────────────────────────────────
// app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`🚀  VIZORA server running on http://localhost:${PORT}`));
