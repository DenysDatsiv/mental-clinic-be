const { Router } = require('express');
const testController = require('../controllers/test.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

// Public
router.get('/',    (req, res, next) => testController.getAll(req, res, next));
router.get('/:id', (req, res, next) => testController.getById(req, res, next));

// Admin only
router.post('/',     authenticate, requireAdmin, (req, res, next) => testController.create(req, res, next));
router.put('/:id',   authenticate, requireAdmin, (req, res, next) => testController.update(req, res, next));
router.delete('/:id',authenticate, requireAdmin, (req, res, next) => testController.delete(req, res, next));

module.exports = router;
