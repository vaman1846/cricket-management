const mongoose = require("mongoose");

const readinessSurvey = new mongoose.Schema({

    Sleep: { type: Number, require: true },
    Mood: { type: Number, require: true },
    Energy: { type: Number, require: true },
    Stressed: { type: Number, require: true },
    Sore: { type: Number, require: true },
    Heart_rate: { type: Number, require: true },
    Urine_color: { type: String, require: true }

}, { timestamps: true });

module.exports = mongoose.model("readinessSurvey", readinessSurvey)

