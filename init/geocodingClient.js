// geocodingClient.js
const axios = require('axios');

const LOCATIONIQ_API_KEY = process.env.MAP_TOKEN; // Use an environment variable for security

const geocodingClient = {
    forwardGeocode: async ({ query, limit = 1 }) => {
        try {
            const response = await axios.get(
                `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_API_KEY}& q=${encodeURIComponent(query)}& format=json & limit=${limit} `
            );
            return response.data;
        } catch (error) {
            console.error(" Geocoding error:", error.response?.data || error.message);
            return null;
        }
    },
};

module.exports = geocodingClient;
