const teamService = require('../services/team.service');

class TeamController {
    async getAll(req, res, next) {
        try { res.json(await teamService.getAll()); }
        catch (err) { next(err); }
    }

    async getById(req, res, next) {
        try { res.json(await teamService.getById(req.params.id)); }
        catch (err) { next(err); }
    }

    async getMyProfile(req, res, next) {
        try {
            const member = await teamService.getByUserId(req.user._id);
            res.json(member || null);
        } catch (err) { next(err); }
    }

    async create(req, res, next) {
        try { res.status(201).json(await teamService.create(req.body)); }
        catch (err) { next(err); }
    }

    async update(req, res, next) {
        try { res.json(await teamService.update(req.params.id, req.body)); }
        catch (err) { next(err); }
    }

    async updateMyProfile(req, res, next) {
        try {
            if (req.user.role !== 'doctor') {
                return res.status(403).json({ message: 'Тільки для лікарів' });
            }
            const member = await teamService.updateMyProfile(req.user._id, req.body);
            res.json(member);
        } catch (err) { next(err); }
    }

    async remove(req, res, next) {
        try { await teamService.remove(req.params.id); res.status(204).end(); }
        catch (err) { next(err); }
    }
}

module.exports = new TeamController();
