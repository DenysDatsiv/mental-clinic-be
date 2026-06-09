const { Router } = require('express');
const teamController = require('../controllers/team.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

// Public
router.get('/',     (req, res, next) => teamController.getAll(req, res, next));
router.get('/:id',  (req, res, next) => teamController.getById(req, res, next));

// Doctor self-profile (any authenticated doctor)
router.get ('/me/profile', authenticate, (req, res, next) => teamController.getMyProfile(req, res, next));
router.patch('/me/profile', authenticate, (req, res, next) => teamController.updateMyProfile(req, res, next));

// Admin only
router.post('/',      authenticate, requireAdmin, (req, res, next) => teamController.create(req, res, next));
router.put('/:id',    authenticate, requireAdmin, (req, res, next) => teamController.update(req, res, next));
router.patch('/:id',  authenticate, requireAdmin, (req, res, next) => teamController.update(req, res, next));
router.delete('/:id', authenticate, requireAdmin, (req, res, next) => teamController.remove(req, res, next));

module.exports = router;
