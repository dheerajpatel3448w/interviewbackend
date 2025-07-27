
import { login,register } from "../controllers/auth.controller.js";
import { verifyToken,generateToken } from "../service/auth.service.js";
import { Router } from "express";
import { userprofile,logout } from "../controllers/auth.controller.js";

const router = Router();
router.route('/login').post(login);

router.route('/register').post(register);


router.route("/user/profile").get( userprofile);

router.route("/user/logout").get(logout);

export default router;