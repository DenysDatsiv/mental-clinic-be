const articleRepository = require('../repositories/article.repository');

const notFound = () => Object.assign(new Error('Article not found'), { statusCode: 404 });

const buildFilter = ({ status, category, tag, search } = {}) => {
    const filter = {};
    if (status)   filter.status = status;
    if (category) filter.categories = category;
    if (tag)      filter.tags = tag;
    if (search)   filter.$or = [
        { title:   { $regex: new RegExp(search, 'i') } },
        { excerpt: { $regex: new RegExp(search, 'i') } },
    ];
    return filter;
};

class ArticleService {
    create(data, authorId) {
        return articleRepository.create({ ...data, author: authorId });
    }

    getAll(query) {
        const { page, limit = '10', ...filterQuery } = query;
        const filter = buildFilter(filterQuery);
        if (page) {
            return articleRepository.findAll(filter, {
                page:  parseInt(page,  10),
                limit: parseInt(limit, 10),
            });
        }
        return articleRepository.findAll(filter);
    }

    async getById(id) {
        const article = await articleRepository.findById(id);
        if (!article) throw notFound();
        // Fire-and-forget: increment view counter
        articleRepository.incrementViews(id).catch(() => {});
        return article;
    }

    async getRelated(id) {
        const article = await articleRepository.findById(id);
        if (!article) throw notFound();
        return articleRepository.findRelated(id, article.categories);
    }

    async update(id, data) {
        if (data.status === 'published') data.publishedAt = data.publishedAt || new Date();
        const article = await articleRepository.updateById(id, data);
        if (!article) throw notFound();
        return article;
    }

    async delete(id) {
        const article = await articleRepository.deleteById(id);
        if (!article) throw notFound();
    }
}

module.exports = new ArticleService();
