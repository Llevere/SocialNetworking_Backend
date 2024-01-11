import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import "./Profile/ProfilePage.js";
import UsersDB from "./UserSchema.js";
import UserPostDB from "./UserPostSchema.js";
import app from "./AppPort.js";
import nodemailer from "nodemailer";
import moment from "moment";

async function connectToDatabase() {
  // Corrected the Mongoose connection string
  const dbURL = "mongodb+srv://matt:test123@cluster0.50x4dzc.mongodb.net/users";

  // Connect to the MongoDB database
  mongoose
    .connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Mongoose connected to MongoDB"))
    .catch((err) => console.error("Mongoose connection error:", err));
}

connectToDatabase();

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // STARTTLS is used, so set secure to false
  auth: {
    user: "MattsSocialProject@hotmail.com",
    pass: "Levere94!!",
  },
});
// const userSchema = {
//     firstName: String,
//     lastName: String,
//     email: String,
//     password: String,
//     friends: {
//       type: [String],
//       required: false,
//     },
//     images: [
//       {
//         type: String, // base 64 image(s)
//         default: null,
//         required: false
//       }
//     ],
//     profileImageData: {
//       profileIcon:{
//         type: String,
//         required: false
//       },
//       backgroundColour: {
//         type: String,
//         required: false
//       },
//       profileHeader: {
//         type: String,
//         required: false
//       },
//       profilePicture: {
//         type: String,
//         required: false
//       },
//     }
// }
// const UsersDB = new mongoose.model("User", userSchema);

function formatDateWithMinute(dateString) {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  return date.toLocaleDateString(undefined, options);
}

function formatDateWithAdded30Minutes(dateString) {
  const date = new Date(dateString);
  date.setMinutes(date.getMinutes() + 30);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  return date.toLocaleDateString(undefined, options);
}

function formatDateWithoutMinute(dateString) {
  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    hour12: true,
  };
  return date.toLocaleDateString(undefined, options);
}

const forgotPasswordSchema = {
  _id: String,
  email: String,
  resetCode: Array,
  attempts: Number,
  codeExpiry: Date,
};

const ForgotPasswordDB = new mongoose.model(
  "ForgotPassword",
  forgotPasswordSchema
);

app.get("/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  const user = await UsersDB.findOne({ _id: userId });
  const userData = {
    userId: userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
  return res.json(userData);
});

// const replySchema = new mongoose.Schema({
//   user: {
//     userId: String,
//     firstName: String,
//     lastName: String,
//     // ... other user fields
//   },
//   text: String,
//   dateCreated: String,
//   replies: [],
//   _id: {
//     type: mongoose.Schema.Types.ObjectId, // Change the type to ObjectId
//     default: () => new mongoose.Types.ObjectId(), // Generate a new ObjectId
//   },
// });
// replySchema.add({ replies: [replySchema] }); // Have the replies follow it's own schema

