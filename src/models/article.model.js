const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
    {
        title:      { type: String, required: true },
        content:    { type: String, required: true },
        excerpt:    { type: String },
        categories: [{ type: String }],
        tags:       [{ type: String }],
        status:     { type: String, enum: ['draft', 'published'], default: 'draft' },
        coverImage: { type: String },
        author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        publishedAt:{ type: Date },
    },
    { timestamps: true }
);

articleSchema.pre('save', function () {
    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
});

module.exports = mongoose.model('Article', articleSchema);
