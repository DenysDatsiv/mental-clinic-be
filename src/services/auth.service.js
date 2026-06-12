const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const teamRepository = require('../repositories/team.repository');
const emailService   = require('./email.service');
const Session        = require('../models/session.model');
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

    async inviteUser(email, role = 'user', redirectUrl, deliveryEmail) {
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

        const base = redirectUrl || process.env.FRONTEND_URL;
        const inviteUrl = `${base}/accept-invite?token=${inviteToken}`;
        await emailService.sendInviteEmail(deliveryEmail || email, inviteUrl, role);
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

    // Step 1: validate credentials; if 2FA disabled → issue token directly
    async loginStep1(identifier, password, userAgent, ip) {
        const user = await userRepository.findByEmailOrPhone(identifier);
        if (!user || !(await user.comparePassword(password))) {
            throw makeError('Невірний логін або пароль', 401);
        }
        if (user.status === 'pending') {
            throw makeError('Спочатку прийміть запрошення через посилання у листі', 403);
        }
        if (user.status === 'inactive') {
            throw makeError('Акаунт деактивовано. Зверніться до адміністратора.', 403);
        }

        if (user.twoFactorEnabled === false) {
            const token = signToken(user);
            await Session.create({ userId: user._id, tokenHash: Session.hashToken(token), userAgent, ip });
            return { token, user: user.toJSON() };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode    = await bcrypt.hash(otp, 6);
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otpSentAt  = new Date();
        await user.save();

        await emailService.sendOtpEmail(user.email, otp);

        const [localPart, domain] = user.email.split('@');
        const masked = localPart[0] + '***@' + domain;
        return { userId: user._id.toString(), sentTo: masked };
    }

    // Step 2: verify OTP → issue JWT + create session
    async verifyOtp(userId, otp, userAgent, ip) {
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

        const token = signToken(user);
        await Session.create({ userId: user._id, tokenHash: Session.hashToken(token), userAgent, ip });
        return { token, user: user.toJSON() };
    }

    // Resend OTP (max once per 60 seconds)
    async resendOtp(userId) {
        const user = await userRepository.findById(userId);
        if (!user || !user.otpSentAt) {
            throw makeError('Невірний запит', 400);
        }

        const secondsSinceLastSend = (Date.now() - user.otpSentAt.getTime()) / 1000;
        if (secondsSinceLastSend < 60) {
            const wait = Math.ceil(60 - secondsSinceLastSend);
            throw makeError(`Зачекайте ${wait} сек. перед повторним надсиланням`, 429);
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode    = await bcrypt.hash(otp, 6);
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otpSentAt  = new Date();
        await user.save();

        await emailService.sendOtpEmail(user.email, otp);

        const [localPart, domain] = user.email.split('@');
        const masked = localPart[0] + '***@' + domain;
        return { userId: user._id.toString(), sentTo: masked };
    }

    // Revoke single session by raw JWT token (used on logout)
    async revokeSessionByToken(token) {
        const hash = Session.hashToken(token);
        await Session.updateOne({ tokenHash: hash }, { revoked: true });
    }

    // List active sessions for a user
    async getSessions(userId) {
        return Session.find({ userId, revoked: false }).sort({ lastSeen: -1 }).lean();
    }

    // Revoke a single session by session _id (must belong to user)
    async revokeSession(userId, sessionId) {
        const session = await Session.findOne({ _id: sessionId, userId });
        if (!session) throw makeError('Сесія не знайдена', 404);
        session.revoked = true;
        await session.save();
    }

    // Revoke all sessions except the current one
    async revokeAllSessions(userId, currentTokenHash) {
        await Session.updateMany(
            { userId, revoked: false, tokenHash: { $ne: currentTokenHash } },
            { revoked: true }
        );
    }

    // Toggle 2FA on/off
    async toggle2FA(userId, enabled) {
        const user = await userRepository.findById(userId);
        if (!user) throw makeError('Не знайдено', 404);
        user.twoFactorEnabled = enabled;
        await user.save();
        return user.toJSON();
    }

    // Request email or phone change — sends OTP to current email
    async requestContactChange(userId, type, value) {
        const user = await userRepository.findById(userId);
        if (!user) throw makeError('Не знайдено', 404);

        const normalised = value.trim().toLowerCase();

        // Uniqueness check
        const taken = await userRepository.findByEmailOrPhone(normalised);
        if (taken && taken._id.toString() !== userId) {
            const label = type === 'email' ? 'Email' : 'Телефон';
            throw makeError(`${label} вже використовується`, 409);
        }

        // 60-second cooldown
        if (user.contactOtpSentAt) {
            const elapsed = (Date.now() - user.contactOtpSentAt.getTime()) / 1000;
            if (elapsed < 60) {
                const wait = Math.ceil(60 - elapsed);
                throw makeError(`Зачекайте ${wait} сек. перед повторним надсиланням`, 429);
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.contactOtpCode      = await bcrypt.hash(otp, 6);
        user.contactOtpExpires   = new Date(Date.now() + 10 * 60 * 1000);
        user.contactOtpSentAt    = new Date();
        user.contactPendingType  = type;
        user.contactPendingValue = normalised;
        await user.save();

        await emailService.sendOtpEmail(user.email, otp);
        const [local, domain] = user.email.split('@');
        return { sentTo: local[0] + '***@' + domain };
    }

    // Confirm contact change with OTP
    async confirmContactChange(userId, otp) {
        const user = await userRepository.findById(userId);
        if (!user || !user.contactOtpCode || !user.contactOtpExpires) {
            throw makeError('Невірний запит', 400);
        }
        if (user.contactOtpExpires < new Date()) {
            throw makeError('Код протермінований. Надішліть новий.', 400);
        }
        const valid = await bcrypt.compare(otp, user.contactOtpCode);
        if (!valid) throw makeError('Невірний код', 400);

        const { contactPendingType: type, contactPendingValue: value } = user;
        if (type === 'email') user.email = value;
        else if (type === 'phone') user.phone = value;

        user.contactOtpCode      = undefined;
        user.contactOtpExpires   = undefined;
        user.contactOtpSentAt    = undefined;
        user.contactPendingType  = undefined;
        user.contactPendingValue = undefined;
        await user.save();

        return user.toJSON();
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

    async updateUserStatus(userId, status) {
        const user = await userRepository.findById(userId);
        if (!user) throw makeError('Користувача не знайдено', 404);
        user.status = status;
        await user.save();
        if (status === 'inactive') {
            await Session.updateMany({ userId: user._id }, { revoked: true });
        }
        return user.toJSON();
    }

    async deleteUser(userId, requestingUserId) {
        if (userId === requestingUserId) throw makeError('Не можна видалити власний акаунт', 400);
        const user = await userRepository.findById(userId);
        if (!user) throw makeError('Користувача не знайдено', 404);
        await Session.deleteMany({ userId: user._id });
        await userRepository.deleteById(userId);
    }

    async registerFirstAdmin({ name, email, password }) {
        const total = await userRepository.count();
        if (total > 0) throw makeError('Registration is closed — use admin panel', 403);
        return userRepository.create({ name, email, password, role: 'admin' });
    }
}

module.exports = new AuthService();
