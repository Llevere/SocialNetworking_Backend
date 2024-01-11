const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

function initialize(passport, getUserByEmail) {
    // Functinon to authenticate users
    const authenticateUsers = async (email, password, done) => {
        // Get users by email
        const user = getUserByEmail(email);
        if(user === null) return done(null, false, {message: "Email invalid"});

        try {
            // Compare the hashed password to the plain text password
            if(await bcrypt.compare(passport, user.password)) {
                return done(null, user);
            }
            else {
                return done(null, false, {message: "Password incorrect"});
            }
        } catch (error) {
            console.log(error);
            return done(erro);
        }
    }

    passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUsers))
    passport.serializeUser((user, done) => done(null, user._id))
    passport.deserializeUser((id, done) => {})
}

module.exports = initialize;

