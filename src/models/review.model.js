const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    name:    { type: String, required: true, trim: true },
    role:    { type: String, default: 'Пацієнт', trim: true },
    text:    { type: String, required: true, trim: true },
    rating:  { type: Number, min: 1, max: 5, default: 5 },
    photo:   { type: String, default: '' },
    status:  { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    order:   { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
