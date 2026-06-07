const User = require('../models/user.model');

class UserRepository {
    create(data)                   { return new User(data).save(); }
    findByEmail(email)             { return User.findOne({ email }); }
    findById(id)                   { return User.findById(id); }
    findOne(query)                 { return User.findOne(query); }
    findAll()                      { return User.find().sort({ createdAt: -1 }); }
    count()                        { return User.countDocuments(); }

    findByEmailOrPhone(identifier) {
        const val = identifier.toLowerCase().trim();
        return User.findOne({ $or: [{ email: val }, { phone: identifier.trim() }] });
    }
}

module.exports = new UserRepository();
