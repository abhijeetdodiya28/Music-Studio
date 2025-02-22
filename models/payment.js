const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookingDate: {
        type: Date,
        required: true
    },
    razorpay_order_id: {
        type: String,
        required: true,
        unique: true
    },
    razorpay_payment_id: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: { type: String, enum: ["Completed", "Cancelled"], default: "Completed" }

}, {
    timestamps: true
});

// Add compound index for preventing duplicate bookings
paymentSchema.index({ listingId: 1, bookingDate: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);