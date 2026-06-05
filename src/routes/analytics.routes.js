const { Router } = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', authenticate, requireAdmin, (req, res, next) =>
    analyticsController.getAll(req, res, next)
);

module.exports = router;
