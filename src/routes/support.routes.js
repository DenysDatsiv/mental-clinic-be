const { Router } = require('express');
const supportController = require('../controllers/support.controller');

const router = Router();
router.post('/message', (req, res, next) => supportController.send(req, res, next));

module.exports = router;
