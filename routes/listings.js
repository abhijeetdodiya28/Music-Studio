const express = require("express");
const router = express.Router();
const axios = require("axios");
const Listing = require("../models/listings");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isOwner, validation } = require("../middleware");
const listingController = require("../controller/listing");
const multer = require("multer");

const { storage } = require("../cloudany.js");

const upload = multer({
    storage,
    limits: { files: 5 },
    fileFilter: (req, file, cb) => {
        if (req.files.length > 5) {
            return cb(new Error("You can upload a maximum of 5 images only!"), false);
        }
        cb(null, true);
    },
});

const LOCATIONIQ_API_KEY = "pk.153e40b0977b0a20cc31a0257e438c07"; // Use env variable

const geocodingClient = {
    forwardGeocode: async ({ query, limit = 1 }) => {
        try {
            const response = await axios.get(
                `https://us1.locationiq.com/v1/search.php?key=${`pk.153e40b0977b0a20cc31a0257e438c07`}&q=${encodeURIComponent(query)}&format=json&limit=${limit}`
            );
            return response.data;
        } catch (error) {
            console.error("Geocoding error:", error.response?.data || error.message);
            return null;
        }
    },
};

router.get("/search", async (req, res) => {
    console.log("Received search request with location:", req.query.location);

    const { location } = req.query;

    if (!location) {
        req.flash("error", "Please enter a location!");
        return res.redirect("/listings");
    }

    try {
        const geoData = await geocodingClient.forwardGeocode({ query: location });

        if (!geoData || geoData.length === 0) {
            req.flash("error", "Location not found!");
            return res.redirect("/listings");
        }

        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);

        console.log(`Searching near: Lat ${lat}, Lng ${lng}`);

        const listings = await Listing.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [lng, lat] },
                    distanceField: "distance",
                    maxDistance: 10000, // Adjust as needed (in meters)
                    spherical: true,
                    key: "geometry"  // Explicitly specify the index field
                },
            },
        ]);


        console.log("Listings Found:", listings);

        if (listings.length === 0) {
            req.flash("error", "No studios found for this location.");
            return res.redirect("/listings");
        }

        res.render("listings/index", { allListings: listings, category: null, location });
    } catch (error) {
        console.error("Error in location search:", error);
        req.flash("error", "Something went wrong while searching!");
        res.redirect("/listings");
    }
});



//  GET All Listings
router.get("/", wrapAsync(listingController.index));


// Create New Listing
router.post(
    "/",
    isLoggedIn,
    upload.array("images", 5),
    validation,
    wrapAsync(listingController.createStudio)
);

// Show "Create New Listing" Page
router.get("/new", isLoggedIn, listingController.islogging);

// CRUD Routes for Listings
router.route("/:id")
    .get(wrapAsync(listingController.showStudio))
    .put(
        isLoggedIn,
        isOwner,
        upload.array("images", 5),
        validation,
        wrapAsync(listingController.updateStudio)
    )
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteStudio));





// Booking Routes
router.post("/:id/book", isLoggedIn, wrapAsync(listingController.booking));
router.get("/:id/confirmation", isLoggedIn, wrapAsync(listingController.confirmation));
router.post("/cancel", isLoggedIn, wrapAsync(listingController.cancelbooking));

// Edit Studio Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editStudio));

module.exports = router;
