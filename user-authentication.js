const bcrypt = require('bcrypt');

async function authenticate(usersEmail, UsersDB) {
    existingUser = await UsersDB.findOne({email: usersEmail});
    if(existingUser === null) {
        return console.log(`No user found with email ${usersEmail}`);
    }
    try {
        
    } catch (error) {
        console.log("Error found when authenticating: " + error);
        return null;

    }
}


module.exports = authenticate;