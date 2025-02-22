class ExpressError extends Error {
    constructor(statuscode, message, type, details = []) {
        super(message); // Call the parent constructor with the error message
        this.statuscode = statuscode;
        this.type = type;
        this.details = details; // Add validation details
    }
}

module.exports = ExpressError;
