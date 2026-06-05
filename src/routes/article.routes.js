const { Router } = require('express');
const articleController = require('../controllers/article.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

// Public
router.get('/',    (req, res, next) => articleController.getAll(req, res, next));
router.get('/:id', (req, res, next) => articleController.getById(req, res, next));

// Admin only
router.post('/',     authenticate, requireAdmin, (req, res, next) => articleController.create(req, res, next));
router.put('/:id',   authenticate, requireAdmin, (req, res, next) => articleController.update(req, res, next));
router.delete('/:id',authenticate, requireAdmin, (req, res, next) => articleController.delete(req, res, next));

module.exports = router;
