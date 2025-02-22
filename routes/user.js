const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const flash = require("connect-flash")
const { saveRedirectUrl } = require("../middleware.js");
const User = require("../models/user.js");
const usercontroller = require("../controller/user.js");

router.route("/signup")
    .get(usercontroller.rendersignupform)
    .post(wrapAsync(usercontroller.signUp));

router.route("/login")
    .get(usercontroller.userlogin)
    .post(saveRedirectUrl, wrapAsync(async (req, res, next) => {
        try {
            const { username } = req.body;

            // Check if the user exists (supports Google & Local users)
            const user = await User.findOne({
                $or: [{ username }, { email: username }]
            });

            if (!user) {
                req.flash("error", "Sign up first.");
                return res.redirect("/signup"); // Redirect to signup page
            }

            // If user exists, proceed with local login
            passport.authenticate("local", {
                failureRedirect: "/login",
                failureFlash: true,
            })(req, res, next);

        } catch (err) {
            next(err);
        }
    }), usercontroller.login);

router.get("/logout", usercontroller.logout);

module.exports = router;