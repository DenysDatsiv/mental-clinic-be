const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = Router();

router.post('/setup',           (req, res, next) => authController.registerFirstAdmin(req, res, next));
router.post('/login',           (req, res, next) => authController.loginStep1(req, res, next));
router.post('/verify-otp',      (req, res, next) => authController.verifyOtp(req, res, next));
router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req, res, next));
router.post('/reset-password',  (req, res, next) => authController.resetPassword(req, res, next));
router.post('/logout',          (req, res)       => authController.logout(req, res));
router.get ('/me',              authenticate,    (req, res, next) => authController.me(req, res, next));
router.post('/change-password', authenticate,    (req, res, next) => authController.changePassword(req, res, next));
router.get ('/users',           authenticate, requireAdmin, (req, res, next) => authController.getUsers(req, res, next));
router.post('/users/invite',    authenticate, requireAdmin, (req, res, next) => authController.inviteUser(req, res, next));
router.post('/users/accept',    (req, res, next) => authController.acceptInvite(req, res, next));
router.patch('/users/:id/role', authenticate, requireAdmin, (req, res, next) => authController.updateUserRole(req, res, next));

module.exports = router;
