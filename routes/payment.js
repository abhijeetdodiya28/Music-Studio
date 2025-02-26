const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const Listing = require("../models/listings"); // Your Listing Model
const Payment = require("../models/payment"); // Your Payment Model
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// 🛒 **Create Order**
router.post("/create-order", async (req, res) => {
    try {
        console.log("🟢 Received request at /create-order:", req.body);

        const { listingId, userId, bookingDate } = req.body;
        if (!listingId || !userId || !bookingDate) {
            console.log("❌ Missing required details.");
            return res.status(400).json({ error: "Missing required details." });
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            console.log("❌ Listing not found.");
            return res.status(404).json({ error: "Listing not found." });
        }

        console.log("✅ Listing found:", listing);

        const existingPayment = await Payment.findOne({ listingId, bookingDate });
        if (existingPayment) {
            console.log("❌ Studio already booked for this date.");
            return res.status(400).json({ error: "This studio is already booked for the selected date." });
        }

        const amount = listing.price * 100; // Convert to paise
        console.log("💰 Amount to be paid (in paise):", amount);

        const options = {
            amount: amount,
            currency: "INR",
            receipt: `order_rcptid_${Date.now()}`,
            payment_capture: 1
        };

        console.log("🛠️ Creating Razorpay order...");
        const order = await razorpay.orders.create(options);

        console.log("✅ Razorpay order created:", order);
        return res.json(order);
    } catch (error) {
        console.error("❌ Order Creation Error:", error);
        return res.status(500).json({ error: "Something went wrong. Please try again." });
    }
});

// ✅ **Verify Payment Signature & Save Payment**
router.post("/verify-payment", async (req, res) => {
    try {
        console.log("🟢 Received payment verification request:", req.body);

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            listingId,
            userId,
            bookingDate,
            amount
        } = req.body;

        // Check if the listing is already booked
        const existingBooking = await Payment.findOne({
            listingId,
            bookingDate: new Date(bookingDate),
            status: "Completed"
        });

        if (existingBooking) {
            console.log("❌ Booking conflict: This date is already booked.");
            return res.status(400).json({ error: "This date is already booked for this studio." });
        }

        // Generate expected signature
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        console.log("🔍 Expected Signature:", generated_signature);
        console.log("🔍 Received Signature:", razorpay_signature);

        if (generated_signature !== razorpay_signature) {
            console.log("❌ Signature mismatch!");
            return res.status(400).json({ error: "Invalid payment signature" });
        }

        console.log("✅ Signature matched! Saving payment details...");

        // Save payment details
        const newPayment = new Payment({
            listingId,
            userId,
            bookingDate: new Date(bookingDate),
            razorpay_order_id,
            razorpay_payment_id,
            amount,
            status: "Completed"
        });

        await newPayment.save();

        console.log("✅ Payment recorded successfully!");

        return res.status(200).json({
            success: true,
            message: "Payment successful! Your studio is booked.",
            payment: { id: newPayment._id, bookingDate: newPayment.bookingDate }
        });

    } catch (error) {
        console.error("❌ Payment Verification Error:", error);
        return res.status(500).json({ error: "Payment verification failed. Please try again." });
    }
});

module.exports = router;


router.get("/user-bookings/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const bookings = await Payment.find({ userId, status: "Completed" }).populate("listingId");

        res.render("listings/userBookings", { bookings });
    } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({ error: "Failed to fetch bookings." });
    }
});

router.post("/cancel-booking", async (req, res) => {
    try {
        const { bookingId } = req.body;

        const booking = await Payment.findById(bookingId);
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        booking.status = "Cancelled";
        await booking.save();

        res.json({ success: true, message: "Booking cancelled successfully!" });
    } catch (error) {
        console.error("Cancellation Error:", error);
        res.status(500).json({ error: "Failed to cancel booking." });
    }
});

// Edit booking date
router.post("/edit-booking", async (req, res) => {
    try {
        const { bookingId, newDate } = req.body;

        if (!newDate) {
            return res.status(400).json({ error: "New date is required" });
        }

        const newBookingDate = new Date(newDate);

        // Retrieve the booking by ID
        const booking = await Payment.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }

        // **Check if booking is cancelled → DELETE it**
        if (booking.status === "Cancelled") {
            await Payment.findByIdAndDelete(bookingId);
            return res.status(200).json({ success: true, message: "Booking was cancelled and removed." });
        }

        // Check if the new booking date is already booked for the same listing
        const existingBooking = await Payment.findOne({
            listingId: booking.listingId,
            bookingDate: newBookingDate
        });

        if (existingBooking) {
            return res.status(400).json({
                error: "This date is already booked. Please select a different date."
            });
        }

        // Update the booking date
        booking.bookingDate = newBookingDate;
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Booking date updated successfully!",
            booking: booking
        });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({ error: "Failed to update booking." });
    }
});




// Manual cleanup route
router.get("/cleanup-bookings", async (req, res) => {
    try {
        console.log("Starting cleanup...");
        await deleteExpiredBookings();
        res.status(200).json({ success: true, message: "Expired bookings deleted successfully!" });
    } catch (error) {
        console.error(" Error in manual cleanup:", error);
        res.status(500).json({ error: "Failed to delete expired bookings." });
    }
});




module.exports = router;
