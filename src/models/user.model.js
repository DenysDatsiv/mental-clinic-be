const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name:     { type: String, required: true },
        email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        role:     { type: String, enum: ['admin', 'user'], default: 'user' },
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
    transform: (_, obj) => { delete obj.password; return obj; },
});

module.exports = mongoose.model('User', userSchema);
