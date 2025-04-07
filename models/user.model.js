import { Schema,model } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
const userSchema = new Schema({
    fullName:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
   
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["ADMIN", "USER"],
        default: "USER"
    },
    avatar: {
        type: String,
        default: "/images/default.jpeg"
    },
    
},{
    timestamps: true
})
userSchema.pre("save", async function(next){
    if(this.isModified("password")){
    this.password= await bcrypt.hash(this.password,10);
 next();
    }
    else{
        return next();
    }
})
userSchema.methods.isPasswordCorrect= async function (password) {
    return await bcrypt.compare(password,this.password);
 
     
 }
export const User = new model("User", userSchema);