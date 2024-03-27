const Event = require('../model/model');
const csv = require('csvtojson');
const axios = require('axios');




const importuser = async (req, res) => {
    try {
        const jsonObj = await csv().fromFile(req.file.path);
        
        const eventsToInsert = jsonObj.map(event => ({
            "event_name": event.event_name,
            "city_name": event.city_name,
            "date": event.date,
            "time": event.time,
            "latitude": event.latitude,
            "longitude": event.longitude
        }));

        await Event.insertMany(eventsToInsert);
        
        res.status(200).json({ status: 200, success: true, msg: "Data imported successfully" });
    } catch (error) {
        console.error(error);
        res.status(400).json({ status: 400, error: error.message });
    }
}

const findEvents = async (req, res) => {
    try {
        const { date, latitude, longitude } = req.query;
        if (!date || !latitude || !longitude) {
            return res.status(400).json({ error: 'Date, latitude, and longitude parameters are required' });
        }

        // Parse the date string to a Date object
        const specifiedDate = new Date(date);
        const endDate = new Date(specifiedDate.getTime() + 50 * 24 * 60 * 60 * 1000); // Add 50 days to the specified date

        // Query events from the database based on the date range
        const events = await Event.find({
            date: { $gte: specifiedDate, $lte: endDate }
        });

        // Fetch weather and distance details for all events in parallel
        const eventDetailsPromises = events.map(async (event) => {
            const weatherPromise = axios.get(`https://gg-backend-assignment.azurewebsites.net/api/Weather?code=KfQnTWHJbg1giyB_Q9Ih3Xu3L9QOBDTuU5zwqVikZepCAzFut3rqsg==&city=${event.city_name}&date=${event.date}`);
            const distancePromise = axios.get(`https://gg-backend-assignment.azurewebsites.net/api/Distance?code=IAKvV2EvJa6Z6dEIUqqd7yGAu7IZ8gaH-a0QO6btjRc1AzFu8Y3IcQ==&latitude1=${latitude}&longitude1=${longitude}&latitude2=${event.latitude}&longitude2=${event.longitude}`);
            const [weatherResponse, distanceResponse] = await Promise.all([weatherPromise, distancePromise]);
            const weather = weatherResponse.data.weather;
            const distance = distanceResponse.data.distance;
            return {
                event_name: event.event_name,
                city_name: event.city_name,
                date: specifiedDate.toISOString().slice(0, 10), // Extracting date part without time
                weather,
                distance
            };
        });

        // Wait for all event details to be fetched
        const eventsWithDetails = await Promise.all(eventDetailsPromises);

        res.json(eventsWithDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    importuser,
    findEvents
};