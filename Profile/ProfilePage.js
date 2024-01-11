import UsersDB from "../UserSchema.js";
import UserPostDB from "../UserPostSchema.js";
import app from "../AppPort.js";
import transporter from "../nodemailer.js";
import crypto from "crypto";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
// Code from https://medium.com/@techsuneel99/how-to-upload-images-and-videos-in-node-js-with-mongodb-655975803ebe
const storage = multer.memoryStorage();
const upload = multer({ storage });

// const transporter = nodemailer.createTransport({
//   service: 'Hotamil', // Use a specific email service provider like Gmail, SendGrid, etc.
//   auth: {
//     user: 'MattsSocialProject@hotmail.com',
//     pass: 'Levere94!!',
//   },
// });

// const transporter = nodemailer.createTransport({
//   host: 'smtp.office365.com',
//   port: 587,
//   secure: true, // STARTTLS is used, so set secure to true
//   auth: {
//     user: 'MattsSocialProject@hotmail.com',
//     pass: 'Levere94!!',
//   },
// });

// const htmlEmail = (resetCode) => {

//   //console.log(resetCode.toString())
//   return (
//     `<h1>Reset Code</h1>
//     <p>${resetCode.toString()}</p>`
//   )

// }

// const sendEmail = async (to, subject, html) => {
//   const mailOptions = {
//     from: 'Matt Levere <MattsSocialProject@hotmail.com>',
//     to,
//     subject,
//     html,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent: ' + info.response);
//   } catch (error) {
//     console.error('Error sending email:', error);
//   }
// };

// app.post('/sendEmail', async (req, res) => {
//   const { to, subject} = req.body;

//   try {
//     await sendEmail(to, subject, htmlEmail());
//     res.status(200).json({ success: true, message: 'Email sent successfully' });
//   } catch (error) {
//     console.error('Error sending email:', error);
//     res.status(500).json({ success: false, message: 'Error sending email' });
//   }
// })

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

app.post("/friendRequest/delete", async (req, res) => {
  const { friendRequestData, userId } = req.body;
  console.log(
    "Friend request - deleting: " + JSON.stringify(friendRequestData),
    userId
  );
  try {
    const friend = await UsersDB.findOne({ _id: friendRequestData._id });
    const user = await UsersDB.findOne({ _id: userId });

    if (!friend) {
      console.log("Could not find friend when adding friend request");
      return res
        .status(201)
        .json({ message: "Could not find friend when adding friend request." });
    }
    if (!user) {
      console.log("Could not find User when adding friend request");
      return res
        .status(201)
        .json({ message: "Could not find User when adding friend request." });
    }

    const existingRequestIndex = await user.friendRequestsReceive.findIndex(
      (request) => request._id.equals(friend._id)
    );
    console.log("User Request: " + existingRequestIndex);
    if (existingRequestIndex !== -1) {
      user.friendRequestsReceive.splice(existingRequestIndex, 1);
      await user.save();
      //return res.status(200).json({ status: "Add Friend", delete: false});
    }
    const existingRequestIndexInFriend =
      await friend.friendRequestsSent.findIndex((request) =>
        request._id.equals(userId)
      );
    console.log("Friend Request: " + existingRequestIndexInFriend);
    // console.log(friendRequest.friendRequestsReceive)
    if (existingRequestIndexInFriend !== -1) {
      friend.friendRequestsSent.splice(existingRequestIndexInFriend, 1);
      await friend.save();
    }

    if (existingRequestIndex !== -1 && existingRequestIndexInFriend !== -1) {
      return res
        .status(200)
        .json({ friendRequests: user.friendRequestsReceive });
    } else if (
      existingRequestIndex !== -1 ||
      existingRequestIndexInFriend !== -1
    ) {
      if (existingRequestIndex !== -1)
        console.log("User deleted friend request.");
      if (existingRequestIndexInFriend !== -1)
        console.log("Friend deleted Users friend request.");
      return res.status(200).json({ status: "Error" });
    } else {
      return res.status(401).json({
        message: "Something went wrong when deleting a friend request.",
      });
    }
  } catch (error) {
    console.log("Error when deleting friend request: " + error);
    return res.status(401).json({
      message: "Something went wrong when deleting a friend request.",
    });
  }
});

