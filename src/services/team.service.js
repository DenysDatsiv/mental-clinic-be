const teamRepository = require('../repositories/team.repository');

const makeError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

class TeamService {
    async getAll()      { return teamRepository.findAll(); }
    async getById(id)   {
        const member = await teamRepository.findById(id);
        if (!member) throw makeError('Team member not found', 404);
        return member;
    }
    async create(data)     { return teamRepository.create(data); }
    async update(id, data) {
        const member = await teamRepository.update(id, data);
        if (!member) throw makeError('Team member not found', 404);
        return member;
    }
    async remove(id) {
        const member = await teamRepository.remove(id);
        if (!member) throw makeError('Team member not found', 404);
        return member;
    }
}

module.exports = new TeamService();
