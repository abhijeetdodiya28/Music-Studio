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
    },
    razorpay_payment_id: {
        type: String,
        default: null
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["Created", "Completed", "Cancelled"],
        default: "Created"
    }
}, {
    timestamps: true
});

await mongoose.connection.db.collection('payments').dropIndex("razorpay_payment_id_1");

paymentSchema.index({ listingId: 1, bookingDate: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
