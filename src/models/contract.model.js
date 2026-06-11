const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  { content: { type: String, default: '' } },
  { timestamps: true }
);

module.exports = mongoose.model('Contract', contractSchema);
