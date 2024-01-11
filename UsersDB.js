import userSchema from './UserSchema.js';
import mongoose from 'mongoose'
const UsersDB = new mongoose.model("User", userSchema);
export default UsersDB