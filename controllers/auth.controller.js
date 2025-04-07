import { User } from "../models/user.model.js";
import { verifyToken } from "../service/auth.service.js";
import { generateToken } from "../service/auth.service.js";
export const register = async(req,res) => {
    try{
const {fullName,email,username,password}= req.body;
if (!fullName || !email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'All fields are required' 
    });
  }
console.log(fullName , email , password)
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email already registered'
    });
  }
const newUser = await User.create({
    fullName,
    email,
    username,
    password,
    
 });
 console.log(newUser);
 res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: {
      id: newUser._id,
      name: newUser.fullName,
      email: newUser.email
    }
  });

} catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
  
    

}
export const login = async(req,res) => {
    const {email,password}= req.body;
    console.log(email,password);
    const user = await User.findOne({email})
    if(!user){
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = await generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // ✅ Must be `false` in local dev
      sameSite: "lax",
    });
  
    res.json({ message: "Login successful!" });
  
}
