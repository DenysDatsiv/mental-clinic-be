const authService = require('../services/auth.service');

class AuthController {
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.status(200).json(result);
        } catch (err) { next(err); }
    }

    // Admin creates a new user
    async createUser(req, res, next) {
        try {
            const user = await authService.createUser(req.body);
            res.status(201).json(user);
        } catch (err) { next(err); }
    }

    // Open only when DB has zero users — creates the first admin
    async registerFirstAdmin(req, res, next) {
        try {
            const user = await authService.registerFirstAdmin(req.body);
            res.status(201).json(user);
        } catch (err) { next(err); }
    }
}

module.exports = new AuthController();
