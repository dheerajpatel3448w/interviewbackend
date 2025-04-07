import jwt from "jsonwebtoken";

const secret = '$#dpdominetar3448w'

export const generateToken = async (user) => {
    return jwt.sign({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar:user.avatar,
        role:user.role
    }, secret);
}

export const verifyToken = async (token) => {
    return  jwt.verify(token, secret);
}