app.post("/friendRequest/accept", async (req, res) => {
  const { friendRequestData, userId } = req.body;
  // console.log("Friend Request Id: " + friendRequestData._id);
  // console.log("User Id: " + userId);
  try {
    const friend = await UsersDB.findOne({ _id: friendRequestData._id });
    const user = await UsersDB.findOne({ _id: userId });

    if (!friend) {
      console.log("Could not find friend when adding friend request");
      return res
        .status(201)
        .json({ message: "Could not find friend when adding friend request." });
    }
    if (!user) {
      console.log("Could not find User when adding friend request");
      return res
        .status(201)
        .json({ message: "Could not find User when adding friend request." });
    }
    const newFriendForUser = {
      friendshipCreated: formatDateWithMinute(Date.now()),
      user: {
        userId: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
      },
      profilePicture: friend.profileData.profilePicture,
      // friends: [friend.friends]
    };
    await user.friends.push(newFriendForUser);

    const newFriendForFriend = {
      friendshipCreated: formatDateWithMinute(Date.now()),
      user: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      profilePicture: user.profileData.profilePicture,
      // friends: [friend.friends]
    };
    await friend.friends.push(newFriendForFriend);

    //console.log(user.friendRequestsReceive)
    //console.log("Friends: " + user.friends);
    // Remove friend request data from user's friendRequestsSent array
    //  await UsersDB.updateOne(
    //   { _id: userId },
    //   { $pull: { friendRequestsSent: { _id: friendRequestData._id } } }
    // );

    // // Remove friend request data from friend's friendRequestsReceive array
    // await UsersDB.updateOne(
    //   { _id: friendRequestData._id },
    //   { $pull: { friendRequestsReceive: { _id: userId } } }
    // );

    const existingRequestIndex = await user.friendRequestsReceive.findIndex(
      (request) => request._id.equals(friend._id)
    );
    console.log("Friend Request: " + existingRequestIndex);
    if (existingRequestIndex !== -1) {
      // Friend request exists
      user.friendRequestsReceive.splice(existingRequestIndex, 1);
      await user.save();
      //return res.status(200).json({ status: "Add Friend", delete: false});
    }
    const existingRequestIndexInFriend =
      await friend.friendRequestsSent.findIndex((request) =>
        request._id.equals(userId)
      );

    if (existingRequestIndexInFriend !== -1) {
      // Friend request already exists
      console.log(
        "Friend request already exists in Friends Array. Removing it now."
      );
      friend.friendRequestsSent.splice(existingRequestIndexInFriend, 1);
      await friend.save();
    }

    console.log("Friend request accepted successfully");

    console.log(user.friendRequestsReceive);
    return res.status(200).json({
      friendRequests: user.friendRequestsReceive,
      friendData: newFriendForUser,
      allFriends: user.friends,
    });
  } catch (error) {
    console.log("Error when confirming the friend request: " + error);
    return res
      .status(401)
      .json({ message: "Error when confirming the friend request: " + error });
  }
});

app.delete("/deleteFriend", async (req, res) => {
  const { friendId, userId } = req.body;

  //console.log("Deleting friend data: " + friendId + ' ' + userId)
  try {
    const user = await UsersDB.findOne({ _id: userId });

    if (!user) {
      console.log(
        "Could not find user when deleting a friend from profile page."
      );
      return res.status(401).json({ message: "Could not find user." });
    }

    const friend = await UsersDB.findOne({ _id: friendId });
    if (!friend) {
      console.log(
        "Could not find friend when deleting a user from profile page."
      );
      return res.status(401).json({ message: "Could not find users friend." });
    }

    const userIndex = await user.friends.findIndex((friend) =>
      friend.user.userId.equals(friendId)
    );
    const friendIndex = await friend.friends.findIndex((user) =>
      user.user.userId.equals(userId)
    );

    //Found user and friend in respective friend array
    if (userIndex !== -1 && friendIndex !== -1) {
      console.log("Deleting friends now.");
      user.friends.splice(userIndex, 1);
      friend.friends.splice(friendIndex, 1);

      user.save();
      friend.save();

      return res.status(200).json({
        message: "Friend deletion was successful.",
        updatedFriends: user.friends,
      });
    } else {
      if (userIndex !== -1 && friendIndex < 0)
        return res
          .status(401)
          .json({ message: "Could not find user in friends list" });
      else if (friendIndex !== -1 && userIndex < 0)
        return res
          .status(401)
          .json({ message: "Could not find friend in users list" });
      else
        return res
          .status(401)
          .json({ message: "Could not find user and friend in friends list" });
    }
  } catch (error) {
    console.log("Error when deleting a friend: " + error);
  }
});

