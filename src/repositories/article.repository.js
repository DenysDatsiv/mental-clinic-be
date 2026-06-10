const Article = require('../models/article.model');

const LIST_FIELDS = '_id title excerpt categories tags status coverImage author publishedAt createdAt views isFeatured readTime';

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

    findById(id) {
        return Article.findById(id).populate('author', 'name');
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
