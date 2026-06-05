const Test = require('../models/test.model');

const LIST_FIELDS = '_id name description type specialTest duration';

class TestRepository {
    create(data) {
        return new Test(data).save();
    }

    findAll(filter) {
        return Test.find(filter).select(LIST_FIELDS);
    }

    findById(id) {
        return Test.findById(id);
    }

    updateById(id, data) {
        return Test.findByIdAndUpdate(id, data, { new: true });
    }

    deleteById(id) {
        return Test.findByIdAndDelete(id);
    }
}

module.exports = new TestRepository();
