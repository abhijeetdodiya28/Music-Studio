const mongoose = require("mongoose");
const Payment = require("../models/payment");

async function deleteExpiredBookings() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);


        const result = await Payment.deleteMany({ bookingDate: { $lt: today } });

        console.log(`Expired Bookings Deleted: ${result.deletedCount}`);
    } catch (error) {
        console.error("Error deleting expired bookings:", error);
    }
}

module.exports = deleteExpiredBookings;
