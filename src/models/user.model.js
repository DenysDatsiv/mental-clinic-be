const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name:                 { type: String, required: true },
        lastName:             { type: String },
        email:                { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone:                { type: String, sparse: true, unique: true, trim: true },
        password:             { type: String, required: true },
        role:                 { type: String, enum: ['admin', 'user', 'doctor'], default: 'user' },
        status:               { type: String, enum: ['pending', 'active'], default: 'active' },
        inviteToken:          { type: String },
        inviteTokenExpires:   { type: Date },
        otpCode:              { type: String },
        otpExpires:           { type: Date },
        otpSentAt:            { type: Date },
        resetToken:           { type: String },
        resetTokenExpires:    { type: Date },
        contactOtpCode:       { type: String },
        contactOtpExpires:    { type: Date },
        contactOtpSentAt:     { type: Date },
        contactPendingType:   { type: String },
        contactPendingValue:  { type: String },
    },
    { timestamps: true }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.password);
};

userSchema.set('toJSON', {
    transform: (_, obj) => {
        delete obj.password;
        delete obj.otpCode;
        delete obj.otpExpires;
        delete obj.otpSentAt;
        delete obj.resetToken;
        delete obj.resetTokenExpires;
        delete obj.inviteToken;
        delete obj.inviteTokenExpires;
        delete obj.contactOtpCode;
        delete obj.contactOtpExpires;
        delete obj.contactOtpSentAt;
        delete obj.contactPendingType;
        delete obj.contactPendingValue;
        return obj;
    },
});

module.exports = mongoose.model('User', userSchema);
