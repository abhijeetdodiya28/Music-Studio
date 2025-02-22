const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Listing = require("../models/listings");
const { isLoggedIn } = require("../middleware"); // Middleware to check if user is logged in

// Create a booking after successful payment
router.post("/create", isLoggedIn, async (req, res) => {
    try {
        const { listingId, bookingDate, paymentId } = req.body;

        // Validate the listing
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        // Create a new booking
        const booking = new Booking({
            user: req.user._id,
            listing: listingId,
            bookingDate,
            paymentId,
            status: "Confirmed"
        });

        await booking.save();
        res.status(200).json({ success: true, message: "Booking confirmed!", booking });

    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
