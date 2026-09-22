const pool = require('../config/db');
const redis = require('../config/redis');
const { hashKey } = require('../utils/keys');
const { windowBucket } = require('../utils/windows');

async function apiKeyMiddleware(req, res, next) {
  const plaintextKey = req.headers['x-api-key'];
  const projectId = req.headers['x-project-id'];

  if (!plaintextKey) return res.status(401).json({ error: 'Missing X-API-Key header' });
  if (!projectId) return res.status(400).json({ error: 'Missing X-Project-Id header' });

  const keyHash = hashKey(plaintextKey);

  let keyInfo = await redis.get(`keyinfo:${keyHash}`);
  if (keyInfo) {
    keyInfo = JSON.parse(keyInfo);
  } else {
    const { rows } = await pool.query(
      `SELECT id, revoked_at, global_limit, global_window FROM api_keys WHERE key_hash = $1`,
      [keyHash]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid API key' });
    keyInfo = rows[0];
    await redis.set(`keyinfo:${keyHash}`, JSON.stringify(keyInfo), 'EX', 60);
  }

  if (keyInfo.revoked_at) return res.status(401).json({ error: 'This key has been revoked' });

  const { rows: linkRows } = await pool.query(
    `SELECT status, threshold_limit, threshold_window FROM project_keys
     WHERE api_key_id = $1 AND project_id = $2`,
    [keyInfo.id, projectId]
  );
  if (linkRows.length === 0) return res.status(403).json({ error: 'This key is not linked to this project' });

  const link = linkRows[0];
  if (link.status === 'revoked') return res.status(403).json({ error: 'This key has been disabled for this project' });

  const { bucket, ttlSeconds } =