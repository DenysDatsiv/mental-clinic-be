const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question:  { type: String },
    example:   { type: String },
    labelText: [{ type: String, required: true }],
    value:     [{ type: Number, required: true }],
});

const interpretationSchema = new mongoose.Schema({
    range:         [{ type: Number }],
    result:        { type: String },
    name:          { type: String },
    type:          { type: String },
    questionIndex: [{ type: Number }],
});

const spectraSchema = new mongoose.Schema({
    factor:         { type: Number },
    name:           { type: String },
    questions:      [{ type: Number }],
    interpretation: { type: String },
});

const testSchema = new mongoose.Schema({
    name:                { type: String, required: true },
    description:         { type: String, required: true },
    type:                { type: String, required: true },
    specialTest:         { type: String, required: true },
    duration:            { type: String, required: true },
    instructions:        { type: String, required: true },
    whyTest:             { type: String, required: true },
    pdfLink:             { type: String, required: true },
    questions:           [questionSchema],
    commonMessage:       { type: String, required: true },
    resultInterpretation:[interpretationSchema],
    factor:              [spectraSchema],
});

module.exports = mongoose.model('Test', testSchema);
