const Team = require('../models/team.model');

class TeamRepository {
    findAll()           { return Team.find().sort({ order: 1, createdAt: -1 }); }
    findById(id)        { return Team.findById(id); }
    findByUserId(uid)   { return Team.findOne({ userId: uid }); }
    create(data)        { return Team.create(data); }
    update(id, data)    { return Team.findByIdAndUpdate(id, data, { new: true, runValidators: true }); }
    updateByUserId(uid, data) { return Team.findOneAndUpdate({ userId: uid }, data, { new: true, runValidators: true }); }
    remove(id)          { return Team.findByIdAndDelete(id); }
}

module.exports = new TeamRepository();
