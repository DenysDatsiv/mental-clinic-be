const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    content: { type: String, default: '' },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contract', contractSchema);
