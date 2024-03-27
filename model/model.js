const mongoose = require('mongoose');

const eventDetailsSchema = new mongoose.Schema({
    event_name: String,
    city_name: String,
    date: Date, // Change to Date type
    time: String,
    latitude: Number,
    longitude: Number
});

module.exports = mongoose.model('Event', eventDetailsSchema);