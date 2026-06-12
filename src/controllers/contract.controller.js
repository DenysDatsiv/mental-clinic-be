const contractService = require('../services/contract.service');

class ContractController {
  async get(req, res, next) {
    try {
      const doc = await contractService.get();
      res.json(doc);
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const { content, visible } = req.body;
      if (typeof content !== 'string') {
        return res.status(400).json({ message: 'content is required' });
      }
      const doc = await contractService.update(content, visible);
      res.json(doc);
    } catch (err) { next(err); }
  }
}

module.exports = new ContractController();
