const mongoose = require('mongoose');
const crypto   = require('crypto');

const sessionSchema = new mongoose.Schema(
    {
        userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        tokenHash: { type: String, required: true, unique: true },
        userAgent: { type: String },
        ip:        { type: String },
        lastSeen:  { type: Date, default: Date.now },
        revoked:   { type: Boolean, default: false },
    },
    { timestamps: true }
);

sessionSchema.statics.hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');

module.exports = mongoose.model('Session', sessionSchema);
