require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const keyRoutes = require('./routes/keys');
const usageRoutes = require('./routes/usage');
const { apiKeyMiddleware } = require('./middleware/apiKeyMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/keys', keyRoutes);
app.use('/usage', usageRoutes);

app.get('/v1/example', apiKeyMiddleware, (req, res) => {
  res.json({ message: 'Request allowed', apiKeyId: req.apiKeyId, projectId: req.resolvedProjectId });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API key monitor running on port ${port}`));