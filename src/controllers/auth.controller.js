const authService = require('../services/auth.service');

const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
};

class AuthController {
    async loginStep1(req, res, next) {
        try {
            const { identifier, password } = req.body;
            const result = await authService.loginStep1(identifier, password);
            res.status(200).json(result);
        } catch (err) { next(err); }
    }

    async verifyOtp(req, res, next) {
        try {
            const { userId, otp } = req.body;
            const { token, user } = await authService.verifyOtp(userId, otp);
            res.cookie('token', token, COOKIE_OPTIONS);
            res.status(200).json({ user });
        } catch (err) { next(err); }
    }

    async forgotPassword(req, res, next) {
        try {
            await authService.forgotPassword(req.body.identifier);
            res.status(200).json({ message: 'Якщо акаунт існує, посилання надіслано' });
        } catch (err) { next(err); }
    }

    async resetPassword(req, res, next) {
        try {
            await authService.resetPassword(req.body.token, req.body.newPassword);
            res.status(200).json({ message: 'Пароль успішно змінено' });
        } catch (err) { next(err); }
    }

    logout(req, res) {
        res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: 0 });
        res.status(200).json({ message: 'Logged out' });
    }

    async me(req, res, next) {
        try {
            res.status(200).json(req.user);
        } catch (err) { next(err); }
    }

    async getUsers(req, res, next) {
        try {
            const users = await authService.getUsers();
            res.status(200).json(users);
        } catch (err) { next(err); }
    }

    async inviteUser(req, res, next) {
        try {
            await authService.inviteUser(req.body.email, req.body.role);
            res.status(200).json({ message: 'Запрошення надіслано' });
        } catch (err) { next(err); }
    }

    async acceptInvite(req, res, next) {
        try {
            const user = await authService.acceptInvite(req.body.token, req.body);
            res.status(200).json(user);
        } catch (err) { next(err); }
    }

    async updateUserRole(req, res, next) {
        try {
            const user = await authService.updateUserRole(req.params.id, req.body.role);
            res.status(200).json(user);
        } catch (err) { next(err); }
    }

    async createUser(req, res, next) {
        try {
            const user = await authService.createUser(req.body);
            res.status(201).json(user);
        } catch (err) { next(err); }
    }

    async changePassword(req, res, next) {
        try {
            const user = await authService.changePassword(req.user._id, req.body);
            res.status(200).json(user);
        } catch (err) { next(err); }
    }

    async registerFirstAdmin(req, res, next) {
        try {
            const user = await authService.registerFirstAdmin(req.body);
            res.status(201).json(user);
        } catch (err) { next(err); }
    }
}

module.exports = new AuthController();
