const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        listingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        bookingDate: {
            type: Date,
            required: true,
        },
        razorpay_order_id: {
            type: String,
            required: true,
        },
        razorpay_payment_id: {
            type: String,
            default: null,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["Created", "Completed", "Cancelled"],
            default: "Created",
        },
    },
    {
        timestamps: true,
    }
);

// Ensure unique booking per listing per date
paymentSchema.index({ listingId: 1, bookingDate: 1 }, { unique: true });

// Function to drop index safely
async function dropIndex() {
    try {
        const db = mongoose.connection.db;
        if (db) {
            const indexes = await db.collection("payments").indexes();
            const indexName = "razorpay_payment_id_1";

            if (indexes.some(index => index.name === indexName)) {
                await db.collection("payments").dropIndex(indexName);
                console.log(`Index '${indexName}' dropped successfully.`);
            } else {
                console.log(`Index '${indexName}' does not exist, skipping drop.`);
            }
        }
    } catch (error) {
        console.error("Error dropping index:", error);
    }
}

// Drop index after database connection is open
mongoose.connection.once("open", async () => {
    await dropIndex();
    try {
        await mongoose.connection.db.collection("payments").createIndex({ razorpay_payment_id: 1 });
        console.log("Index 'razorpay_payment_id_1' created.");
    } catch (error) {
        console.error("Error creating index:", error);
    }
});

module.exports = mongoose.model("Payment", paymentSchema);
