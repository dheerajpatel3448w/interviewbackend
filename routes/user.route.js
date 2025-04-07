
import { login,register } from "../controllers/auth.controller.js";
import { verifyToken,generateToken } from "../service/auth.service.js";
import { Router } from "express";

const router = Router();
router.route('/login').post(login);

router.route('/register').post(register);
router.route('/logout').get((req, res) => {

    res.clearCookie("token").json({ message: "Logged out successfully" });
    });

router.route("/auth").get( async(req, res) => {
    const token =  req.cookies.token;
    console.log(token);
    if (!token) return res.status(401).json({ authenticated: false });
  
    try {
      const decoded = await verifyToken(token);
      console.log(decoded);
      res.json({ authenticated: true,
       
      
      });
    } catch (err) {
      res.status(401).json({ authenticated: false });
    }
  });

export default router;