app.post("/user/post/like/reply", async (req, res) => {
  const { userId, postId, commentId, replyId, path } = req.body;
  console.log("Path: " + path);
  try {
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      return res
        .status(404)
        .json({ message: `No user found with id ${userId}` });
    }

    // Find the post
    const post = await UserPostDB.findOne({ _id: postId });
    if (!post) {
      return res
        .status(404)
        .json({ message: `No post found with id ${postId}` });
    }

    const comment = post.comments.find((c) => c._id.toString() === commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ message: `No comment found with id ${commentId}` });
    }
    if (comment) {
      console.log("Entering comment block.\n");
      var data = "";
      var temp = comment;
      for (let i = 1; i < path.length; i++) {
        data = temp.replies[path[i]];
        temp = data;
      }

      //console.log("Data: " + JSON.stringify(data) + "\nTemp: " + JSON.stringify(temp));
      const userLikedReplyIndex = data.likes.findIndex(
        (like) => like.userId.toString() === user._id.toString()
      );
      if (userLikedReplyIndex !== -1) {
        // If the user has liked the post, remove the like
        data.likes.splice(userLikedReplyIndex, 1);
        console.log("Like being removed.");
      } else {
        const userLikeData = {
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profileData.profilePicture,
        };

        data.likes.push(userLikeData);
        console.log("Like being added.");
      }
      await post.save();
    }

    return res.status(200).json({});
  } catch (error) {}
});
// Like a Post
app.post("/user/post/like", async (req, res) => {
  const { userId, postId } = req.body;

  try {
    // Ensure that the user exists
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      return res
        .status(404)
        .json({ message: `No user found with id ${userId}` });
    }

    // Find the post
    const post = await UserPostDB.findOne({ _id: postId });
    if (!post) {
      return res
        .status(404)
        .json({ message: `No post found with id ${postId}` });
    }

    const userLikedPostIndex = post.likes.findIndex(
      (like) => like.userId.toString() === user._id.toString()
    );
    if (userLikedPostIndex !== -1) {
      // If the user has liked the post, remove the like
      post.likes.splice(userLikedPostIndex, 1);
    } else {
      // If the user hasn't liked the post, add the like (store entire user data)
      const userLikeData = {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePicture: user.profileData.profilePicture,
      };
      post.likes.push(userLikeData);
    }

    // Save the updated post
    await post.save();

    return res.status(200).json({ message: "Post liked/unliked successfully" });
  } catch (error) {
    console.error("Error in /user/post/like route:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/user/post/like/comment", async (req, res) => {
  const { userId, postId, commentId } = req.body;

  try {
    // Ensure that the user exists
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      return res
        .status(404)
        .json({ message: `No user found with id ${userId}` });
    }

    // Find the post
    const post = await UserPostDB.findOne({ _id: postId });
    if (!post) {
      return res
        .status(404)
        .json({ message: `No post found with id ${postId}` });
    }

    const comment = post.comments.find((c) => c._id.toString() === commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ message: `No comment found with id ${commentId}` });
    }
    if (comment) {
      const userLikedPostCommentIndex = comment.likes.findIndex(
        (like) => like.userId.toString() === user._id.toString()
      );
      // If the user has liked the posts comment, remove the like
      if (userLikedPostCommentIndex !== -1) {
        comment.likes.splice(userLikedPostCommentIndex, 1);
      } else {
        // If the user hasn't liked the post, add the like (store entire user data)
        const userLikeData = {
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profilePicture: user.profileData.profilePicture,
        };
        comment.likes.push(userLikeData);
      }
    }

    //Save the updated post
    //await post.save();
    await post.save();

    return res.status(200).json({ message: "Post liked/unliked successfully" });
  } catch (error) {
    console.error("Error in /user/post/like route:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

app.delete("/post/delete", async (req, res) => {
  const { postId, userId } = req.body;
  try {
    const postToDelete = await UserPostDB.findOne({ _id: postId });

    if (postToDelete && postToDelete.userId === userId) {
      const result = await UserPostDB.deleteOne({ _id: postId });
      if (result.deletedCount > 0) return res.status(204).json({});
      else {
        console.log(result);
        return res.status(200).json({ message: "No documents deleted." });
      }
    } else if (postToDelete && postToDelete !== userId) {
      return res.status(401).json({
        message: "Unauthorized: This post does not belong to the user. ",
      });
    } else {
      return res
        .status(400)
        .json({ message: "Something went wrong when deleting a post." });
    }
  } catch (error) {
    console.error("Error: " + error);
  }
});

app.get("/search/:searchText", async (req, res) => {
  const query = req.params.searchText;

  try {
    const regex = new RegExp(query, "i");

    //Sort by firstName
    const results = await UsersDB.find({
      $or: [{ firstName: { $regex: regex } }, { lastName: { $regex: regex } }],
    }).sort({ firstName: -1 });

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/userProfile/:userId", async (req, res) => {
  const { userId } = req.params;
  const user = await UsersDB.findOne({ _id: userId });

  // Extract only the email from the user object
  const userEmail = JSON.stringify(user.email);
  const email = userEmail.substring(1, userEmail.length - 1).split("@")[0];
  // Send the email as the response
  res.status(200).json({ email: email });
});

// Reply to a Comment
app.post("/user/post/reply", async (req, res) => {
  const { userId, postId, commentId, replyText } = req.body;

  try {
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      return res
        .status(404)
        .json({ message: `No user found with id ${req.params.userId}` });
    }
    // Find the post and comment to which the reply is being added
    const post = await UserPostDB.findOne({ _id: postId });
    if (!post) {
      return res
        .status(404)
        .json({ message: `No post found with id ${postId}` });
    }

    const comment = findCommentById(post.comments, commentId);
    console.log("Comment found: " + JSON.stringify(comment));
    if (!comment) {
      return res
        .status(404)
        .json({ message: `No comment found with id ${commentId}` });
    }

    const newReply = {
      _id: new mongoose.Types.ObjectId(),
      user: {
        userId: post.userId,
        firstName: post.firstName,
        lastName: post.lastName,
        profilePicture: user.profileData.profilePicture,
      },
      text: replyText,
      dateCreated: Date.now(),
      likes: [],
      dislikes: [],
      replies: [], // Initialize with an empty array for nested replies
    };

    comment.replies.push(newReply);
    // Save the updated post
    await post.save();
    //const userPosts = await UserPostDB.find({ _id : postId});

    // Create an array of user and friend IDs
    const usersFriendsIds = [userId, ...user.friends];
    const posts = await UserPostDB.find({
      userId: { $in: usersFriendsIds },
    });

    const userContent = posts.map((post) => post);
    return res.status(200).json({ post: userContent });
  } catch (error) {
    console.error("Error in /user/post/reply route:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Helper function to find a comment by its ID
function findCommentById(comments, commentId) {
  for (const comment of comments) {
    if (comment._id && comment._id.toString() === commentId) {
      return comment;
    }
    if (comment.replies && comment.replies.length > 0) {
      const foundComment = findCommentById(comment.replies, commentId);
      if (foundComment) {
        return foundComment;
      }
    }
  }
  return null;
}

// Comment on a Post
app.post("/user/post/comment", async (req, res) => {
  const { userId, postId, commentText } = req.body;

  const user = await UsersDB.findOne({ _id: userId });
  if (!user) {
    res.status(404).json({ message: `No user found with id ${userID}` });
  }

  const post = await UserPostDB.findOne({ _id: postId });
  if (!post) {
    return res.status(404).json({ message: `No post found with id ${postId}` });
  }

  const newComment = {
    user: {
      userId: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePicture: user.profileData.profilePicture,
    },
    text: commentText,
    likes: [],
    dislikes: [],
    dateCreated: Date.now(),
    replies: [],
  };

  post.comments.push(newComment);
  await post.save();
  const usersFriendsIds = [userId, ...user.friends];
  const posts = await UserPostDB.find({
    userId: { $in: usersFriendsIds },
  });

  const userContent = posts.map((post) => post);
  return res.status(200).json({ comments: userContent });
});
app.get("/user/post/:userId", async (req, res) => {
  try {
    const user = await UsersDB.findOne({ _id: req.params.userId });
    console.log("");
    if (!user) {
      return res
        .status(404)
        .json({ message: `No user found with id ${req.params.userId}` });
    }

    const friendUserIds = user.friends.map((friend) => friend.user.userId);
    // Create an array of user and friend IDs
    const usersFriendsIds = [req.params.userId, ...friendUserIds];
    const posts = await UserPostDB.find({
      userId: { $in: usersFriendsIds },
    }).sort({ dateCreated: -1 });

    const userContent = posts.map((post) => post);

    //console.log(usersFriendsIds);
    //console.log(userContent);
    return res.status(200).json(userContent);
  } catch (error) {
    console.log("Error when getting posts in homefeed: " + error);
  }
});

app.post(`/user/post/:userId`, async (req, res) => {
  const { id, postText } = req.body;
  const userId = JSON.parse(id);
  const user = await UsersDB.findOne({ _id: userId.id });
  if (!user)
    return res.status(404).json({ message: `No user found with id ${id}` });
  const newPost = new UserPostDB({
    userId: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    content: postText,
    profilePicture: user.profileData.profilePicture,
    likes: [],
    dislikes: [],
    replies: [],
    dateCreated: Date.now(),
  });

  await newPost.save();
  // Create an array of user and friend IDs
  const usersFriendsIds = [req.params.userId, ...user.friends];
  const posts = await UserPostDB.find({
    userId: { $in: usersFriendsIds },
  });

  const userContent = posts.map((post) => post);

  return res.status(200).json({ userPosts: userContent });
  //return res.status(200).json({ userPosts: ["Hello", "Hi"] });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await UsersDB.findOne({ email: email });
  if (!user) return res.status(401).json({ message: "Could not find email" });
  console.log("Comparing the passwords");
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    console.log("Incorrect Password");
    return res.status(401).json({ error: "Password incorrect" });
  }
  const userData = {
    id: user._id,
  };
  // Login is correct
  return res.status(200).json({ userData: userData });
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await UsersDB.findOne({ email: email });
  if (!user) return res.status(401).json({ message: "Could not find email" });

  var randomCode = [];
  const numberOfDigits = 6;
  for (var i = 0; i < numberOfDigits; i++) {
    // Generates a random number between 0-9 inclusively
    randomCode.push(Math.floor(Math.random() * 10));
  }
  console.log(randomCode);
  const numberOfAttempts = 3;
  const minutesTillCodeExpires = 30;
  //const codeExpiry = await new Date();
  const existingForgotPasswordUser = await ForgotPasswordDB.findOne({
    email: email,
  });

  // Creates the user in the DB if they do not exist
  // Updates the reset code, attemps, and the expiry of the reset code
  if (existingForgotPasswordUser) {
    await ForgotPasswordDB.updateOne(
      { email: email },
      {
        resetCode: randomCode,
        attempts: numberOfAttempts,
        codeExpiry: formatDateWithAdded30Minutes(Date.now()),
      }
    );
    console.log(`${email} updated`);
  } else {
    console.log(`${email} created in the DB`);

    const forgotPasswordUser = new ForgotPasswordDB({
      _id: user._id,
      email: email,
      resetCode: randomCode,
      attempts: numberOfAttempts,
      codeExpiry: new Date().toISOString(),
    });
    await forgotPasswordUser.save();
  }

  // Back end
  const sendEmail = async (to, subject, html) => {
    const mailOptions = {
      from: "Matt Levere <MattsSocialProject@hotmail.com>",
      to,
      subject,
      html,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: " + info.response);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  };

  const htmlEmail = (resetCode) => {
    return `<h1>Reset Code</h1>
      <p>${resetCode.toString()}</p>`;
  };

  // Back end, sending email of reset code
  // By now, the user is found with the email being
  // sent from the front end.
  const to = "MattsSocialProject@hotmail.com";
  const subject = "Reset Code";
  try {
    await sendEmail(to, subject, htmlEmail(randomCode));
    //res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error("Error sending email:", error);
    //res.status(500).json({ success: false, message: 'Error sending email' });
  }

  const userIdDocument = await UsersDB.findOne({ email }).select("_id");
  const forgotPasswordIdDocument = await ForgotPasswordDB.findOne({
    email,
  }).select("_id");

  if (
    userIdDocument &&
    forgotPasswordIdDocument &&
    userIdDocument._id.equals(forgotPasswordIdDocument._id)
  ) {
    console.log("User IDs are matching");
  } else {
    console.log("User IDs are not matching");
  }
  return res
    .status(200)
    .json({ userId: forgotPasswordIdDocument._id, resetCode: randomCode });
});

app.post("/forgot-password/:userId", async (req, res) => {
  const { id, authCode } = req.body;

  //console.log(authCode);
  try {
    const user = await ForgotPasswordDB.findOne({ _id: id });
    if (!user) {
      return res.status(401).json({
        message: "User is not found in the DB when resetting password.",
      });
    }
    //console.log(user.resetCode);
    console.log("Time: " + user.codeExpiry);

    //const codeExpiryDate = moment(user.codeExpiry, 'MMMM DD, YYYY HH:mm');
    const codeExpiryDate = user.codeExpiry;
    const currentTimeDate = new Date();
    console.log(
      codeExpiryDate.format("MMMM DD, YYYY HH:mm") + " " + currentTimeDate
    );
    console.log(
      "Is codeExpiry greater than current time: " +
        (codeExpiryDate > currentTimeDate)
    );
    if (codeExpiryDate < currentTimeDate) {
      console.log("Reset Code has eached expired time. Returning 401 status.");
      return res.status(401).json({
        message:
          "Time has expired since email was sent. Please restart the process.",
        resetCodeExpired: true,
      });
    }
    // console.log("Attemps left: " + user.codeExpiry + ' ' + formatDateWithMinute(Date.now()));
    // console.log("Is codeExpiry greater then current time: " + (user.codeExpiry > formatDateWithMinute(Date.now())))
    var codeMatch = true;
    for (var i = 0; i < authCode.length; i++) {
      if (user.resetCode[i].toString() !== authCode[i]) {
        codeMatch = false;
        break;
      }
    }

    if (!codeMatch) {
      console.log("Code does not match");
      if (user.attempts > 0) {
        user.attempts -= 1;
        await user.save();
        console.log("Attempts left: " + user.attempts);
        if (user.attempts > 0)
          return res
            .status(401)
            .json({ message: "Code did not match", canAttemptMore: true });
        else
          return res
            .status(401)
            .json({ message: "Code did not match", canAttemptMore: false });
      } else {
        // This should never be hit, but is a fail safe.
        // We check the attemps before checking the reset code from the user.

        return res.status(401).json({
          message: "Attempts to rest code has been reached.",
          canAttemptMore: false,
        });
      }
    } else {
      console.log("Code matches");
    }
    //if(user.codeExpiry >= new Date(Date.now())) {}
    return res.status(200).json({ message: `User ID: ${req.params.userId}` });
  } catch (error) {
    return res.status(401).json({
      message: "Something went wrong when reseting password: " + error,
    });
  }
});

app.post("/forgot-password/reset", async (req, res) => {
  //console.log(req.body);

  const { userId, password } = req.body;

  const user = await UsersDB.findOne({ _id: userId });
  //console.log(user);
  if (!user) return res.status(401).json({ message: "Could not find ID" });
  console.log("Checking for password match");
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (passwordMatch) {
    return res
      .status(200)
      .json({ error: "Choose a different password", passwordMatch: true });
  }
  const salt = 10;
  const hashedPassword = await bcrypt.hash(password, salt);

  await UsersDB.updateOne({ _id: userId }, { password: hashedPassword });
  //const userIdDocument = await UsersDB.findOne({_id: userId})
  //console.log(userIdDocument);

  await ForgotPasswordDB.deleteOne({ _id: userId });
  const forgotPasswordId = await ForgotPasswordDB.findOne({ _id: userId });
  if (forgotPasswordId) console.log("Id is still in the forgotpassword DB");
  else console.log("ID has been removed from forgotpasswords DB");

  return res.status(200).json({ message: "Reset password Successfully" });
});

// app.get("/user/compareUsers", async (req, res) => {
//   const {userId, profileId} = req.body;

//   try {
//     const user = await UsersDB.findOne({_id: userId});
//     const profileUser = await UsersDB.findOne()
//     if(!user) {
//       console.log("Could not find user when comparing profile IDs");
//       return res.status(201);
//     }

//     if(user._id === profileId);

//   } catch (error) {
//     console.log("Error trying to find users ID")
//   }
// })

app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;
  const existingUser = await UsersDB.findOne({ email: email });

  if (existingUser)
    res.status(404).json({ error: "Email is already registered" });
  if (password !== confirmPassword)
    res.status(401).json({ error: "Passwords do not match" });

  const salt = 10;
  const hashedPassword = await bcrypt.hash(password, salt);

  const customId = uuidv4();
  const newUser = new UsersDB({
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: hashedPassword,
    images: [
      {
        _id: uuidv4(),
        fileName:
          "https://static.vecteezy.com/system/resources/thumbnails/005/276/776/small/logo-icon-person-on-white-background-free-vector.jpg",
        uploadDate: formatDateWithMinute(Date.now()),
      },
      {
        _id: uuidv4(),
        fileName:
          "https://www.goodfreephotos.com/albums/other-photos/smiley-face-basic.jpg",
        uploadDate: formatDateWithMinute(Date.now()),
      },
    ],
  });

  await newUser.save();
  res.status(200).json({ message: "Registered Successfully" });
});
