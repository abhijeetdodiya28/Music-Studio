const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Listing = require("../models/listings");
const Payment = require("../models/payment");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order
router.post("/create-order", async (req, res) => {
    console.log("Received request at /create-order:", req.body);

    try {
        const { listingId, userId, bookingDate } = req.body;
        if (!listingId || !userId || !bookingDate) {
            return res.status(400).json({ error: "Missing required details." });
        }

        console.log("Fetching listing details...");
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ error: "Listing not found." });
        }

        // Check if the listing is already booked on this date
        const existingBooking = await Payment.findOne({ listingId, bookingDate: new Date(bookingDate) });

        if (existingBooking) {
            return res.status(400).json({ error: "This date is already booked. Please select a different date." });
        }

        const amount = listing.price * 100; // Convert to paise
        console.log("Amount to be paid (in paise):", amount);

        const options = {
            amount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
        };

        console.log("Creating order with Razorpay...");
        const order = await razorpay.orders.create(options);

        // ✅ Store Payment without razorpay_payment_id initially
        const newPayment = new Payment({
            razorpay_order_id: order.id,
            listingId,
            userId,
            bookingDate: new Date(bookingDate),
            amount: order.amount / 100, // Store in rupees
            status: "Created" // Change from "Pending" if not in enum
        });

        await newPayment.save();
        console.log("Order saved to DB:", newPayment);

        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount / 100,
            currency: order.currency,
            listingId,
            userId,
            bookingDate,
        });
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ error: `Something went wrong: ${error.message || "Unknown error"}` });
    }
});




// Verify Payment
router.post("/verify-payment", async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            listingId,
            userId,
            bookingDate,
            amount,
        } = req.body;

        console.log("Verifying payment...", req.body);

        // ✅ Find payment record using razorpay_order_id
        const existingPayment = await Payment.findOne({ razorpay_order_id });
        if (!existingPayment) {
            return res.status(400).json({ error: "Order ID does not exist." });
        }

        // ✅ Verify Razorpay Signature
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ error: "Invalid payment signature" });
        }

        // ✅ Update payment record with payment_id and mark as completed
        existingPayment.razorpay_payment_id = razorpay_payment_id;
        existingPayment.status = "Completed"; // Ensure this value is valid in the enum
        await existingPayment.save();

        console.log("Payment verified and saved.");

        return res.status(200).json({
            success: true,
            message: "Payment successful! Your studio is booked.",
        });
    } catch (error) {
        console.error("Payment Verification Error:", error);
        return res.status(500).json({ error: `Payment verification failed: ${error.message || "Unknown error"}` });
    }
});





// Fetch User Bookings
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

// Cancel Booking
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

// Edit Booking Date
router.post("/edit-booking", async (req, res) => {
    try {
        const { bookingId, newDate } = req.body;
        if (!newDate) return res.status(400).json({ error: "New date is required" });

        const newBookingDate = new Date(newDate);
        const booking = await Payment.findById(bookingId);
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        // If cancelled, delete it
        if (booking.status === "Cancelled") {
            await Payment.findByIdAndDelete(bookingId);
            return res.status(200).json({ success: true, message: "Booking was cancelled and removed." });
        }

        // Check if the new date is already booked
        const existingBooking = await Payment.findOne({
            listingId: booking.listingId,
            bookingDate: newBookingDate,
        });

        if (existingBooking) {
            return res.status(400).json({ error: "This date is already booked. Please select a different date." });
        }

        booking.bookingDate = newBookingDate;
        await booking.save();

        res.status(200).json({ success: true, message: "Booking date updated successfully!", booking });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({ error: "Failed to update booking." });
    }
});

// Cleanup Bookings
router.get("/cleanup-bookings", async (req, res) => {
    try {
        console.log("Starting cleanup...");
        await deleteExpiredBookings();
        res.status(200).json({ success: true, message: "Expired bookings deleted successfully!" });
    } catch (error) {
        console.error("Error in manual cleanup:", error);
        res.status(500).json({ error: "Failed to delete expired bookings." });
    }
});

module.exports = router;
