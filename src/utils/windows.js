function windowBucket(windowType) {
  const now = new Date();
  switch (windowType) {
    case 'hour':
      return {
        bucket: `${now.getUTCFullYear()}${now.getUTCMonth()}${now.getUTCDate()}${now.getUTCHours()}`,
        ttlSeconds: 3660,
      };
    case 'month':
      return {
        bucket: `${now.getUTCFullYear()}${now.getUTCMonth()}`,
        ttlSeconds: 2678400,
      };
    case 'day':
    default:
      return {
        bucket: `${now.getUTCFullYear()}${now.getUTCMonth()}${now.getUTCDate()}`,
        ttlSeconds: 86460,
      };
  }
}

module.exports = { windowBucket };