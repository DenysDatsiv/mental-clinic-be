const authService = require('../services/auth.service');

const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};

class AuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const { token, user } = await authService.login(email, password);
            res.cookie('token', token, COOKIE_OPTIONS);
            res.status(200).json({ user });
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

    async createUser(req, res, next) {
        try {
            const user = await authService.createUser(req.body);
            res.status(201).json(user);
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
