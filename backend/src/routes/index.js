const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const taskRoutes = require('./tasks');
const auth = require('../middleware/auth');

router.use('/auth', authRoutes);

// Protected task routes — auth middleware applied here
router.use('/tasks', auth, taskRoutes);

// quick protected 'me' endpoint
router.get('/me', auth, (req, res) => {
  res.json({ me: req.user });
});

router.get('/', (req, res) => {
  res.json({ message: 'Task Manager API — OK' });
});

module.exports = router;
