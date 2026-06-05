const articleService = require('../services/article.service');

class ArticleController {
    async create(req, res, next) {
        try {
            const article = await articleService.create(req.body, req.user._id);
            res.status(201).json(article);
        } catch (err) { next(err); }
    }

    async getAll(req, res, next) {
        try {
            const articles = await articleService.getAll(req.query);
            res.status(200).json(articles);
        } catch (err) { next(err); }
    }

    async getById(req, res, next) {
        try {
            const article = await articleService.getById(req.params.id);
            res.status(200).json(article);
        } catch (err) { next(err); }
    }

    async update(req, res, next) {
        try {
            const article = await articleService.update(req.params.id, req.body);
            res.status(200).json(article);
        } catch (err) { next(err); }
    }

    async delete(req, res, next) {
        try {
            await articleService.delete(req.params.id);
            res.status(200).json({ message: 'Article deleted successfully' });
        } catch (err) { next(err); }
    }
}

module.exports = new ArticleController();
