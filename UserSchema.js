import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
const friendsSchema = mongoose.Schema({
    friendshipCreated: {
      type: String
    },
    user: {
      userId: mongoose.Schema.Types.ObjectId, 
      firstName: String,
      lastName: String,
    },
    profilePicture: {
      type: String
    }
    // friends: [{
    //   default: null,
    //   type: Object
    // }]
});

//friendsSchema.add({ friends: [friendsSchema] });

function formatDateWithMinute(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
  return date.toLocaleDateString(undefined, options);
}


const userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    friends: [friendsSchema],
    //Friend requests Sent to other users
    friendRequestsSent: [{
      type: Object,
      default: null
    }],
    //Friend requests Received from other users
    friendRequestsReceive: [{
      type: Object, 
      default: null
    }],
    images: [
      {
        type: Object, // base 64 image(s)
        default: null
      }
    ],
    profileData: {
      profilePicture: {
        type: String,
        default: "https://static.vecteezy.com/system/resources/thumbnails/005/276/776/small/logo-icon-person-on-white-background-free-vector.jpg"
      },
      profileHeader: {
        type: String,
        default: 'https://www.goodfreephotos.com/albums/other-photos/smiley-face-basic.jpg'
      }
    },
    dateRegistered: {
      type: String,
      default: formatDateWithMinute(Date.now())
    }
    // profileImageData: {
    //   // profileIcon:{
    //   //   type: String,
    //   //   default: "https://static.vecteezy.com/system/resources/thumbnails/005/276/776/small/logo-icon-person-on-white-background-free-vector.jpg"
    //   // },
    //   // backgroundColour: {
    //   //   type: String,default: '#FFFFFF'
    //   // },
    //   profileHeader: {
    //     type: String,default: 'https://www.goodfreephotos.com/albums/other-photos/smiley-face-basic.jpg'
    //   },
    //   profilePicture: {
    //     type: String,default: "https://static.vecteezy.com/system/resources/thumbnails/005/276/776/small/logo-icon-person-on-white-background-free-vector.jpg"
    //   }
    // },
    // // navbarSettings: {
    // //   backgroundColour: {
    // //     type: String,default: '#FFFFFF'
    // //   },
    // //   fontFamily: {
    // //     type: String,default: 'sans-serif'
    // //   },
    // //   fontWeight: {
    // //     type: String,default: 400
    // //   },
    // //   fontTextColour: {
    // //     type: String,default: "#000000"
    // //   },
    // // }
})

const UsersDB = new mongoose.model("User", userSchema);
//UsersDB.collection.createIndex({ firstName: 'text', lastName: 'text' });

export default UsersDB;