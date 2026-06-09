const jwt     = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const Session = require('../models/session.model');

const makeError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const authenticate = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return next(makeError('Not authenticated', 401));

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userRepository.findById(payload.id);
        if (!user) return next(makeError('User not found', 401));

        // Validate session
        const tokenHash = Session.hashToken(token);
        const session = await Session.findOne({ tokenHash, revoked: false });
        if (!session) return next(makeError('Сесія недійсна. Увійдіть знову.', 401));

        // Update lastSeen (non-blocking)
        Session.updateOne({ _id: session._id }, { lastSeen: new Date() }).catch(() => {});

        req.user      = user;
        req.tokenHash = tokenHash;
        req.sessionId = session._id.toString();
        next();
    } catch {
        next(makeError('Invalid or expired session', 401));
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') return next(makeError('Admin access required', 403));
    next();
};

module.exports = { authenticate, requireAdmin };
