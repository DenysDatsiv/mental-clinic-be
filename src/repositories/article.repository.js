const Article = require('../models/article.model');

const LIST_FIELDS = '_id title excerpt categories tags status coverImage author publishedAt createdAt';

class ArticleRepository {
    create(data)           { return new Article(data).save(); }

    findAll(filter)        { return Article.find(filter).select(LIST_FIELDS).populate('author', 'name'); }

    findById(id)           { return Article.findById(id).populate('author', 'name'); }

    updateById(id, data)   { return Article.findByIdAndUpdate(id, data, { new: true }); }

    deleteById(id)         { return Article.findByIdAndDelete(id); }
}

module.exports = new ArticleRepository();
