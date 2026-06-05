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
        return articleRepository.findAll(buildFilter(query));
    }

    async getById(id) {
        const article = await articleRepository.findById(id);
        if (!article) throw notFound();
        return article;
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
