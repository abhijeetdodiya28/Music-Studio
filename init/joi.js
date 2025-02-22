const Joi = require('joi');

// Listing schema validation
module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        name: Joi.string().required(),
        location: Joi.string().required(),
        facilities: Joi.string().allow("", null).optional(),
        category: Joi.string()
            .valid("String", "Percussion", "Keyboard", "Wind", "Brass", "Amazing Pools", "Ethnomusicology", "General")
            .required(),
        availability: Joi.string().valid("true", "false").required(),
        price: Joi.number().required().min(0),
        phoneNumber: Joi.string()
            .pattern(/^[0-9]{10,15}$/) // Validates 10 to 15 digit phone numbers
            .required(),
    }).required(),
    deletedImages: Joi.string().allow("", null).optional(), // ✅ Fixed validation
});

// Review schema validation
module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required(),
    }).required(),
});
