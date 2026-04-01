import { verifyToken } from "../service/auth.service.js";
import { ApiError } from "../utils/apiResponse.js";

/**
 * Middleware: Protect routes — verifies JWT from cookie.
 * Attaches decoded user payload to req.user
 */
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized — no token" });
    }
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized — invalid or expired token" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware: Require specific role (e.g. ADMIN)
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Forbidden — insufficient permissions" });
  }
  next();
};
