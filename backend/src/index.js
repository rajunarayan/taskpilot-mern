// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// base API routes
app.use('/api', routes);

// simple health check
app.get('/health', (req, res) => res.send('OK'));

// start server after DB connects
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    // connectDB already logs and exits on failure, but keep this here for safety
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
