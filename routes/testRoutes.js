const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// Create a new Test
router.post('/', testController.createTest);

// Get all Tests
router.get('/', testController.getAllTests);

// Get a single Test by ID
router.get('/:id', testController.getTestById);

// Update a Test by ID
router.put('/:id', testController.updateTest);

// Delete a Test by ID
router.delete('/:id', testController.deleteTest);

module.exports = router;
