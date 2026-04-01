import jwt from "jsonwebtoken";

const getSecret = () => process.env.JWT_SECRET || "$#dpdominetar3448w";

export const generateToken = async (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
    },
    getSecret(),
    { expiresIn: "7d" }
  );
};

export const verifyToken = async (token) => {
  try {
    return jwt.verify(token, getSecret());
  } catch (err) {
    return null;
  }
};