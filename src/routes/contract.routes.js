const { Router } = require('express');
const contractController = require('../controllers/contract.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', (req, res, next) => contractController.get(req, res, next));
router.put('/', authenticate, requireAdmin, (req, res, next) => contractController.update(req, res, next));

module.exports = router;
