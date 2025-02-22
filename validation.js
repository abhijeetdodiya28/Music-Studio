const { listingSchema } = require("./script");
const ExpressError = require("./utils/Express"); // Assuming this is where the custom error class is defined

// Middleware to validate listing data
const validateListing = (req, res, next) => {
    const { error, value } = listingSchema.validate(req.body);
    if (error) {
        // Create a custom validation error with status code and details
        const validationError = new ExpressError(
            400,
            error.message,
            "Validation Error",
            error.details.map(detail => detail.message) // Add the validation error details
        );
        return next(validationError); // Pass the error to the custom error handler
    }
    next(); // Proceed to the next middleware or route handler if validation is successful
};

module.exports = validateListing;
