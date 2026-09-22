const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [req.userId]);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  const { rows } = await pool.query(
    'INSERT INTO projects (user_id, name) VALUES ($1, $2) RETURNING *',
    [req.userId, name]
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
  res.status(204).send();
});

module.exports = router;