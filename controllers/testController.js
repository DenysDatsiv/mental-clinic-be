const mongoose = require('mongoose');
const Test = require('../models/Test');
const crypto = require('crypto');

// Helper function to generate a random name
const generateRandomName = () => crypto.randomBytes(8).toString('hex');

// Create a new Test
exports.createTest = async (req, res) => {
    try {
        const testData = req.body;
        if (testData.questions && Array.isArray(testData.questions)) {
            testData.questions = testData.questions.map(question => ({
                _id: new mongoose.Types.ObjectId(),
                name: generateRandomName(),
                ...question
            }));
        }

        const test = new Test(testData);
        const savedTest = await test.save();
        res.status(201).json(savedTest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};



exports.getAllTests = async (req, res) => {
    try {
        const { searchKeyword, type } = req.query;
        let filter = {};

        // Apply search filter if searchKeyword is provided
        if (searchKeyword) {
            filter.$or = [
                { name: { $regex: new RegExp(searchKeyword, 'i') } }, // Case-insensitive search
                { description: { $regex: new RegExp(searchKeyword, 'i') } } // Case-insensitive search
            ];
        }

        // Apply type filter if provided
        if (type) {
            filter.type = type;
        }

        // Query MongoDB and select only required fields, now including 'description'
        const tests = await Test.find(filter).select('_id name description sesc type specialTest duration');

        res.status(200).json(tests);
    } catch (error) {
        console.error("Error fetching tests:", error);
        res.status(500).json({ message: error.message });
    }
};


// Get a single Test by ID
exports.getTestById = async (req, res) => {
    try {
        const test = await Test.findById(req.params.id);
        if (!test) return res.status(404).json({ message: 'Test not found' });
        res.status(200).json(test);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a Test by ID
exports.updateTest = async (req, res) => {
    try {
        const updatedData = req.body;
        if (updatedData.questions && Array.isArray(updatedData.questions)) {
            updatedData.questions = updatedData.questions.map(question => ({
                _id: question._id || new mongoose.Types.ObjectId(),
                name: question.name || generateRandomName(),
                ...question
            }));
        }

        const updatedTest = await Test.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!updatedTest) return res.status(404).json({ message: 'Test not found' });
        res.status(200).json(updatedTest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a Test by ID
exports.deleteTest = async (req, res) => {
    try {
        const deletedTest = await Test.findByIdAndDelete(req.params.id);
        if (!deletedTest) return res.status(404).json({ message: 'Test not found' });
        res.status(200).json({ message: 'Test deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
