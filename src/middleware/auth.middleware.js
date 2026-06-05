const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

const makeError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const authenticate = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(makeError('No token provided', 401));

    try {
        const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
        const user = await userRepository.findById(payload.id);
        if (!user) return next(makeError('User not found', 401));
        req.user = user;
        next();
    } catch {
        next(makeError('Invalid or expired token', 401));
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') return next(makeError('Admin access required', 403));
    next();
};

module.exports = { authenticate, requireAdmin };
