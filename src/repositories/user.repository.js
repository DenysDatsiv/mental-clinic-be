const User = require('../models/user.model');

class UserRepository {
    create(data)       { return new User(data).save(); }
    findByEmail(email) { return User.findOne({ email }); }
    findById(id)       { return User.findById(id); }
    count()            { return User.countDocuments(); }
}

module.exports = new UserRepository();
