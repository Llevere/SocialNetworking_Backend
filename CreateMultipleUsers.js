const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const newUserSchema = {
    email: String,
    password: String
}

// Create a new collection for these testing users 
const TestDB = new mongoose.model("TestDB", newUserSchema);

async function CreateMultipleUsers (numberOfUsers) {
    const hashedPassword = await bcrypt.hash("testing", 10);

    for(var i = 0; i < numberOfUsers; i++)
    {
        const newUser = new TestDB({
            email: "testing" + i + "@" + i + ".com",
            password: hashedPassword
        })

        await newUser.save();
    }
}

module.exports = CreateMultipleUsers;