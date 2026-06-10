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
        // ── New fields ────────────────────────────────────────────────────────
        views:      { type: Number, default: 0 },
        isFeatured: { type: Boolean, default: false },
        readTime:   { type: Number },   // minutes, computed on save
    },
    { timestamps: true }
);

// Compute readTime from content (avg 200 words/min reading speed)
articleSchema.pre('save', function () {
    if (this.isModified('content') || !this.readTime) {
        const words = (this.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
        this.readTime = Math.max(1, Math.ceil(words / 200));
    }
    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
});

module.exports = mongoose.model('Article', articleSchema);
