const { Schema, model } = require('mongoose');

const teamSchema = new Schema({
    name:             { type: String, required: true },
    role:             { type: String, required: true },
    bio:              { type: String, default: '' },
    specializations:  [String],
    photo:            { type: String, default: '' },
    email:            { type: String, default: '' },
    phone:            { type: String, default: '' },
    experience:       { type: String, default: '' },
    education:        [String],
    isActive:         { type: Boolean, default: true },
    order:            { type: Number, default: 0 },
}, { timestamps: true });

module.exports = model('Team', teamSchema);
