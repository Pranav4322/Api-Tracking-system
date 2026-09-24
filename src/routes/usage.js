const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/keys/:id', async (req, res) => {
  const { rows: totals } = await pool.query(
    `SELECT project_id, COUNT(*) AS request_count,
            COUNT(*) FILTER (WHERE status_code >= 400) AS error_count,
            AVG(latency_ms) AS avg_latency_ms
     FROM usage_events
     WHERE api_key_id = $1 AND occurred_at > now() - interval '30 days'
     GROUP BY project_id`,
    [req.params.id]
  );
  res.json({ api_key_id: req.params.id, by_project: totals });
});

router.get('/projects/:id', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT api_key_id, COUNT(*) AS request_count,
            COUNT(*) FILTER (WHERE status_code >= 400) AS error_count
     FROM usage_events
     WHERE project_id = $1 AND occurred_at > now() - interval '30 days'
     GROUP BY api_key_id`,
    [req.params.id]
  );
  res.json({ project_id: req.params.id, by_key: rows });
});

router.get('/unresolved', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT ue.id, ue.api_key_id, ue.endpoint, ue.occurred_at
     FROM usage_events ue
     JOIN api_keys ak ON ak.id = ue.api_key_id
     WHERE ue.project_id IS NULL AND ak.user_id = $1
     ORDER BY ue.occurred_at DESC LIMIT 100`,
    [req.userId]
  );
  res.json(rows);
});

module.exports = router;