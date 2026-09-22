const crypto = require('crypto');

function generateApiKey() {
  const raw = crypto.randomBytes(24).toString('base64url');
  return `sk_live_${raw}`;
}

function hashKey(plaintext) {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

function keyPrefix(plaintext) {
  return plaintext.slice(0, 12);
}

module.exports = { generateApiKey, hashKey, keyPrefix };