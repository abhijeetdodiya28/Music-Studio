require('dotenv').config();


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodoverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/Express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const Razorpay = require("razorpay");
const passport = require("passport");
const User = require("./models/user.js");
const LocalStrategy = require("passport-local");
const cron = require("node-cron");
const deleteExpiredBookings = require("./models/bookingcleanup.js");
const cors = require("cors");
const listingRoute = require("./routes/listings.js");
const reviewRoute = require("./routes/review.js");
const userRoute = require("./routes/user.js");
const paymentRoutes = require("./routes/payment");
const authRoute = require("./controller/auth.js"); // Add Google Auth Routes

//database connectivity

const dirlink = process.env.ATLASTDB_URL;
const MONGO_URL = "mongodb://127.0.0.1:27017/Musicstudio";


main()
    .then(() => {
        console.log("Connected to MongoDb");
    }).catch((err) => {
        console.log("error connecting to mongodb");
    })
async function main() {
    mongoose.connect(dirlink);
}

//midlewares
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/privacy-policy", (req, res) => {
    res.render("privacy-policy.ejs");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodoverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


// Enable CORS before authentication and session middleware
app.use(cors({ origin: ["https://music-studio-751p.onrender.com"], credentials: true }));

// session storage 
const store = MongoStore.create(
    {
        mongoUrl: dirlink,
        crypto: {
            secret: "mysupersecretcode"
        },
        touchAfter: 24 * 3600,
    }
)

store.on("error", () => {
    console.log("Error in session store", err);
})

// //session
const sessionOption = {
    // store,
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, //Prevents XSS attacks
    }
};




//middleware for listing

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// auto booking delete
// Run the cleanup job every day at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
    console.log("Running expired booking cleanup...");
    await deleteExpiredBookings();
});

//razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});




// Middleware to pass flash messages to the views
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;
    next();
});

//


//that is middleware
app.use("/listings", listingRoute);
app.use("/listings/:id/reviews", reviewRoute);
app.use("/", userRoute);
app.use("/", authRoute);
app.use("/payment", paymentRoutes);
app.use(paymentRoutes);

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
})

// error middlware
app.use((err, req, res, next) => {
    const { statuscode = 500, message = "Something went wrong!" } = err;
    if (res.headersSent) {
        return next(err); // Prevents double-sending headers
    }
    res.status(statuscode).render("error.ejs", { err: { statuscode, message } });
});

//route
app.get("/", (req, res) => {
    res.send("listings")
})
const PORT = process.env.PORT || 7000; // Read PORT from .env or use 7000 as default

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
