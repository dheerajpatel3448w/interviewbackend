
import { login,register } from "../controllers/auth.controller.js";
import { verifyToken,generateToken } from "../service/auth.service.js";
import { Router } from "express";
import { userprofile } from "../controllers/auth.controller.js";

const router = Router();
router.route('/login').post(login);

router.route('/register').post(register);
router.route('/logout').get((req, res) => {

    res.clearCookie("token").json({ message: "Logged out successfully" });
    });

router.route("/user/profile").get( userprofile);

export default router;