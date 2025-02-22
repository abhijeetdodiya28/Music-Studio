const mongoose = require("mongoose");
const Review = require("./review");
const { required } = require("joi");
const Schema = mongoose.Schema;

const listingsSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  facilities: {
    type: [String],
    required: true,
  },
  category: {
    type: String,
    required: true, // Change to false if it's optional
    enum: ['String', 'Percussion', 'Keyboard', 'Wind', 'Brass', 'Amazing Pools', 'Ethnomusicology', 'General']
  },

  availability: {
    type: Boolean,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  booking: [{
    type: Date,
    required: false,
  }],
  phoneNumber: {
    type: String,  // Changed to String for phone numbers
    required: true,
  },

  images: [
    {
      url: String,
      filename: String
    }
  ],
  review: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    }
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  geometry: {
    type: {
      type: String,
      enum: ['Point'], // "type" must be "Point" for GeoJSON
    },
    coordinates: {
      type: [Number], // Coordinates must be an array of numbers
      required: true,
      index: "2dsphere", // Enable geospatial queries

    }
  }
});


listingsSchema.index({ geometry: "2dsphere" });


listingsSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.review } });
  }
})

const Listing = mongoose.model('Listing', listingsSchema);

module.exports = Listing;
