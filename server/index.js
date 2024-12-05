const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Proxy middleware for ArrayExpress
app.use('/api/arrayexpress', async (req, res) => {
  try {
    const url = `https://www.ebi.ac.uk/arrayexpress/json${req.path}`;
    const response = await axios.get(url, {
      params: req.query,
      timeout: 30000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch data from ArrayExpress',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message
  });
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});
