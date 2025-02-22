const Listing = require("../models/listings");
const axios = require("axios");
const geocodingClient = require("../init/geocodingClient")
const mongoose = require("mongoose"); // Add this at the top

require('dotenv').config();  // To load variables from a .env file



module.exports.index = async (req, res) => {
    try {
        const { location, category } = req.query;
        let filter = {};

        // Apply location filter if provided
        if (location) {
            filter.location = { $regex: new RegExp(location, "i") }; // Case-insensitive match
        }

        // Apply category filter if provided
        if (category) {
            filter.category = category;
        }

        const allListings = await Listing.find(filter);

        res.render("listings/index", { allListings, location, category });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

module.exports.islogging = async (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.booking = async (req, res) => {
    const { id } = req.params;
    const { date } = req.body;

    try {
        let listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        listing.booking.push(date);
        await listing.save();
        res.redirect(`/listings/${listing._id}/confirmation`);
    } catch (error) {
        console.log(error);
        req.flash("error", "Error booking studio!");
        res.redirect(`/listings/${id}`);
    }
}

module.exports.confirmation = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            req.flash("error", "Booking not found");
            return res.redirect("/listings");
        }

        // Calculate amount in paisa (assuming listing.price is in rupees)
        const amount = listing.price * 100;

        // Ensure user is passed from authentication (req.user)
        const user = req.user || null;

        // Get bookingDate from query if available, otherwise default to empty string
        const bookingDate = req.query.bookingDate || "";

        res.render("listings/confirmation.ejs", {
            listing,
            amount,        // Now amount is defined and passed
            currUser: user, // Optionally pass user as currUser for consistency in your views
            messages: req.flash(),
            bookingDate    // Always defined
        });
    } catch (error) {
        req.flash("error", "Error fetching booking details");
        res.redirect("/listings");
    }
};






module.exports.cancelbooking = async (req, res) => {
    try {
        const { listingId } = req.body;  // ✅ Use listingId (match frontend)

        if (!listingId) {
            return res.status(400).json({ success: false, message: "Listing ID is required" });
        }

        const listing = await Listing.findById(listingId);
        if (!listing || listing.booking.length === 0) {
            return res.status(404).json({ success: false, message: "No booking found to cancel" });
        }

        // Remove last booking date
        listing.booking.pop();
        await listing.save();

        return res.status(200).json({ success: true, message: "Booking cancelled successfully" });
    } catch (error) {  // Fix error handling
        console.error("Error cancelling booking:", error);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

module.exports.showStudio = async (req, res) => {
    let { id } = req.params;


    // Check if ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log("Invalid ID:", id);
        req.flash("error", "Invalid Listing ID!");
        return res.redirect("/listings");
    }
    const listing = await Listing.findById(id)
        .populate({
            path: "review",
            populate: { path: "author" },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    res.render("listings/show", { listing, mapToken: process.env.MAP_TOKEN });
};



module.exports.createStudio = async (req, res) => {
    try {
        const listingData = req.body.listing;
        const newListing = new Listing({
            ...listingData,
            owner: req.user._id,
            category: listingData.category,
        });

        // Handle image upload
        if (!req.files || req.files.length === 0) {
            req.flash("error", "At least one image is required!");
            return res.redirect("/listings/new");
        }

        if (req.files.length > 5) {
            req.flash("error", "You can upload a maximum of 5 images only!");
            return res.redirect("/listings/new");
        }

        newListing.images = req.files.map(file => ({
            url: file.path,
            filename: file.filename,
        }));

        // Geocode the location provided in the listing
        if (listingData.location) {
            const response = await geocodingClient.forwardGeocode({ query: listingData.location, limit: 1 });

            if (!response || response.length === 0) {
                req.flash("error", "Invalid location provided.");
                return res.redirect("/listings/new");
            }

            const lat = parseFloat(response[0].lat);
            const lng = parseFloat(response[0].lon);

            newListing.geometry = {
                type: "Point",
                coordinates: [lng, lat],
            };
        }

        await newListing.save();
        req.flash("success", "New Studio Created!");
        res.redirect("/listings");
    } catch (error) {
        console.error("Error creating listing:", error);
        req.flash("error", "Something went wrong while creating the listing!");
        res.redirect("/listings/new");
    }
};



module.exports.index = async (req, res) => {
    try {
        const category = req.query.category; // Get category from query params
        let filter = {}; // Default: No filter

        if (category) {
            filter.category = category; // Apply category filter if exists
        }

        const allListings = await Listing.find(filter); // Fetch listings
        // Pass both listings and category to the view
        res.render("listings/index", { allListings, category });
    } catch (error) {
        console.error("Error fetching listings:", error);
        res.status(500).send("Internal Server Error");
    }
};




module.exports.editStudio = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    // Ensure images exist before modifying them
    let modifiedimage = (listing.images || []).map(img => ({
        ...img,
        url: img.url.replace("/upload", "/upload/h_300,w_250")
    }));

    res.render("listings/edit.ejs", { listing, modifiedimage });
};

module.exports.updateStudio = async (req, res) => {
    try {
        let { id } = req.params;
        const listingData = req.body.listing;

        let listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // Update listing details
        Object.assign(listing, listingData);

        // Handle image deletions
        if (req.body.deletedImages) {
            const deletedImages = req.body.deletedImages.split(",");

            // Remove images from database
            listing.images = listing.images.filter(img => !deletedImages.includes(img.filename));

            // Also delete files from cloud storage (if using Cloudinary, add cloudinary.uploader.destroy)
        }

        // Handle new image uploads
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url: file.path,
                filename: file.filename,
            }));

            // Ensure total images do not exceed 5
            const totalImages = listing.images.length + newImages.length;
            if (totalImages > 5) {
                req.flash("error", "Maximum of 5 images allowed!");
                return res.redirect(`/listings/${id}/edit`);
            }

            listing.images.push(...newImages);
        }

        await listing.save();
        req.flash("success", "Studio Updated!");
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error("Error updating studio:", error);
        req.flash("error", "Something went wrong!");
        res.redirect(`/listings/${id}/edit`);
    }
};






module.exports.deleteStudio = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Studio Deleted !");
    res.redirect("/listings");
};
