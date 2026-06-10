const Article = require('../models/article.model');

const LIST_FIELDS = '_id title excerpt categories tags status coverImage author publishedAt createdAt views isFeatured readTime slug';

// Detect MongoDB ObjectId (24 hex chars)
const isObjectId = id => /^[a-f\d]{24}$/i.test(id);

class ArticleRepository {
    create(data) {
        return new Article(data).save();
    }

    async findAll(filter, { page, limit, sort } = {}) {
        const q = Article.find(filter)
            .select(LIST_FIELDS)
            .populate('author', 'name')
            .sort(sort || { publishedAt: -1, createdAt: -1 });

        if (page && limit) {
            const skip  = (page - 1) * limit;
            const total = await Article.countDocuments(filter);
            const articles = await q.skip(skip).limit(limit);
            return { articles, total, page, pages: Math.ceil(total / limit) };
        }

        return q;
    }

    /** Lookup by MongoDB _id OR slug (for public-facing routes) */
    findByIdOrSlug(idOrSlug) {
        const query = isObjectId(idOrSlug)
            ? { _id: idOrSlug }
            : { slug: idOrSlug };
        return Article.findOne(query)
            .populate('author', 'name')
            .populate('relatedTests', 'name description duration type');
    }

    /** Internal lookup by _id only (used by admin / related queries) */
    findById(id) {
        return Article.findById(id)
            .populate('author', 'name')
            .populate('relatedTests', 'name description duration type');
    }

    incrementViews(id) {
        return Article.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: false });
    }

    findRelated(id, categories, limit = 3) {
        return Article.find({
            _id:        { $ne: id },
            status:     'published',
            categories: { $in: categories },
        })
            .select(LIST_FIELDS)
            .populate('author', 'name')
            .sort({ publishedAt: -1 })
            .limit(limit);
    }

    updateById(id, data) {
        return Article.findByIdAndUpdate(id, data, { new: true });
    }

    deleteById(id) {
        return Article.findByIdAndDelete(id);
    }
}

module.exports = new ArticleRepository();
