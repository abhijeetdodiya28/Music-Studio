const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;

const User = require("../models/user"); // Adjust the path to your User model
const express = require("express");
const router = express.Router();

// Function to generate a unique username
async function generateUniqueUsername(baseUsername) {
    let username = baseUsername.replace(/\s+/g, ""); // Remove spaces
    let userExists = await User.findOne({ username });

    while (userExists) {
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        username = `${baseUsername}${randomNum}`;
        userExists = await User.findOne({ username });
    }
    return username;
}

// Google Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://music-studio-751p.onrender.com/auth/google/listings",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    const uniqueUsername = await generateUniqueUsername(profile.displayName);
                    user = new User({
                        googleId: profile.id,
                        username: uniqueUsername,
                        email: profile.emails[0].value || "no-email@example.com",
                    });
                    await user.save();
                    return done(null, user, { isNewUser: true });
                }

                return done(null, user, { isNewUser: false });
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

// Facebook Strategy
passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: "http://music-studio-751p.onrender.com/auth/facebook/listings",
            profileFields: ["id", "displayName", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ facebookId: profile.id });

                if (!user) {
                    const uniqueUsername = await generateUniqueUsername(profile.displayName);
                    user = new User({
                        facebookId: profile.id,
                        username: uniqueUsername,
                        email: profile.emails ? profile.emails[0].value : "no-email@example.com",
                    });
                    await user.save();
                    return done(null, user, { isNewUser: true });
                }

                return done(null, user, { isNewUser: false });
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: "http://music-studio-751p.onrender.com/auth/github/listings",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log(profile); // Debugging

                let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : `no-email-${profile.id}@example.com`;

                // First, check if a user with this email exists
                let user = await User.findOne({ email });

                if (user) {
                    // If user exists but has no GitHub ID, link the account
                    if (!user.githubId) {
                        user.githubId = profile.id;
                        await user.save();
                    }
                    return done(null, user, { isNewUser: false });
                }

                // If no user found, create a new one
                const uniqueUsername = await generateUniqueUsername(profile.username);
                user = new User({
                    githubId: profile.id,
                    username: uniqueUsername,
                    email: email, // Ensures uniqueness
                });

                await user.save();
                return done(null, user, { isNewUser: true });

            } catch (err) {
                return done(err, false);
            }
        }
    )
);



// Serialize and Deserialize User
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google Auth Routes
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/auth/google/listings", (req, res, next) => {
    passport.authenticate("google", { failureRedirect: "/login" }, (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect("/login");

        req.logIn(user, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to MouseStudio!");
            return res.redirect("/listings"); // Redirect to listings page
        });
    })(req, res, next);
});

// Facebook Auth Routes
router.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));

router.get("/auth/facebook/listings", (req, res, next) => {
    passport.authenticate("facebook", { failureRedirect: "/login" }, (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect("/login");

        req.logIn(user, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to MouseStudio!");
            return res.redirect("/listings"); // Redirect to listings page
        });
    })(req, res, next);
});

router.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

router.get("/auth/github/listings", (req, res, next) => {
    passport.authenticate("github", { failureRedirect: "/login" }, (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect("/login");

        req.logIn(user, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to MouseStudio!");
            return res.redirect("/listings"); // Redirect to listings page
        });
    })(req, res, next);
});


module.exports = router;
