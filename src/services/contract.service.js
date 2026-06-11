const Contract = require('../models/contract.model');

class ContractService {
  async get() {
    let doc = await Contract.findOne();
    if (!doc) doc = await Contract.create({ content: '' });
    return doc;
  }

  async update(content) {
    let doc = await Contract.findOne();
    if (doc) {
      doc.content = content;
    } else {
      doc = new Contract({ content });
    }
    return doc.save();
  }
}

module.exports = new ContractService();
