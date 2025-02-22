
const User = require("../models/user.js");

module.exports.rendersignupform = (req, res) => {
    res.render("users/signUp.ejs");
}

module.exports.signUp = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to MusicStudios!");
            res.redirect("/listings");
        })

    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/signup");
    }
}

module.exports.userlogin = (req, res) => {
    res.render("users/login.ejs");
}

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome to Wanderlust! you are logged in!!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res, next) => { // logout user 
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "you are logged Out !");
        res.redirect("/listings");
    });
}