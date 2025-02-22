const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    username: String, // Removed uniqueness constraint
    email: { type: String, unique: true, required: true },
    googleId: { type: String, unique: true, sparse: true }, // sparse allows multiple null values
    facebookId: { type: String, unique: true, sparse: true }, // Add Facebook ID
    profilePicture: String,
});

// Ensure username does not conflict with passport-local-mongoose
userSchema.plugin(passportLocalMongoose, { usernameUnique: false });

// Drop existing username index to prevent E11000 duplicate error
userSchema.indexes().forEach((index) => {
    if (index[0].username) mongoose.connection.db.collection("users").dropIndex(index[0].username);
});

module.exports = mongoose.model("User", userSchema);
