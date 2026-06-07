const teamRepository = require('../repositories/team.repository');

const makeError = (msg, code) => Object.assign(new Error(msg), { statusCode: code });

// Fields a doctor is allowed to edit on their own profile
const DOCTOR_EDITABLE = ['bio', 'specializations', 'experience', 'education', 'phone', 'photo'];

class TeamService {
    async getAll()      { return teamRepository.findAll(); }

    async getById(id)   {
        const member = await teamRepository.findById(id);
        if (!member) throw makeError('Team member not found', 404);
        return member;
    }

    async getByUserId(userId) {
        return teamRepository.findByUserId(userId); // null if not linked
    }

    async create(data)     { return teamRepository.create(data); }

    async update(id, data) {
        const member = await teamRepository.update(id, data);
        if (!member) throw makeError('Team member not found', 404);
        return member;
    }

    // Doctor updates their own profile — restricted fields only
    async updateMyProfile(userId, data) {
        const member = await teamRepository.findByUserId(userId);
        if (!member) throw makeError('Профіль лікаря не знайдено', 404);

        const allowed = {};
        for (const key of DOCTOR_EDITABLE) {
            if (data[key] !== undefined) allowed[key] = data[key];
        }
        return teamRepository.update(member._id, allowed);
    }

    async remove(id) {
        const member = await teamRepository.remove(id);
        if (!member) throw makeError('Team member not found', 404);
        return member;
    }
}

module.exports = new TeamService();
