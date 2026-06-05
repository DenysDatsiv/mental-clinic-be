const testService = require('../services/test.service');

class TestController {
    async create(req, res, next) {
        try {
            const test = await testService.create(req.body);
            res.status(201).json(test);
        } catch (err) {
            next(err);
        }
    }

    async getAll(req, res, next) {
        try {
            const tests = await testService.getAll(req.query);
            res.status(200).json(tests);
        } catch (err) {
            next(err);
        }
    }

    async getById(req, res, next) {
        try {
            const test = await testService.getById(req.params.id);
            res.status(200).json(test);
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const test = await testService.update(req.params.id, req.body);
            res.status(200).json(test);
        } catch (err) {
            next(err);
        }
    }

    async delete(req, res, next) {
        try {
            await testService.delete(req.params.id);
            res.status(200).json({ message: 'Test deleted successfully' });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new TestController();
