
const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/payment");
const Listing = require("../models/listings");
require("dotenv").config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
console.log("🔑 Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
console.log("🔑 Razorpay Key Secret:", process.env.RAZORPAY_KEY_SECRET);


// ✅ **Create Order with Correct Amount**
router.post("/create-order", async (req, res) => {
    console.log("📩 Received request at /create-order:", req.body);

    try {
        const { listingId, userId, bookingDate } = req.body;

        if (!listingId || !userId || !bookingDate) {
            console.log("❌ Missing required details.");
            return res.status(400).json({ error: "Missing required details." });
        }

        console.log("🔍 Fetching listing details...");
        const listing = await Listing.findById(listingId);
        console.log("✅ Listing fetched:", listing);

        if (!listing) {
            console.log("❌ Listing not found.");
            return res.status(404).json({ error: "Listing not found." });
        }

        console.log("💰 Listing price:", listing.price);
        const amount = listing.price * 100;

        console.log("🚀 Creating order with Razorpay...");
        const order = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
        });

        console.log("🛒 Order created successfully:", order);

        res.json({
            success: true,
            order_id: order.id,
            amount: order.amount / 100,
            currency: order.currency,
            listingId,
            userId,
            bookingDate
        });

    } catch (error) {
        console.error("❌ Order Creation Error:", error);
        return res.status(500).json({ error: `Something went wrong: ${error.message}` });
    }
});



// ✅ **Verify Payment with Debugging**
router.post("/verify-payment", async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            listingId,
            userId,
            bookingDate,
            amount
        } = req.body;

        console.log("🔍 Verifying payment...", req.body);

        // ✅ Check if the date is already booked
        const existingBooking = await Payment.findOne({
            listingId,
            bookingDate: new Date(bookingDate),
            status: "Completed"
        });

        if (existingBooking) {
            console.log("❌ This date is already booked.");
            return res.status(400).json({ error: "This date is already booked for this studio." });
        }

        // ✅ Verify payment signature
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            console.log("❌ Invalid payment signature.");
            return res.status(400).json({ error: "Invalid payment signature" });
        }

        // ✅ Save payment in DB
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
        console.log("✅ Payment verified and saved.");

        return res.status(200).json({
            success: true,
            message: "Payment successful! Your studio is booked.",
            payment: {
                id: newPayment._id,
                bookingDate: newPayment.bookingDate
            }
        });

    } catch (error) {
        console.error("❌ Payment Verification Error:", error);
        return res.status(500).json({ error: `Payment verification failed: ${error?.message || "Unknown error"}` });
    }
});

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
