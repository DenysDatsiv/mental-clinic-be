const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

const makeError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const signToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

class AuthService {
    async login(email, password) {
        const user = await userRepository.findByEmail(email);
        if (!user || !(await user.comparePassword(password))) {
            throw makeError('Invalid email or password', 401);
        }
        return { token: signToken(user), user };
    }

    async createUser({ name, email, password, role = 'user' }) {
        const existing = await userRepository.findByEmail(email);
        if (existing) throw makeError('Email already in use', 409);
        return userRepository.create({ name, email, password, role });
    }

    // Only open when no users exist yet — first-time admin setup
    async registerFirstAdmin({ name, email, password }) {
        const total = await userRepository.count();
        if (total > 0) throw makeError('Registration is closed — use admin panel', 403);
        return userRepository.create({ name, email, password, role: 'admin' });
    }
}

module.exports = new AuthService();
