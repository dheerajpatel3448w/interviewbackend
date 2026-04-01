import { User } from "../models/user.model.js";
import { verifyToken, generateToken } from "../service/auth.service.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// ─────────────────────────────────────────────────────────────
// POST /register
// ─────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  if (!fullName || !email || !password || !username) {
    return errorResponse(res, "All fields are required", 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return errorResponse(res, "Email already registered", 409);
  }

  const newUser = await User.create({ fullName, email, username, password });

  return successResponse(
    res,
    { id: newUser._id, name: newUser.fullName, email: newUser.email },
    "User created successfully",
    201
  );
});

// ─────────────────────────────────────────────────────────────
// POST /login
// ─────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return errorResponse(res, "Email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return errorResponse(res, "Invalid credentials", 401);

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) return errorResponse(res, "Invalid credentials", 401);

  const token = await generateToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return successResponse(res, {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      role: user.role,
    },
  }, "Login successful");
});

// ─────────────────────────────────────────────────────────────
// GET /user/profile
// ─────────────────────────────────────────────────────────────
export const userprofile = asyncHandler(async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ authenticated: false });

  const decoded = await verifyToken(token);
  if (!decoded) return res.status(401).json({ authenticated: false, message: "Invalid or expired token" });

  const user = await User.findById(decoded.id).select("-password -refreshToken");
  if (!user) return errorResponse(res, "User not found", 404);

  return successResponse(res, { user });
});

// ─────────────────────────────────────────────────────────────
// PUT /user/profile
// Update profile fields
// ─────────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    "fullName", "username", "bio", "targetRole", "linkedinUrl",
    "githubUrl", "currentLevel", "targetTechstack", "isPublicProfile",
    "preferredInterviewType", "avatar",
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  if (!user) return errorResponse(res, "User not found", 404);

  return successResponse(res, { user }, "Profile updated successfully");
});

// ─────────────────────────────────────────────────────────────
// PUT /user/change-password
// ─────────────────────────────────────────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return errorResponse(res, "Both current and new password are required", 400);
  }
  if (newPassword.length < 6) {
    return errorResponse(res, "New password must be at least 6 characters", 400);
  }

  const user = await User.findById(req.user.id);
  const isMatch = await user.isPasswordCorrect(currentPassword);
  if (!isMatch) return errorResponse(res, "Current password is incorrect", 401);

  user.password = newPassword;
  await user.save();

  return successResponse(res, null, "Password changed successfully");
});

// ─────────────────────────────────────────────────────────────
// GET /user/logout
// ─────────────────────────────────────────────────────────────
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  return res.status(200).json({ success: true, message: "Logout successful" });
};