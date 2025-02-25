const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: { type: String, required: false },
    example: { type: String, required: false },
    labelText: [{ type: String, required: true }],
    value: [{ type: Number, required: true }]
});

const interpretationSchema = new mongoose.Schema({
    range: [{ type: Number, required: false }],
    result: { type: String, required: false },
    name: { type: String, required: false },
    type:{ type: String, required: false },
    questionIndex: [{ type: Number, required: false }],
});

const testSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, required: true },
    specialTest: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, required: true },
    whyTest: { type: String, required: true },
    pdfLink: { type: String, required: true },
    questions: [questionSchema],
    commonMessage: { type: String, required: true },
    resultInterpretation: [interpretationSchema]
});

module.exports = mongoose.model('Test', testSchema);
