const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const emailService   = require('./email.service');

const makeError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const signToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

class AuthService {
    // Step 1: validate credentials, generate + email OTP
    async loginStep1(identifier, password) {
        const user = await userRepository.findByEmailOrPhone(identifier);
        if (!user || !(await user.comparePassword(password))) {
            throw makeError('Невірний логін або пароль', 401);
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode    = await bcrypt.hash(otp, 6);
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        await user.save();

        await emailService.sendOtpEmail(user.email, otp);

        // Mask email for display: a***@domain.com
        const [localPart, domain] = user.email.split('@');
        const masked = localPart[0] + '***@' + domain;

        return { userId: user._id.toString(), sentTo: masked };
    }

    // Step 2: verify OTP → issue JWT cookie
    async verifyOtp(userId, otp) {
        const user = await userRepository.findById(userId);
        if (!user || !user.otpCode || !user.otpExpires) {
            throw makeError('Невірний запит', 400);
        }
        if (user.otpExpires < new Date()) {
            throw makeError('Код протермінований. Увійдіть знову.', 400);
        }
        const valid = await bcrypt.compare(otp, user.otpCode);
        if (!valid) throw makeError('Невірний код', 400);

        user.otpCode    = undefined;
        user.otpExpires = undefined;
        await user.save();

        return { token: signToken(user), user: user.toJSON() };
    }

    // Send forgot-password reset link
    async forgotPassword(identifier) {
        const user = await userRepository.findByEmailOrPhone(identifier);
        if (!user) return; // silent — don't reveal existence

        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken        = crypto.createHash('sha256').update(token).digest('hex');
        user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        await emailService.sendResetEmail(user.email, resetUrl);
    }

    // Reset password via token from email link
    async resetPassword(token, newPassword) {
        const hashed = crypto.createHash('sha256').update(token).digest('hex');
        const user = await userRepository.findOne({
            resetToken:        hashed,
            resetTokenExpires: { $gt: new Date() },
        });
        if (!user) throw makeError('Посилання недійсне або протерміноване', 400);
        if (!newPassword || newPassword.length < 6) {
            throw makeError('Пароль має містити мінімум 6 символів', 400);
        }

        user.password          = newPassword;
        user.resetToken        = undefined;
        user.resetTokenExpires = undefined;
        await user.save();

        return user.toJSON();
    }

    async createUser({ name, email, phone, password, role = 'user' }) {
        const existing = await userRepository.findByEmail(email);
        if (existing) throw makeError('Email already in use', 409);
        return userRepository.create({ name, email, phone, password, role });
    }

    async changePassword(userId, { currentPassword, newPassword }) {
        const user = await userRepository.findById(userId);
        if (!user) throw makeError('User not found', 404);
        const valid = await user.comparePassword(currentPassword);
        if (!valid) throw makeError('Поточний пароль невірний', 400);
        if (!newPassword || newPassword.length < 6) {
            throw makeError('Новий пароль має містити мінімум 6 символів', 400);
        }
        user.password = newPassword;
        await user.save();
        return user.toJSON();
    }

    async registerFirstAdmin({ name, email, password }) {
        const total = await userRepository.count();
        if (total > 0) throw makeError('Registration is closed — use admin panel', 403);
        return userRepository.create({ name, email, password, role: 'admin' });
    }
}

module.exports = new AuthService();
