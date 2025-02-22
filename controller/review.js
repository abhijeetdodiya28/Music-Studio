const Listing = require("../models/listings");
const Review = require("../models/review.js");


module.exports.createReview = async (req, res) => {
    let listing = await Listing.findById(req.params.id)
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    console.log(newReview);
    listing.review.push(newReview)

    await newReview.save();
    await listing.save();
    req.flash("success", "New Review Created!"); // Set the flash message


    res.redirect(`/listings/${listing._id}`);
}

module.exports.DeleteReview = async (req, res) => {
    let { id, reviewId } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { review: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", " Review Deleted!"); // Set the flash message
    res.redirect(`/listings/${id}`);
}