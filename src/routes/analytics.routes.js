const { Router } = require('express');
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', authenticate, (req, res, next) =>
    analyticsController.getAll(req, res, next)
);

module.exports = router;