app.get("/findExistingFriend", async (req, res) => {
  const { friendId, userId } = req.query;

  //console.log("Existing friends: " + friendId, userId);
  //console.log(friendId, userId);
  try {
    const user = await UsersDB.findOne({ _id: userId });

    if (!user) {
      console.log("Could not find user when finding if existing friend");
      return res.status(401).json({ message: "Could not find user." });
    }

    if (user.friends.length < 1) {
      //console.log("Friends List is empty.")
      console.log("Friends list is less than 1.");
      return res.status(200).json({ existingFriends: false });
    } else {
      const existingFriend = await user.friends.findIndex((friend) =>
        friend.user.userId.equals(friendId)
      );

      //console.log("Existing friends: " + existingFriend)
      // if(existingFriend){
      //   console.log("ExistingFriends variable is true: " + existingFriend)
      if (existingFriend !== -1) {
        //console.log("existing friends: true");
        //console.log("Existing friends already.")
        return res.status(200).json({ existingFriends: true });
      } else {
        //console.log("existing friends: false");
        //console.log("Not friend already.")
        return res.status(200).json({ existingFriends: false });
      }

      // else{
      //   console.log("ExistingFriends variable is not true. " + existingFriend)
      // }
    }
  } catch (error) {
    console.log(
      "Error when fetching data for finding existing friends: " + error
    );
    return res.status(401).json({ existingFriends: false });
  }
});

app.get("/findFriendRequest", async (req, res) => {
  //const {addFriendID, userId} = req.body;
  // console.log("Friend ID: " + addFriendID + ' ' + userId)
  const { addFriendID, userId } = req.query;
  try {
    const user = await UsersDB.findOne({ _id: userId });

    if (!user) {
      console.log("Could not find user when finding friend request.");
      return res.status(401).json({ message: "Could not find user." });
    }

    const existingRequest = await user.friendRequestsSent.findIndex((request) =>
      request._id.equals(addFriendID)
    );
    //  console.log("Get Request: " + existingRequest)
    if (existingRequest !== -1) {
      res.status(200).json({ status: "Friend Request Sent", delete: true });
    } else {
      res.status(200).json({ status: "Add Friend", delete: false });
    }
  } catch (error) {
    console.log("Error when fetching data for friend request: " + error);
    res.status(401).json({});
  }
});

app.post("/addFriend", async (req, res) => {
  const { addFriendID, userId } = req.body;
  console.log("AddFriendID: " + addFriendID + " " + userId);
  try {
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      console.log("Could not find user when adding a friend.");
      return res.status(401).json({ message: "Could not find user." });
    }
    const friendRequest = await UsersDB.findOne({ _id: addFriendID });
    // console.log(user.friendRequestsSent)
    const existingRequestIndex = await user.friendRequestsSent.findIndex(
      (request) => request._id.equals(addFriendID)
    );
    //console.log("User Request: " + existingRequestIndex);
    if (existingRequestIndex !== -1) {
      // Friend request already exists
      console.log(
        "Friend request already exists in Users array. Removing it now."
      );
      user.friendRequestsSent.splice(existingRequestIndex, 1);
      await user.save();
      //return res.status(200).json({ status: "Add Friend", delete: false});
    }
    const existingRequestIndexInFriend =
      await friendRequest.friendRequestsReceive.findIndex((request) =>
        request._id.equals(userId)
      );
    // console.log("Friend Request: " + existingRequestIndexInFriend);
    // console.log(friendRequest.friendRequestsReceive)
    if (existingRequestIndexInFriend !== -1) {
      // Friend request already exists
      console.log(
        "Friend request already exists in Friends Array. Removing it now."
      );
      friendRequest.friendRequestsReceive.splice(
        existingRequestIndexInFriend,
        1
      );
      await friendRequest.save();
    }

    if (existingRequestIndex !== -1 && existingRequestIndexInFriend !== -1) {
      return res.status(200).json({ status: "Add Friend", delete: false });
    } else if (
      existingRequestIndex !== -1 ||
      existingRequestIndexInFriend !== -1
    ) {
      if (existingRequestIndex !== -1)
        console.log("User deleted friend request.");
      if (existingRequestIndexInFriend !== -1)
        console.log("Friend deleted Users friend request.");
      return res.status(201).json({ status: "Error", delete: false });
    } else {
      const friendsData = {
        _id: friendRequest._id,
        dateSend: formatDateWithMinute(Date.now()),
        firstName: friendRequest.firstName,
        lastName: friendRequest.lastName,
        profilePicture: friendRequest.profileData.profilePicture,
      };

      const userData = {
        _id: user._id,
        dateSend: formatDateWithMinute(Date.now()),
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profileData.profilePicture,
      };
      user.friendRequestsSent.push(friendsData);
      friendRequest.friendRequestsReceive.push(userData);
      await user.save();
      await friendRequest.save();
      console.log("Successfully added the friend request.");
      return res
        .status(200)
        .json({ status: "Friend Request Sent", delete: true });
    }
  } catch (error) {
    console.log("Error when sending a friend request: " + error);
    return res.status(401).json({});
  }
});

