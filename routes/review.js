const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const Review = require("../models/review.js");
const Listing = require("../models/listings");
const { validateReview, isLoggedIn, isAuthor } = require("../middleware.js")

const reviewController = require("../controller/review.js");

// review route

router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.createReview))

router.delete("/:reviewId", isLoggedIn, isAuthor, wrapAsync(reviewController.DeleteReview));

module.exports = router;