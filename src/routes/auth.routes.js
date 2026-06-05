const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

// First-time setup — locked after first user exists
router.post('/setup',  (req, res, next) => authController.registerFirstAdmin(req, res, next));

// Login → sets HttpOnly cookie
router.post('/login',  (req, res, next) => authController.login(req, res, next));

// Logout → clears cookie
router.post('/logout', (req, res)       => authController.logout(req, res));

// Returns current user from cookie (used on page refresh)
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));

// Change own password
router.post('/change-password', authenticate, (req, res, next) => authController.changePassword(req, res, next));

// Admin creates users
router.post('/users', authenticate, requireAdmin, (req, res, next) => authController.createUser(req, res, next));

module.exports = router;