app.post("/user/image", async (req, res) => {
  const { userId, image } = req.body;
  console.log("Image backend hit");
  try {
    const user = await UsersDB.findOne({ _id: userId });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Could not find user when uploading an image." });
    }
    const imageData = {
      fileName: image,
      uploadDate: formatDateWithMinute(Date.now()),
    };
    user.images.push(imageData);

    //await user.save();

    return res.status(200).json({ message: "Image uploaded successfully." });
  } catch (error) {
    console.log("Error when uploading profile picture: " + error);
  }
});

app.post("/profile/upload/image", async (req, res) => {
  const { userId, image } = req.body;
  console.log("Uploading image called.", userId);
  try {
    const user = await UsersDB.findOne({ _id: userId });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Could not find user when uploading an image." });
    }
    console.log("Hashing image.");
    const uploadedImageHash = calculateImageHash(image);

    // Save the image details along with the hash
    const imageData = {
      _id: uuidv4(),
      fileName: image,
      uploadDate: formatDateWithMinute(Date.now()),
      hash: uploadedImageHash,
    };
    user.images.push(imageData);

    await user.save();
    console.log("User saved. returning.");
    const imageDataToSend = {
      _id: imageData._id,
      fileName: image,
    };
    return res.status(200).json({
      message: "Image uploaded successfully.",
      imageObject: imageDataToSend,
    });
  } catch (error) {
    console.log("Error when uploading profile picture: " + error);
  }
});

