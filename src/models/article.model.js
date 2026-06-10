const mongoose = require('mongoose');

// ── Ukrainian → Latin slug ────────────────────────────────────────────────────
const UK_MAP = {
    'а':'a',  'б':'b',  'в':'v',  'г':'h',  'ґ':'g',
    'д':'d',  'е':'e',  'є':'ye', 'ж':'zh', 'з':'z',
    'и':'y',  'і':'i',  'ї':'yi', 'й':'y',  'к':'k',
    'л':'l',  'м':'m',  'н':'n',  'о':'o',  'п':'p',
    'р':'r',  'с':'s',  'т':'t',  'у':'u',  'ф':'f',
    'х':'kh', 'ц':'ts', 'ч':'ch', 'ш':'sh', 'щ':'shch',
    'ь':'',   'ю':'yu', 'я':'ya',
    "'": '', '’': '', 'ʼ': '',
};

function ukrainianToSlug(text) {
    return text
        .toLowerCase()
        .split('')
        .map(c => (c in UK_MAP ? UK_MAP[c] : c))
        .join('')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120);
}

// ── Schema ────────────────────────────────────────────────────────────────────

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
        slug:       { type: String, unique: true, sparse: true, index: true },
        views:      { type: Number, default: 0 },
        isFeatured: { type: Boolean, default: false },
        readTime:   { type: Number },
    },
    { timestamps: true }
);

// ── Pre-save hooks ────────────────────────────────────────────────────────────

articleSchema.pre('save', function () {
    if (this.isModified('title') || !this.slug) {
        this.slug = ukrainianToSlug(this.title);
    }

    if (this.isModified('content') || !this.readTime) {
        const words = (this.content || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
        this.readTime = Math.max(1, Math.ceil(words / 200));
    }

    if (this.status === 'published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
});

// Export helper so migration scripts can reuse it
const Article = mongoose.model('Article', articleSchema);
module.exports = Article;
module.exports.ukrainianToSlug = ukrainianToSlug;
