const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { generateApiKey, hashKey, keyPrefix } = require('../utils/keys');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows: keys } = await pool.query(
    `SELECT id, key_prefix, label, global_limit, global_window, revoked_at, created_at
     FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.userId]
  );

  for (const key of keys) {
    const { rows: links } = await pool.query(
      `SELECT pk.project_id, p.name AS project_name, pk.threshold_limit, pk.threshold_window, pk.status
       FROM project_keys pk JOIN projects p ON p.id = pk.project_id
       WHERE pk.api_key_id = $1`,
      [key.id]
    );
    key.projects = links;
  }

  res.json(keys);
});

router.post('/', async (req, res) => {
  const { label, global_limit, global_window } = req.body;
  const plaintext = generateApiKey();
  const { rows } = await pool.query(
    `INSERT INTO api_keys (user_id, key_hash, key_prefix, label, global_limit, global_window)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, key_prefix, label, created_at`,
    [req.userId, hashKey(plaintext), keyPrefix(plaintext), label || null, global_limit || null, global_window || 'month']
  );

  res.status(201).json({ ...rows[0], plaintext_key: plaintext });
});

router.delete('/:id', async (req, res) => {
  await pool.query('UPDATE api_keys SET revoked_at = now() WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.status(204).send();
});

router.post('/:id/projects', async (req, res) => {
  const { project_id, threshold_limit, threshold_window } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id required' });

  const { rows } = await pool.query(
    `INSERT INTO project_keys (project_id, api_key_id, threshold_limit, threshold_window)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (project_id, api_key_id) DO UPDATE SET threshold_limit = $3, threshold_window = $4
     RETURNING *`,
    [project_id, req.params.id, threshold_limit || 1000, threshold_window || 'day']
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id/projects/:projectId', async (req, res) => {
  const { status } = req.body;
  if (!['active', 'revoked'].includes(status)) return res.status(400).json({ error: 'status must be active or revoked' });

  const { rows } = await pool.query(
    `UPDATE project_keys SET status = $1 WHERE api_key_id = $2 AND project_id = $3 RETURNING *`,
    [status, req.params.id, req.params.projectId]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Link not found' });
  res.json(rows[0]);
});

module.exports = router;