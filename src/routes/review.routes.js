const { Router } = require('express');
const reviewController = require('../controllers/review.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

// Public
router.get('/public', (req, res, next) => reviewController.getPublic(req, res, next));
router.post('/',      (req, res, next) => reviewController.create(req, res, next)); // anyone can submit

// Admin
router.get('/',       authenticate, requireAdmin, (req, res, next) => reviewController.getAll(req, res, next));
router.put('/:id',    authenticate, requireAdmin, (req, res, next) => reviewController.update(req, res, next));
router.delete('/:id', authenticate, requireAdmin, (req, res, next) => reviewController.remove(req, res, next));

module.exports = router;
