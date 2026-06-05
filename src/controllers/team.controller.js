const teamService = require('../services/team.service');

class TeamController {
    async getAll(req, res, next) {
        try {
            const members = await teamService.getAll();
            res.json(members);
        } catch (err) { next(err); }
    }

    async getById(req, res, next) {
        try {
            const member = await teamService.getById(req.params.id);
            res.json(member);
        } catch (err) { next(err); }
    }

    async create(req, res, next) {
        try {
            const member = await teamService.create(req.body);
            res.status(201).json(member);
        } catch (err) { next(err); }
    }

    async update(req, res, next) {
        try {
            const member = await teamService.update(req.params.id, req.body);
            res.json(member);
        } catch (err) { next(err); }
    }

    async remove(req, res, next) {
        try {
            await teamService.remove(req.params.id);
            res.status(204).end();
        } catch (err) { next(err); }
    }
}

module.exports = new TeamController();
