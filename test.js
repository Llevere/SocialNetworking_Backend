const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const port = 5000;


app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

async function connectToDatabase() {
    // Corrected the Mongoose connection string
const dbURL = "mongodb+srv://matt:test123@cluster0.50x4dzc.mongodb.net/users";

// Connect to the MongoDB database
mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});
}

connectToDatabase();

const userSchema = {
    email: String,
    password: String
}
const UsersDB = new mongoose.model("User", userSchema);
const forgotPasswordSchema = {
    _id: String,
    email: String,
    resetCode: Array,
    attempts: Number,
    codeExpiry: Date
}

const ForgotPasswordDB = new mongoose.model("ForgotPassword", forgotPasswordSchema);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await UsersDB.findOne({email: email});

    if(!user) return res.status(401).json({message: "Could not find email"});

    const passwordMatch = await bcrypt.compare(password, user.password);

    if(!passwordMatch)
    {
        return res.status(401).json({error: "Password incorrect"})
    }

    // Login is correct
    return res.status(200).json({userId: user._id.toString()})
})

async function addMinutesToTime(minutesToAdd) {
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const options = { timeZone: userTimeZone, year: 'numeric', month: 'numeric', day: 'numeric', hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const localTime = new Date().toLocaleString([], options);

    // Convert the local time to a Date object
    const currentTime = new Date(localTime);

    // Add minutes to the current time
    currentTime.setMinutes(currentTime.getMinutes() + minutesToAdd);

    // Format the new time with the added minutes
    const newLocalTime = currentTime.toLocaleString([], options);

    return newLocalTime;
}


app.get('/:userId', (req, res) => {

    return res.status(200).json({message: 'Success'})
});


app.post('/forgot-password', async (req, res) => {

    const { email } = req.body;

    const user = await UsersDB.findOne({email: email});
    if(!user) return res.status(401).json({message: "Could not find email"});

    var randomCode = [];
    const numberOfDigits = 6;
    for(var i = 0; i < numberOfDigits; i++)
    {
        randomCode.push(Math.floor(Math.random() * 10));
    }

    const numberOfAttempts = 3;
    const minutesTillCodeExpires = 30;
    const codeExpiry = await addMinutesToTime(minutesTillCodeExpires);
    const existingForgotPasswordUser = await ForgotPasswordDB.findOne({email: email});

    

    // Creates the user in the DB if they do not exist
    // Updates the reset code, attemps, and the expiry of the reset code
    if(existingForgotPasswordUser) {
        await ForgotPasswordDB.updateOne({email: email}, {'resetCode': randomCode, 'attempts': numberOfAttempts, 'codeExpiry': codeExpiry});
        console.log(`${email} updated`)
    }
    else {
        console.log(`${email} created in the DB`)
        const forgotPasswordUser = new ForgotPasswordDB ({
            _id: user._id,
            email: email,
            resetCode: randomCode,
            attempts: numberOfAttempts, 
            codeExpiry: new Date(Date.now().toLocaleString())
        })
        await forgotPasswordUser.save();
    }
    
    
    const userIdDocument = await UsersDB.findOne({ email }).select('_id');
    const forgotPasswordIdDocument = await ForgotPasswordDB.findOne({ email }).select('_id');

    if (userIdDocument && forgotPasswordIdDocument && userIdDocument._id.equals(forgotPasswordIdDocument._id)) {
      console.log('User IDs are matching');
    } else {
      console.log('User IDs are not matching');
    }
    return res.status(200).json({userId: forgotPasswordIdDocument._id, resetCode: randomCode});
});

app.post('/forgot-password/:userId', async (req, res) => {


    const {id, authCode } = req.body;

    console.log(authCode);
    const user = await ForgotPasswordDB.findOne({_id: id});

    resetCode = user.resetCode;
    console.log(resetCode);

    var codeMatch = true;
    for(var i = 0; i < authCode.length; i++) 
    {
        if(user.resetCode[i].toString() !== authCode[i]) 
        {
            codeMatch = false;
            break;
        }
    }

    if(!codeMatch) 
    {
        console.log('Code does not match');
        return res.status(401).json({message: 'Code did not match'});

    }
    else{
        console.log('Code matches');
    }
    //if(user.codeExpiry >= new Date(Date.now())) {}
    return res.status(200).json({message: `User ID: ${req.params.userId}`});
});

app.post('/forgot-password/reset/:userId', async (req, res) => {

    console.log(req.body);

    const { userId, password } = req.body;

    const user = await UsersDB.findOne({_id: userId});
    console.log(user);
    if(!user) return res.status(401).json({message: "Could not find ID"});

    const passwordMatch = await bcrypt.compare(password, user.password);

    if(passwordMatch)
    {
        return res.status(401).json({error: "Choose a different password"});
    }

    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);

    await UsersDB.updateOne({_id: userId}, {'password': hashedPassword});
    const userIdDocument = await UsersDB.findOne({_id: userId})
    console.log(userIdDocument);

    ForgotPasswordDB.deleteOne({_id: userId});
    const forgotPasswordId = ForgotPasswordDB.findOne({_id: userId});
    if(forgotPasswordId) console.log("Id is still in the forgotpassword DB");
    else console.log("ID has been removed from forgotpasswords DB");

    return res.status(200).json({message: "Reset password Successfully"});;
});



app.post("/register", async (req, res) => {
    const {email, password, confirmPassword} = req.body;
    console.log(req.body);
    const existingUser = await UsersDB.findOne({email: email});

    if(existingUser) res.status(404).json({error: "Email is already registered"});
    if(password !== confirmPassword) res.status(401).json({error: "Passwords do not match"});

    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new UsersDB ({
        email: email,
        password: hashedPassword
    })

   await newUser.save();
    res.status(200).json({message: "Registered Successfully"});
});



