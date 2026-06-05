const mongoose = require('mongoose');
const crypto = require('crypto');
const testRepository = require('../repositories/test.repository');

const generateRandomName = () => crypto.randomBytes(8).toString('hex');

const buildFilter = ({ searchKeyword, type } = {}) => {
    const filter = {};
    if (searchKeyword) {
        filter.$or = [
            { name:        { $regex: new RegExp(searchKeyword, 'i') } },
            { description: { $regex: new RegExp(searchKeyword, 'i') } },
        ];
    }
    if (type) filter.type = type;
    return filter;
};

const enrichQuestions = (questions, isNew) =>
    questions.map(q => ({
        _id:  isNew ? new mongoose.Types.ObjectId() : (q._id || new mongoose.Types.ObjectId()),
        name: isNew ? generateRandomName() : (q.name || generateRandomName()),
        ...q,
    }));

const notFound = () => Object.assign(new Error('Test not found'), { statusCode: 404 });

class TestService {
    async create(data) {
        if (Array.isArray(data.questions)) {
            data.questions = enrichQuestions(data.questions, true);
        }
        return testRepository.create(data);
    }

    getAll(query) {
        return testRepository.findAll(buildFilter(query));
    }

    async getById(id) {
        const test = await testRepository.findById(id);
        if (!test) throw notFound();
        return test;
    }

    async update(id, data) {
        if (Array.isArray(data.questions)) {
            data.questions = enrichQuestions(data.questions, false);
        }
        const test = await testRepository.updateById(id, data);
        if (!test) throw notFound();
        return test;
    }

    async delete(id) {
        const test = await testRepository.deleteById(id);
        if (!test) throw notFound();
    }
}

module.exports = new TestService();
