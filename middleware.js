const Listing = require("./models/listings");
const ExpressError = require("./utils/Express");
const { listingSchema } = require("./init/joi.js");
const { reviewSchema } = require("./init/joi.js");
const review = require("./models/review.js");


module.exports.isLoggedIn = (req, res, next) => {
    // console.log(req.path, "..", req.originalUrl);
    if (!req.isAuthenticated()) {  //check user logging or not
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "you must be logged in to create new Studio!");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

//middlware for edit,update and delete studio only by owener
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the Owner of this Studio");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

//validation check for studio data

module.exports.validation = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errmsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errmsg);
    } else {
        next();
    }
}

//for review 
module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errmsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errmsg);
    } else {
        next();
    }
}

//review author

module.exports.isAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review1 = await review.findById(reviewId);
    if (!review1.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
}