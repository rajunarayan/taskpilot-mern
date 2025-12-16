const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

/**
 * Helper - send validation errors (DRY)
 */
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(e => ({ param: e.param, msg: e.msg })) });
  }
  return null;
};

// GET /api/tasks  -> list tasks for the logged-in user
// Supports: ?completed=true|false  ?page=1&limit=10  ?sort=createdAt:desc
router.get(
  '/',
  auth,
  // optional query validations
  query('completed').optional().isIn(['true', 'false']).withMessage('completed must be true or false'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  async (req, res) => {
    // validation check
    const vErr = handleValidation(req, res);
    if (vErr) return;

    try {
      const owner = req.user._id;

      // filters
      const filter = { owner };
      if (req.query.completed !== undefined) {
        filter.completed = req.query.completed.toLowerCase() === 'true';
      }

      // pagination
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
      const skip = (page - 1) * limit;

      // sorting: e.g. sort=createdAt:desc or sort=title:asc
      let sort = { createdAt: -1 }; // default: newest first
      if (req.query.sort) {
        const [field, dir] = req.query.sort.split(':');
        sort = {};
        sort[field] = dir === 'asc' ? 1 : -1;
      }

      const [tasks, total] = await Promise.all([
        Task.find(filter).sort(sort).skip(skip).limit(limit),
        Task.countDocuments(filter),
      ]);

      res.json({
        tasks,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/tasks -> create a task
router.post(
  '/',
  auth,
  body('title').isString().trim().notEmpty().withMessage('title is required'),
  body('description').optional().isString().withMessage('description must be text'),
  async (req, res) => {
    const vErr = handleValidation(req, res);
    if (vErr) return;

    try {
      const { title, description } = req.body;

      const task = await Task.create({
        title,
        description: description || '',
        owner: req.user._id,
      });

      res.status(201).json({ task });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/tasks/:id -> get single task (owned by user)
router.get(
  '/:id',
  auth,
  param('id').isMongoId().withMessage('invalid task id'),
  async (req, res) => {
    const vErr = handleValidation(req, res);
    if (vErr) return;

    try {
      const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
      if (!task) return res.status(404).json({ message: 'Task not found' });
      res.json({ task });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/tasks/:id -> update task (owned by user)
router.put(
  '/:id',
  auth,
  param('id').isMongoId().withMessage('invalid task id'),
  body('title').optional().isString().trim().notEmpty().withMessage('title must be a non-empty string'),
  body('description').optional().isString().withMessage('description must be text'),
  body('completed').optional().isBoolean().withMessage('completed must be true or false'),
  async (req, res) => {
    const vErr = handleValidation(req, res);
    if (vErr) return;

    try {
      const updates = {};
      const { title, description, completed } = req.body;
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (completed !== undefined) updates.completed = completed;

      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, owner: req.user._id },
        { $set: updates },
        { new: true }
      );

      if (!task) return res.status(404).json({ message: 'Task not found' });
      res.json({ task });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/tasks/:id -> delete task (owned by user)
router.delete(
  '/:id',
  auth,
  param('id').isMongoId().withMessage('invalid task id'),
  async (req, res) => {
    const vErr = handleValidation(req, res);
    if (vErr) return;

    try {
      const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
      if (!task) return res.status(404).json({ message: 'Task not found' });
      res.json({ message: 'Task deleted' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
