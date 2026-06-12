const Contract = require('../models/contract.model');

class ContractService {
  async get() {
    let doc = await Contract.findOne();
    if (!doc) doc = await Contract.create({ content: '' });
    return doc;
  }

  async update(content, visible) {
    let doc = await Contract.findOne();
    if (doc) {
      doc.content = content;
      if (visible !== undefined) doc.visible = visible;
    } else {
      doc = new Contract({ content, visible: visible ?? true });
    }
    return doc.save();
  }
}

module.exports = new ContractService();
