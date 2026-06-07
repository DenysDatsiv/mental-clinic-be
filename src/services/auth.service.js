const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const teamRepository = require('../repositories/team.repository');
const emailService   = require('./email.service');
const { randomBytes } = crypto;

const makeError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

const signToken = (user) =>
    jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

class AuthService {
    async getUsers() {
        return userRepository.findAll();
    }

    async inviteUser(email, role = 'user') {
        const existing = await userRepository.findByEmail(email);
        if (existing) throw makeError('Email вже використовується', 409);

        const inviteToken = randomBytes(32).toString('hex');
        const tempPassword = randomBytes(16).toString('hex');

        await userRepository.create({
            name:                email.split('@')[0],
            email,
            password:            tempPassword,
            role,
            status:              'pending',
            inviteToken:         crypto.createHash('sha256').update(inviteToken).digest('hex'),
            inviteTokenExpires:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;
        await emailService.sendInviteEmail(email, inviteUrl, role);
    }

    async acceptInvite(token, { name, lastName, phone, password }) {
        const hashed = crypto.createHash('sha256').update(token).digest('hex');
        const user = await userRepository.findOne({
            inviteToken:         hashed,
            inviteTokenExpires:  { $gt: new Date() },
            status:              'pending',
        });
        if (!user) throw makeError('Запрошення недійсне або протерміноване', 400);
        if (!name || !password || password.length < 6) {
            throw makeError('Заповніть обовʼязкові поля (мін. 6 символів для паролю)', 400);
        }

        user.name                = name;
        user.lastName            = lastName || undefined;
        user.phone               = phone    || undefined;
        user.password            = password;
        user.status              = 'active';
        user.inviteToken         = undefined;
        user.inviteTokenExpires  = undefined;
        await user.save();

        // Auto-create team profile for doctors
        if (user.role === 'doctor') {
            const existing = await teamRepository.findByUserId(user._id);
            if (!existing) {
                await teamRepository.create({
                    name:   `${name}${lastName ? ' ' + lastName : ''}`,
                    role:   'Лікар',
                    email:  user.email,
                    phone:  phone || '',
                    userId: user._id,
                });
            } else {
                await teamRepository.update(existing._id, {
                    name:  `${name}${lastName ? ' ' + lastName : ''}`,
                    phone: phone || existing.phone,
                });
            }
        }

        return user.toJSON();
    }

    async updateUserRole(userId, role) {
        const user = await userRepository.findById(userId);
        if (!user) throw makeError('Користувача не знайдено', 404);
        const prevRole = user.role;
        user.role = role;
        await user.save();

        // Auto-create team profile when promoting to doctor
        if (role === 'doctor' && prevRole !== 'doctor') {
            const existing = await teamRepository.findByUserId(userId);
            if (!existing) {
                await teamRepository.create({
                    name:   `${user.name}${user.lastName ? ' ' + user.lastName : ''}`,
                    role:   'Лікар',
                    email:  user.email,
                    phone:  user.phone || '',
                    userId: user._id,
                });
            }
        }
        return user.toJSON();
    }

    // Step 1: validate credentials, generate + email OTP
    async loginStep1(identifier, password) {
        const user = await userRepository.findByEmailOrPhone(identifier);
        if (!user || !(await user.comparePassword(password))) {
            throw makeError('Невірний логін або пароль', 401);
        }
        if (user.status === 'pending') {
            throw makeError('Спочатку прийміть запрошення через посилання у листі', 403);
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
