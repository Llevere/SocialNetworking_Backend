import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    user: {
      userId: String,
      firstName: String,
      lastName: String,
      profilePicture: String
    },
    text: String,
    dateCreated: Date,
    likes: [{
      type: Object,
      default: null
      /*
      userId: String,
      firstName: String,
      lastName: String,
      email: String,
    */
    }],
    dislikes: [{
      type: Object,
      default: null
      /*
      userId: String,
      firstName: String,
      lastName: String,
      email: String,
    */
    }],
    replies: [{
      type: Object,
      default: null
    }], // This will be an array of nested comments
    
  });

  commentSchema.add({ replies: [commentSchema] }); // Have the replies follow it's own schema

const userPostSchema = {
    userId: String,
    firstName: String,
    lastName: String,
    content: String,
    dateCreated: Date,
    profilePicture: String,
    comments: [commentSchema], // Reference to comments
    likes: [{
      /*
      userId: String,
      firstName: String,
      lastName: String,
      email: String,
    */
      type: Object,
      default: null
      
    }],
    dislikes: [{
      type: Object, 
      default: null
      /*
      userId: String,
      firstName: String,
      lastName: String,
      email: String,
    */
    }] // Reference to likes
    
}


const UserPostDB = new mongoose.model("Posts", userPostSchema);

export default UserPostDB;