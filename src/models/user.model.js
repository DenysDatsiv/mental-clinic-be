const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name:              { type: String, required: true },
        email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone:             { type: String, sparse: true, unique: true, trim: true },
        password:          { type: String, required: true },
        role:              { type: String, enum: ['admin', 'user'], default: 'user' },
        otpCode:           { type: String },
        otpExpires:        { type: Date },
        resetToken:        { type: String },
        resetTokenExpires: { type: Date },
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
        delete obj.resetToken;
        delete obj.resetTokenExpires;
        return obj;
    },
});

module.exports = mongoose.model('User', userSchema);
