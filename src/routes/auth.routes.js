const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

// First-time setup — open only when no users exist
router.post('/setup', (req, res, next) => authController.registerFirstAdmin(req, res, next));

// Login
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Admin creates users
router.post('/users', authenticate, requireAdmin, (req, res, next) => authController.createUser(req, res, next));

module.exports = router;