app.post("/upload", async (req, res) => {
  const { userId, image } = req.body;

  try {
    // Find the user by userId
    const user = await UsersDB.findOne({ _id: userId });
    console.log("Finding User: " + userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log("User found: ");

    user.images.push(image);
    console.log("Saving image");
    // Save the updated user document
    await user.save();
    console.log("Saved image");
    return res
      .status(200)
      .json({ message: "Image uploaded successfully", image: image });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get(`/profileImages/:userId`, async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await UsersDB.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ images: user.profileData });
  } catch (error) {
    console.error("Error GETTING profile images:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/images/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find the user by userId
    const user = await UsersDB.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const images = user.images || []; // Handle null or undefined
    return res.status(200).json({ images: images });
  } catch (error) {
    console.error("Error getting images:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Function to calculate the hash of an image
const calculateImageHash = (image) => {
  const hash = crypto.createHash("sha256");
  hash.update(image);
  return hash.digest("hex");
};

app.post("/upload/profilePicture", async (req, res) => {
  const { userId, image } = req.body;

  try {
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.profileData.profilePicture = image;

    // Calculate hash of the newly uploaded image
    const uploadedImageHash = calculateImageHash(image);

    // Check if the hash already exists in the user's images
    const isImageAlreadyUploaded = user.images.some(
      (img) => img.hash === uploadedImageHash
    );

    if (isImageAlreadyUploaded) {
      await user.save();

      console.log(
        "Image already exists. Not uploading picture. Profile Picture saved."
      );
      return res.status(200).json({
        message: "Profile Picture Set successfully (Image already exists)",
        userImages: user.images,
        userProfileData: user.profileData,
      });
    }

    // Save the image details along with the hash
    const imageData = {
      _id: uuidv4(),
      fileName: image,
      uploadDate: formatDateWithMinute(Date.now()),
      hash: uploadedImageHash,
    };

    user.images.push(imageData);
    await user.save();

    console.log("Profile picture saved.");
    return res.status(200).json({
      message: "Profile Picture Set successfully",
      userImages: user.images,
      userProfileData: user.profileData,
    });

    // const imageData = {
    //   _id: uuidv4(),
    //   fileName: image,
    //   uploadDate: formatDateWithMinute(Date.now())
    // }
    // user.images.push(imageData);

    // await user.save();
    // console.log("Profile picture saved.")
    // return res.status(200).json({ message: 'Profile Picture Set successfully',
    // userImages: user.images, userProfileData: user.profileData});
  } catch (error) {
    console.error("Error setting profile Picture:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/upload/profileHeader", async (req, res) => {
  const { userId, image } = req.body;

  try {
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Calculate hash of the newly uploaded image
    const uploadedImageHash = calculateImageHash(image);

    // Check if the hash already exists in the user's images
    const isImageAlreadyUploaded = user.images.some(
      (img) => img.hash === uploadedImageHash
    );

    if (isImageAlreadyUploaded) {
      await user.save();

      console.log(
        "Image already exists. Not uploading picture. Profile Picture saved."
      );
      return res.status(200).json({
        message: "Profile Picture Set successfully (Image already exists)",
        userImages: user.images,
        userProfileData: user.profileData,
      });
    }

    // Save the image details along with the hash
    const imageData = {
      _id: uuidv4(),
      fileName: image,
      uploadDate: formatDateWithMinute(Date.now()),
      hash: uploadedImageHash,
    };

    user.images.push(imageData);
    await user.save();

    console.log("Profile picture saved.");
    return res.status(200).json({
      message: "Profile Picture Set successfully",
      userImages: user.images,
      userProfileData: user.profileData,
    });
  } catch (error) {
    console.error("Error setting profile Picture:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/upload/profileIcon", async (req, res) => {
  const { userId, image } = req.body;

  try {
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.profileData.profileIcon = image;

    user.images.push(image);
    await user.save();
    console.log("Profile Icon saved.");
    return res.status(200).json({
      message: "Profile Picture Set successfully",
      profilePicture: user.profileData.profileIcon,
    });
  } catch (error) {
    console.error("Error setting profile Picture:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/existingFriends", async (req, res) => {
  const { profileId, userId } = req.query;

  try {
    const user = await UsersDB.findOne({ _id: profileId });
    // console.log("User: " + JSON.stringify(user));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingFriend = await user.friends.findIndex((friend) =>
      friend.user.userId.equals(userId)
    );
    //console.log("Existing friend GET request: " + existingFriend, profileId, userId);
    if (existingFriend !== -1) {
      //console.log("Returning true")
      return res.status(200).json({ status: true });
    } else {
      //console.log("Returning false")
      return res.status(200).json({ status: false });
    }
  } catch (error) {
    console.log("Error when fetching data for friend request!!: " + error);
    res.status(401).json({});
  }
});

app.get("/user/profile/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await UsersDB.findOne({ _id: userId });

    if (!user) {
      console.log("Could not find user in '/user/profile/:userId'");
      return res.status(201).json({ message: "Could not find the user" });
    }
    //console.log("Found user");
    const userData = {
      userId: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      friends: user.friends,
      images: user.images,
      profileData: user.profileData,
      friendRequestsReceive: user.friendRequestsReceive,
      friendRequestsSent: user.friendRequestsSent,
    };
    return res.status(200).json({ userData: userData });
  } catch (error) {
    //console.error('Error retrieving user:', error);
    if (error instanceof mongoose.Error.CastError) {
      // Handle CastError specifically
      return res.status(201).json({ error: "Invalid user ID" });
    }

    console.error("Error retrieving user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/profile/posts/:userId", async (req, res) => {
  const id = req.params.userId;

  try {
    const user = await UsersDB.findOne({ _id: id });
    if (!user) {
      console.log("Could not find user in 'GET /profile/posts/:userId");
      return res.status(201).json({ message: "Could not find the user" });
    }

    const posts = await UserPostDB.find({ userId: id }).sort({
      dateCreated: -1,
    });
    const userContent = await posts.map((post) => post);
    //console.log(userContent);
    return res.status(200).json({ userPosts: userContent });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error in profile/posts GET" });
  }
});

app.post("/upload/profileBackgroundColour", async (req, res) => {
  const { userId, backgroundColour } = req.body;

  try {
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.profileData.backgroundColour = backgroundColour;

    await user.save();
    console.log("Profile background colour saved.");
    return res.status(200).json({
      message: "Profile Picture Set successfully",
      backgroundColour: user.profileData.backgroundColour,
    });
  } catch (error) {
    console.error("Error POSTING profile Picture:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get(`/upload/profileBackgroundColour/:userId`, async (req, res) => {
  const userId = req.params.userId;
  // UsersDB.collection.getIndexes().then(indexes => {
  //   console.log("Users indexes: " + JSON.stringify(indexes));
  // });
  try {
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    //console.log("Returning background colour " + user.profileImageData.backgroundColour)
    //if(user.profileImageData.backgroundColour === (null || undefined)) user.profileImageData.backgroundColour = '#FFFFF';
    return res
      .status(200)
      .json({ backgroundColour: user.profileData.backgroundColour });
  } catch (error) {
    console.log("Error GETTING the background colour: " + error);
  }
});

app.get("/upload/profileBorderColour/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await UsersDB.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    //console.log("Returning profile border colour " + user.profileImageData.profileBorderColour)
    //if(user.profileImageData.backgroundColour === (null || undefined)) user.profileImageData.backgroundColour = '#FFFFF';
    return res
      .status(200)
      .json({ backgroundColour: user.profileData.profileBorderColour });
  } catch (error) {
    console.log("Error GETTING the profile border colour: " + error);
  }
});
